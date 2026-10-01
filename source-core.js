import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import ipaddr from 'ipaddr.js'
import { Agent } from 'undici'

const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const DEFAULT_MAX_PLUGINS = 500
const DEFAULT_MAX_REDIRECTS = 3
const GITHUB_MAX_ATTEMPTS = 3
const GITHUB_RETRY_BASE_DELAY_MS = 250
const GITHUB_RETRY_TIMEOUT_MS = 5000
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504])

export const SOURCE_TYPES = Object.freeze(['npm', 'github', 'custom-json', 'corporate'])
export const NPM_DISCOVERY_KEYWORDS = Object.freeze(['dsh-plugin', 'deepseek-harness', 'deepseek-harness-plugin', 'dsh-plugins'])
export const GITHUB_DISCOVERY_QUERIES = Object.freeze([
  'topic:deepseek-harness topic:dsh-plugin',
  'topic:deepseek-harness-plugin',
  'topic:deepseek-harness topic:dsh-plugins',
])

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function normalizeSource(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const id = text(value.id)
  const type = text(value.type)
  const url = text(value.url)
  if (!id || id.length > 64 || !/^[a-z0-9][a-z0-9._~-]*$/i.test(id)) return undefined
  if (!type || !SOURCE_TYPES.includes(type)) return undefined
  if (url && url.length > 2048) return undefined
  return {
    id,
    name: (text(value.name) ?? id).slice(0, 120),
    type,
    ...(url ? { url } : {}),
    enabled: value.enabled !== false,
  }
}

export function isPrivateAddress(address) {
  try {
    return ipaddr.process(address).range() !== 'unicast'
  } catch {
    return true
  }
}

function abortable(promise, signal) {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason ?? new Error('source request aborted'))
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new Error('source request aborted'))
    signal.addEventListener('abort', abort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

async function defaultResolveHost(hostname) {
  if (isIP(hostname)) return [{ address: hostname, family: isIP(hostname) }]
  return dnsLookup(hostname, { all: true, verbatim: true })
}

async function assertSafeUrl(url, options, authenticated) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('only http(s) source URLs are supported')
  if (url.username || url.password) throw new Error('credentials in source URLs are not allowed')
  if (authenticated && url.protocol !== 'https:') throw new Error('authenticated sources require HTTPS')
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) throw new Error('private network destinations are blocked')

  const resolveHost = options.resolveHost ?? defaultResolveHost
  const resolved = await abortable(Promise.resolve(resolveHost(hostname)), options.signal)
  const addresses = resolved
    .map(row => typeof row === 'string' ? { address: row, family: isIP(row) } : row)
    .filter(row => typeof row?.address === 'string' && (row.family === 4 || row.family === 6))

  if (!addresses.length) throw new Error('source hostname resolved to no usable address')
  if (options.allowPrivateNetwork !== true && addresses.some(row => isPrivateAddress(row.address))) {
    throw new Error('private network destinations are blocked')
  }
  return addresses[0]
}

function pinnedDispatcher(address, factory) {
  if (factory) return factory(address)
  return new Agent({
    connect: {
      lookup(_hostname, options, callback) {
        if (options?.all) callback(null, [address])
        else callback(null, address.address, address.family)
      },
    },
  })
}

async function readResponseBytes(response, maxBytes) {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('source response exceeds ' + maxBytes + ' bytes')
  if (!response.body?.getReader) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > maxBytes) throw new Error('source response exceeds ' + maxBytes + ' bytes')
    return bytes
  }
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error('source response exceeds ' + maxBytes + ' bytes')
    }
    chunks.push(value)
  }
  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return joined
}

function retryableSourceError(message, details = {}) {
  const error = new Error(message)
  error.retryable = true
  if (details.status !== undefined) error.status = details.status
  if (details.retryAfterMs !== undefined) error.retryAfterMs = details.retryAfterMs
  return error
}

