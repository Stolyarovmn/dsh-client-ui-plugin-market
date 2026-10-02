import { readFileSync } from 'node:fs'
import semver from 'semver'
import z from '@deepseek-ai/schemastery'
import { browseSources, countSources, healthSources, resolveNpmDownloadStats, resolvePluginIcons, resolvePluginMetadata, SOURCE_TYPES } from './source-core.js'

export const name = 'registry-aggregator'
export const RPC_CHANNEL = '/api'
export const RPC_PREFIX = 'plugin-sources'

const SourceTypeSchema = z.union(SOURCE_TYPES.map(type => z.const(type)))
const SourceAuthSchema = z.object({
  sourceId: z.string().required().comment('Source id allowed to use this credential.'),
  tokenEnv: z.string().required().comment('Host environment variable containing its bearer token.'),
})

export const PluginSourceSchema = z.object({
  id: z.string().required().comment('Stable source id.'),
  name: z.string().default('').comment('Display name.'),
  type: SourceTypeSchema.required().comment('Adapter type.'),
  url: z.string().comment('Optional catalog or API URL.'),
  enabled: z.boolean().default(true),
})

export const DEFAULT_SOURCES = [
  { id: 'npm', name: 'npm', type: 'npm', enabled: true },
  { id: 'github', name: 'GitHub', type: 'github', enabled: true },
]

export const Config = z.object({
  sources: z.array(PluginSourceSchema).default(DEFAULT_SOURCES).volatile(),
  timeoutMs: z.natural().min(250).max(60000).default(10000),
  maxResponseBytes: z.natural().min(1024).max(10 * 1024 * 1024).default(2 * 1024 * 1024),
  maxPlugins: z.natural().min(1).max(2000).default(500),
  maxSources: z.natural().min(1).max(100).default(20),
  maxRpcBytes: z.natural().min(16384).max(20 * 1024 * 1024).default(4 * 1024 * 1024),
  concurrency: z.natural().min(1).max(16).default(4),
  privateSourceIds: z.array(z.string()).default([]).comment('Host-controlled source ids allowed to reach private networks.'),
  auth: z.array(SourceAuthSchema).default([]).comment('Host-controlled source-to-token-environment allowlist.'),
})

function sourcesFromConfig(config) {
  const value = config?.sources
  const sources = typeof value?.get === 'function' ? value.get() : value
  return Array.isArray(sources) ? sources : []
}

function failure(code, error, details = {}) {
  return { ok: false, error: { code, message: String(error?.message ?? error), details } }
}

function limitRpcValue(value, maxBytes) {
  const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength
  if (bytes > maxBytes) throw new Error('registry RPC response exceeds ' + maxBytes + ' bytes')
  return value
}

export function runtimeVersionFromContext(ctx) {
  const anchor = ctx?.profileContext?.installAnchor
  if (typeof anchor !== 'string' || !anchor) throw new Error('DSH installation anchor is unavailable')
  const manifest = JSON.parse(readFileSync(anchor, 'utf8'))
  const version = typeof manifest?.version === 'string' ? manifest.version.trim() : ''
  if (semver.valid(version) === null) throw new Error('DSH installation manifest has no valid semantic version')
  return version
}

export function apply(ctx, config = {}) {
  ctx.inject(['connection', 'profileContext'], rpcCtx => {
    const runtimeVersion = runtimeVersionFromContext(rpcCtx)
    const auth = new Map((config.auth ?? []).map(row => [row.sourceId, row.tokenEnv]))
    const privateSourceIds = new Set(config.privateSourceIds ?? [])
    const maxRpcBytes = config.maxRpcBytes ?? 4 * 1024 * 1024
    const options = {
      timeoutMs: config.timeoutMs ?? 10000,
      maxResponseBytes: config.maxResponseBytes ?? 2 * 1024 * 1024,
      maxPlugins: config.maxPlugins ?? 500,
      maxSources: config.maxSources ?? 20,
      concurrency: config.concurrency ?? 4,
      resolveAllowPrivateNetwork: source => privateSourceIds.has(source.id),
      resolveAuthToken(source) {
        const tokenEnv = auth.get(source.id)
        if (!tokenEnv) return undefined
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tokenEnv)) {
          throw new Error('invalid token environment variable configured for source ' + source.id)
        }
        const token = process.env[tokenEnv]
        if (!token) throw new Error('configured credential for source ' + source.id + ' is unavailable')
        return token
      },
    }

    async function dispatch(endpoint, payload, signal) {
      try {
        const sources = sourcesFromConfig(config)
        const requestOptions = { ...options, signal }
        if (endpoint === 'health') {
          const value = {
            sources: await healthSources(sources, requestOptions),
            generatedAt: new Date().toISOString(),
          }
          return { ok: true, value: limitRpcValue(value, maxRpcBytes) }
        }
        if (endpoint === 'counts') {
          const value = {
            sources: await countSources(sources, requestOptions),
            generatedAt: new Date().toISOString(),
          }
          return { ok: true, value: limitRpcValue(value, maxRpcBytes) }
        }
        if (endpoint === 'browse') {
          const query = typeof payload?.query === 'string' ? payload.query.trim().slice(0, 160) : ''
          const limit = Number.isInteger(payload?.limit) ? Math.max(1, Math.min(payload.limit, 100)) : 60
          const value = {
            ...(await browseSources(sources, query, { ...requestOptions, limit })),
            generatedAt: new Date().toISOString(),
          }
          return { ok: true, value: limitRpcValue(value, maxRpcBytes) }
        }
        if (endpoint === 'icons') {
          const items = Array.isArray(payload?.items) ? payload.items.slice(0, 8) : []
          const value = {
            icons: await resolvePluginIcons(items, requestOptions),
            generatedAt: new Date().toISOString(),
          }
          return { ok: true, value: limitRpcValue(value, maxRpcBytes) }
        }
        if (endpoint === 'metadata') {
          const items = Array.isArray(payload?.items) ? payload.items.slice(0, 24) : []
          const value = {
            plugins: await resolvePluginMetadata(items, { ...requestOptions, runtimeVersion }),
            runtimeVersion,
            generatedAt: new Date().toISOString(),
          }
          return { ok: true, value: limitRpcValue(value, maxRpcBytes) }
        }
        if (endpoint === 'download-stats') {
          const items = Array.isArray(payload?.items) ? payload.items.slice(0, 24) : []
          const value = {
            plugins: await resolveNpmDownloadStats(items, requestOptions),
            generatedAt: new Date().toISOString(),
          }
          return { ok: true, value: limitRpcValue(value, maxRpcBytes) }
        }
        return failure('plugin-sources/not-found', 'unknown endpoint ' + endpoint, { endpoint })
      } catch (error) {
        return failure('plugin-sources/invalid-request', error)
      }
    }

    function route(endpoint) {
      return {
        path: RPC_CHANNEL + '/' + RPC_PREFIX + '/' + endpoint,
        methods: ['POST'],
        requestBody: 'buffered',
        async fetch(request) {
          let envelope
          try {
            envelope = await request.json()
          } catch {
            return new Response('body is not JSON', { status: 400 })
          }
          if (!envelope || typeof envelope !== 'object'
            || envelope.type !== 'client-request'
            || typeof envelope.rpcId !== 'string'
            || envelope.method !== RPC_PREFIX + '/' + endpoint) {
            return new Response('invalid client-request message', { status: 400 })
          }
          const result = await dispatch(endpoint, envelope.payload, request.signal)
          return Response.json({ type: 'server-response', rpcId: envelope.rpcId, result })
        },
      }
    }

    rpcCtx.effect(
      () => rpcCtx.connection.fetch.register(route('health')),
      'registry-aggregator: source health route',
    )
    rpcCtx.effect(
      () => rpcCtx.connection.fetch.register(route('counts')),
      'registry-aggregator: source counts route',
    )
    rpcCtx.effect(
      () => rpcCtx.connection.fetch.register(route('browse')),
      'registry-aggregator: browse route',
    )
    rpcCtx.effect(
      () => rpcCtx.connection.fetch.register(route('icons')),
      'registry-aggregator: plugin icons route',
    )
    rpcCtx.effect(
      () => rpcCtx.connection.fetch.register(route('metadata')),
      'registry-aggregator: plugin metadata route',
    )
    rpcCtx.effect(
      () => rpcCtx.connection.fetch.register(route('download-stats')),
      'registry-aggregator: npm download stats route',
    )
  })
}