function githubRateLimitRetryMs(response) {
  if (response.status !== 403) return undefined
  const retryAfterHeader = response.headers.get('retry-after')
  if (retryAfterHeader !== null) {
    const retryAfter = Number(retryAfterHeader)
    if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1000, GITHUB_RETRY_TIMEOUT_MS)
  }
  if (response.headers.get('x-ratelimit-remaining') !== '0') return undefined
  const resetHeader = response.headers.get('x-ratelimit-reset')
  if (resetHeader === null) return undefined
  const resetSeconds = Number(resetHeader)
  if (!Number.isFinite(resetSeconds)) return undefined
  const delayMs = Math.max(0, resetSeconds * 1000 - Date.now())
  return delayMs <= GITHUB_RETRY_TIMEOUT_MS ? delayMs : undefined
}

function waitForRetry(delayMs, signal) {
  if (delayMs <= 0) return Promise.resolve()
  if (signal?.aborted) return Promise.reject(new Error('source request aborted'))
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, delayMs)
    function done() {
      signal?.removeEventListener('abort', aborted)
      resolve()
    }
    function aborted() {
      clearTimeout(timer)
      signal?.removeEventListener('abort', aborted)
      reject(new Error('source request aborted'))
    }
    signal?.addEventListener('abort', aborted, { once: true })
  })
}

async function fetchJsonAttempt(urlInput, source, options, timeoutMs) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new Error('Host fetch is unavailable')
  const maxBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  const authToken = text(options.authToken)
  const headers = {
    accept: 'application/json',
    'user-agent': 'dsh-registry-aggregator/0.5',
    ...(authToken ? { authorization: 'Bearer ' + authToken } : {}),
  }

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const forwardAbort = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener('abort', forwardAbort, { once: true })

  let url = new URL(urlInput)
  try {
    for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
      let dispatcher
      try {
        const address = await assertSafeUrl(url, { ...options, signal: controller.signal }, Boolean(authToken))
        dispatcher = options.fetchImpl && !options.dispatcherFactory ? undefined : pinnedDispatcher(address, options.dispatcherFactory)

        let response
        try {
          response = await fetchImpl(url, {
            method: 'GET',
            headers,
            redirect: 'manual',
            signal: controller.signal,
            ...(dispatcher ? { dispatcher } : {}),
          })
        } catch (error) {
          if (timedOut) throw retryableSourceError('source request timed out')
          if (options.signal?.aborted) throw new Error('source request aborted')
          throw retryableSourceError('source request failed: ' + String(error?.message ?? error))
        }

        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location')
          await response.body?.cancel?.()
          if (!location) throw new Error('source redirect ' + response.status + ' has no Location header')
          if (redirects === maxRedirects) throw new Error('source redirected too many times')
          const next = new URL(location, url)
          if (authToken && next.origin !== url.origin) throw new Error('authenticated source cannot redirect to another origin')
          url = next
          continue
        }

        if (!response.ok) {
          const retryAfterMs = source?.type === 'github' ? githubRateLimitRetryMs(response) : undefined
          await response.body?.cancel?.()
          const message = 'source returned HTTP ' + response.status
          if (RETRYABLE_HTTP_STATUSES.has(response.status) || retryAfterMs !== undefined) {
            throw retryableSourceError(message, { status: response.status, retryAfterMs })
          }
          throw new Error(message)
        }

        const bytes = await readResponseBytes(response, maxBytes)
        try {
          return JSON.parse(new TextDecoder().decode(bytes))
        } catch {
          throw new Error('source returned malformed JSON')
        }
      } finally {
        await dispatcher?.close?.()
      }
    }
    throw new Error('source redirected too many times')
  } catch (error) {
    if (timedOut) throw retryableSourceError('source request timed out')
    if (options.signal?.aborted) throw new Error('source request aborted')
    throw error
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', forwardAbort)
  }
}

export async function fetchJson(urlInput, source, options = {}) {
  const attempts = source?.type === 'github'
    ? Math.min(Math.max(1, options.githubRetryAttempts ?? GITHUB_MAX_ATTEMPTS), GITHUB_MAX_ATTEMPTS)
    : 1
  const firstTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retryTimeoutMs = Math.min(firstTimeoutMs, options.githubRetryTimeoutMs ?? GITHUB_RETRY_TIMEOUT_MS)
  const baseDelayMs = Number.isFinite(options.githubRetryDelayMs)
    ? Math.max(0, options.githubRetryDelayMs)
    : GITHUB_RETRY_BASE_DELAY_MS

  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchJsonAttempt(urlInput, source, options, attempt === 0 ? firstTimeoutMs : retryTimeoutMs)
    } catch (error) {
      lastError = error
      if (options.signal?.aborted || error?.retryable !== true || attempt + 1 >= attempts) throw error
      const delayMs = Math.max(baseDelayMs * (2 ** attempt), Number(error?.retryAfterMs) || 0)
      await waitForRetry(Math.min(delayMs, GITHUB_RETRY_TIMEOUT_MS), options.signal)
    }
  }
  throw lastError
}

function npmSearchUrl(source) {
  if (source.url) {
    const configured = new URL(source.url)
    if (/\/-\/v1\/search\/?$/u.test(configured.pathname)) return configured
    if (!configured.pathname.endsWith('/')) configured.pathname += '/'
    return new URL('-/v1/search', configured)
  }
  return new URL('https://registry.npmjs.org/-/v1/search')
}

function githubSearchUrl(source) {
  return new URL(source.url ?? 'https://api.github.com/search/repositories')
}

function githubHealthUrl(source) {
  const url = githubSearchUrl(source)
  url.search = ''
  url.hash = ''
  url.pathname = url.pathname.replace(/\/search\/repositories\/?$/u, '/rate_limit')
  return url
}

function catalogRows(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    for (const key of ['plugins', 'items', 'results']) {
      if (Array.isArray(value[key])) return value[key]
    }
  }
  throw new Error('catalog JSON must be an array or contain plugins/items/results')
}

function npmRows(value) {
  if (!value || !Array.isArray(value.objects)) throw new Error('npm search returned an invalid response')
  return value.objects.map(entry => entry?.package?.name).filter(name => typeof name === 'string' && name.trim())
}

function githubRows(value) {
  if (!value || !Array.isArray(value.items)) throw new Error('GitHub search returned an invalid response')
  return value.items.map(entry => entry?.full_name ?? entry?.name).filter(name => typeof name === 'string' && name.trim())
}

function cleanUrl(value) {
  const candidate = text(value)
  if (!candidate) return undefined
  try {
    const url = new URL(candidate.replace(/^git\+/, '').replace(/\.git$/u, ''))
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString().replace(/\/$/u, '')
  } catch {
    return undefined
  }
}

function npmPlugin(entry, source) {
  const pkg = entry?.package
  const name = text(pkg?.name)
  if (!name) return undefined
  const repository = cleanUrl(pkg?.links?.repository)
  const npmUrl = cleanUrl(pkg?.links?.npm)
  return {
    key: repository ? 'repo:' + repository.toLowerCase() : 'npm:' + name.toLowerCase(),
    name,
    packageName: name,
    ...(text(pkg?.version) ? { version: text(pkg.version) } : {}),
    ...(text(pkg?.description) ? { description: text(pkg.description) } : {}),
    ...(repository ? { repository } : {}),
    ...(npmUrl ? { npmUrl } : {}),
    ...(text(pkg?.date) ? { updatedAt: text(pkg.date) } : {}),
    ...(Number.isFinite(entry?.score?.final) ? { score: entry.score.final } : {}),
    installSpec: name,
    sources: [{ id: source.id, name: source.name, type: source.type }],
  }
}

function githubPlugin(entry, source) {
  const fullName = text(entry?.full_name)
  if (!fullName) return undefined
  const repository = cleanUrl(entry?.html_url) ?? ('https://github.com/' + fullName)
  return {
    key: 'repo:' + repository.toLowerCase(),
    name: text(entry?.name) ?? fullName,
    fullName,
    ...(text(entry?.description) ? { description: text(entry.description) } : {}),
    repository,
    ...(Number.isFinite(entry?.stargazers_count) ? { stars: entry.stargazers_count } : {}),
    ...(text(entry?.updated_at) ? { updatedAt: text(entry.updated_at) } : {}),
    ...(Array.isArray(entry?.topics) ? { tags: entry.topics.filter(item => typeof item === 'string').slice(0, 12) } : {}),
    installSpec: 'github:' + fullName,
    sources: [{ id: source.id, name: source.name, type: source.type }],
  }
}

function catalogPlugin(entry, source, index) {
  if (typeof entry === 'string') {
    const name = text(entry)
    if (!name) return undefined
    return {
      key: source.id + ':' + name.toLowerCase(),
      name,
      packageName: name,
      installSpec: name,
      sources: [{ id: source.id, name: source.name, type: source.type }],
    }
  }
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return undefined
  const name = text(entry.name ?? entry.package ?? entry.packageName ?? entry.id)
  if (!name) return undefined
  const repository = cleanUrl(entry.repository ?? entry.repo ?? entry.github)
  const installSpec = text(entry.installSpec ?? entry.spec ?? entry.packageName ?? entry.package ?? name)
  return {
    key: repository ? 'repo:' + repository.toLowerCase() : source.id + ':' + name.toLowerCase() + ':' + index,
    name,
    ...(text(entry.packageName ?? entry.package) ? { packageName: text(entry.packageName ?? entry.package) } : {}),
    ...(text(entry.version) ? { version: text(entry.version) } : {}),
    ...(text(entry.description ?? entry.summary) ? { description: text(entry.description ?? entry.summary) } : {}),
    ...(repository ? { repository } : {}),
    ...(Number.isFinite(entry.stars) ? { stars: entry.stars } : {}),
    ...(Number.isFinite(entry.downloads30d) ? { downloads30d: entry.downloads30d } : {}),
    ...(text(entry.updatedAt ?? entry.updated_at ?? entry.date) ? { updatedAt: text(entry.updatedAt ?? entry.updated_at ?? entry.date) } : {}),
    ...(Array.isArray(entry.tags) ? { tags: entry.tags.filter(item => typeof item === 'string').slice(0, 12) } : {}),
    ...(installSpec ? { installSpec } : {}),
    sources: [{ id: source.id, name: source.name, type: source.type }],
  }
}

function pluginSearchText(plugin) {
  return [
    plugin.name,
    plugin.packageName,
    plugin.fullName,
    plugin.description,
    plugin.repository,
    ...(plugin.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function mergeBrowsePlugins(plugins) {
  const merged = new Map()
  for (const plugin of plugins) {
    if (!plugin?.key) continue
    const existing = merged.get(plugin.key)
    if (!existing) {
      merged.set(plugin.key, plugin)
      continue
    }
    const sources = [...(existing.sources ?? [])]
    for (const source of plugin.sources ?? []) {
      if (!sources.some(item => item.id === source.id)) sources.push(source)
    }
    merged.set(plugin.key, {
      ...existing,
      ...plugin,
      name: existing.packageName ? existing.name : plugin.name,
      ...(existing.packageName ? { packageName: existing.packageName } : {}),
      ...(existing.version ? { version: existing.version } : {}),
      ...(existing.description ? { description: existing.description } : {}),
      ...(existing.repository ? { repository: existing.repository } : {}),
      ...(existing.packageName && existing.installSpec ? { installSpec: existing.installSpec } : {}),
      stars: Math.max(existing.stars ?? 0, plugin.stars ?? 0) || undefined,
      downloads30d: Math.max(existing.downloads30d ?? 0, plugin.downloads30d ?? 0) || undefined,
      score: Math.max(existing.score ?? 0, plugin.score ?? 0) || undefined,
      sources,
    })
  }
  return [...merged.values()]
}

function browseRank(plugin, query) {
  const needle = text(query)?.toLowerCase()
  let rank = 0
  if (needle) {
    const haystack = pluginSearchText(plugin)
    if (plugin.name.toLowerCase() === needle) rank += 10000
    else if (plugin.name.toLowerCase().startsWith(needle)) rank += 5000
    else if (haystack.includes(needle)) rank += 1000
  }
  rank += Math.log10((plugin.stars ?? 0) + 1) * 120
  rank += Math.log10((plugin.downloads30d ?? 0) + 1) * 80
  rank += (plugin.score ?? 0) * 100
  const freshness = Date.parse(plugin.updatedAt ?? '')
  if (Number.isFinite(freshness)) {
    const ageDays = Math.max(0, (Date.now() - freshness) / 86400000)
    rank += Math.max(0, 50 - Math.min(50, ageDays / 30))
  }
  return rank
}

function uniqueCount(values) {
  return new Set(values.map(value => String(value).toLowerCase())).size
}

function sourceRequestOptions(source, options) {
  const authToken = options.resolveAuthToken?.(source)
  const allowPrivateNetwork = options.resolveAllowPrivateNetwork?.(source) === true
  return { ...options, ...(authToken ? { authToken } : {}), allowPrivateNetwork }
}

export function createSourceAdapter(sourceInput, options = {}) {
  const source = normalizeSource(sourceInput)
  if (!source) throw new Error('invalid plugin source configuration')
  const requestOptions = sourceRequestOptions(source, options)
  const request = url => fetchJson(url, source, requestOptions)
  const maxPlugins = Math.max(1, Math.min(options.maxPlugins ?? DEFAULT_MAX_PLUGINS, 2000))

  async function npmDiscover() {
    const batches = await Promise.all(NPM_DISCOVERY_KEYWORDS.map(async keyword => {
      const url = npmSearchUrl(source)
      url.searchParams.set('text', 'keywords:' + keyword)
      url.searchParams.set('size', String(Math.min(maxPlugins, 250)))
      const value = await request(url)
      const names = npmRows(value)
      return { names, truncated: Number(value?.total) > names.length }
    }))
    return {
      count: uniqueCount(batches.flatMap(batch => batch.names)),
      truncated: batches.some(batch => batch.truncated),
    }
  }

  async function githubDiscover() {
    const batches = await Promise.all(GITHUB_DISCOVERY_QUERIES.map(async discoveryQuery => {
      const url = githubSearchUrl(source)
      url.searchParams.set('q', discoveryQuery)
      url.searchParams.set('per_page', String(Math.min(maxPlugins, 100)))
      const value = await request(url)
      const names = githubRows(value)
      return { names, truncated: Number(value?.total_count) > names.length }
    }))
    return {
      count: uniqueCount(batches.flatMap(batch => batch.names)),
      truncated: batches.some(batch => batch.truncated),
    }
  }

  async function catalogDiscover() {
    if (!source.url) throw new Error(source.type + ' source requires a catalog URL')
    const rows = catalogRows(await request(source.url))
    return { count: Math.min(rows.length, maxPlugins), truncated: rows.length > maxPlugins }
  }

  async function count() {
    if (source.type === 'npm') return npmDiscover()
    if (source.type === 'github') return githubDiscover()
    return catalogDiscover()
  }

  async function health() {
    const started = Date.now()
    try {
      if (source.type === 'npm') {
        const url = npmSearchUrl(source)
        url.searchParams.set('text', 'keywords:' + NPM_DISCOVERY_KEYWORDS[0])
        url.searchParams.set('size', '1')
        npmRows(await request(url))
      } else if (source.type === 'github') {
        const value = await request(githubHealthUrl(source))
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('GitHub health response is malformed')
      } else {
        await catalogDiscover()
      }
      return { ok: true, latencyMs: Date.now() - started }
    } catch (error) {
      return { ok: false, latencyMs: Date.now() - started, error: String(error?.message ?? error) }
    }
  }

  async function browse(query = '') {
    const needle = text(query)
    if (source.type === 'npm') {
      const queries = needle
        ? NPM_DISCOVERY_KEYWORDS.map(keyword => needle + ' keywords:' + keyword)
        : NPM_DISCOVERY_KEYWORDS.map(keyword => 'keywords:' + keyword)
      const batches = await Promise.all(queries.map(async search => {
        const url = npmSearchUrl(source)
        url.searchParams.set('text', search)
        url.searchParams.set('size', String(Math.min(maxPlugins, needle ? 40 : 80)))
        const value = await request(url)
        if (!value || !Array.isArray(value.objects)) throw new Error('npm search returned an invalid response')
        return value.objects.map(entry => npmPlugin(entry, source)).filter(Boolean)
      }))
      return mergeBrowsePlugins(batches.flat())
    }

    if (source.type === 'github') {
      const queries = needle
        ? [
            needle + ' topic:deepseek-harness',
            needle + ' topic:deepseek-harness-plugin',
            needle + ' topic:dsh-plugin',
          ]
        : GITHUB_DISCOVERY_QUERIES
      const batches = await Promise.all(queries.map(async search => {
        const url = githubSearchUrl(source)
        url.searchParams.set('q', search)
        url.searchParams.set('per_page', String(Math.min(maxPlugins, needle ? 30 : 50)))
        const value = await request(url)
        if (!value || !Array.isArray(value.items)) throw new Error('GitHub search returned an invalid response')
        return value.items.map(entry => githubPlugin(entry, source)).filter(Boolean)
      }))
      return mergeBrowsePlugins(batches.flat())
    }

    if (!source.url) throw new Error(source.type + ' source requires a catalog URL')
    const rows = catalogRows(await request(source.url))
      .map((entry, index) => catalogPlugin(entry, source, index))
      .filter(Boolean)
    if (!needle) return rows
    const lower = needle.toLowerCase()
    return rows.filter(plugin => pluginSearchText(plugin).includes(lower))
  }

  return { source, health, count, browse }
}

function validateSources(sourceInputs, options) {
  const maxSources = Math.max(1, Math.min(options.maxSources ?? 20, 100))
  if (!Array.isArray(sourceInputs) || sourceInputs.length > maxSources) {
    throw new Error('at most ' + maxSources + ' plugin sources are allowed')
  }
  const sources = sourceInputs.map(normalizeSource)
  if (sources.some(source => !source)) throw new Error('invalid plugin source configuration')
  if (new Set(sources.map(source => source.id)).size !== sources.length) throw new Error('plugin source ids must be unique')
  return sources
}

async function mapConcurrent(items, concurrency, worker) {
  const output = new Array(items.length)
  let cursor = 0
  async function run() {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      output[index] = await worker(items[index], index)
    }
  }
  const workers = Math.min(Math.max(1, concurrency), Math.max(1, items.length))
  await Promise.all(Array.from({ length: workers }, run))
  return output
}

export async function healthSources(sourceInputs, options = {}) {
  const sources = validateSources(sourceInputs, options)
  return mapConcurrent(sources, options.concurrency ?? 4, async source => ({
    source: { id: source.id, name: source.name, type: source.type, ...(source.url ? { url: source.url } : {}) },
    health: source.enabled ? await createSourceAdapter(source, options).health() : { ok: false, disabled: true },
  }))
}

export async function countSources(sourceInputs, options = {}) {
  const sources = validateSources(sourceInputs, options)
  return mapConcurrent(sources, options.concurrency ?? 4, async source => {
    const attribution = { id: source.id, name: source.name, type: source.type, ...(source.url ? { url: source.url } : {}) }
    if (!source.enabled) return { source: attribution, disabled: true }
    try {
      return { source: attribution, ...(await createSourceAdapter(source, options).count()) }
    } catch (error) {
      return { source: attribution, error: String(error?.message ?? error) }
    }
  })
}

export async function browseSources(sourceInputs, query = '', options = {}) {
  const sources = validateSources(sourceInputs, options).filter(source => source.enabled)
  const limit = Math.max(1, Math.min(Number(options.limit) || 60, 100))
  const rows = await mapConcurrent(sources, options.concurrency ?? 4, async source => {
    const attribution = { id: source.id, name: source.name, type: source.type, ...(source.url ? { url: source.url } : {}) }
    try {
      return {
        source: attribution,
        ok: true,
        plugins: await createSourceAdapter(source, options).browse(query),
      }
    } catch (error) {
      return {
        source: attribution,
        ok: false,
        error: String(error?.message ?? error),
        plugins: [],
      }
    }
  })

  const plugins = mergeBrowsePlugins(rows.flatMap(row => row.plugins))
    .map(plugin => ({ ...plugin, rank: browseRank(plugin, query) }))
    .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name))

  return {
    plugins: plugins.slice(0, limit).map(({ rank: _rank, ...plugin }) => plugin),
    total: plugins.length,
    sources: rows.map(({ plugins: _plugins, ...row }) => row),
  }
}
