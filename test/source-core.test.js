import assert from 'node:assert/strict'
import test from 'node:test'
import {
  browseSources,
  countSources,
  healthSources,
  isPrivateAddress,
  normalizeSource,
  resolvePluginIcons,
  resolvePluginMetadata,
} from '../source-core.js'

const publicResolver = async () => [{ address: '93.184.216.34', family: 4 }]

test('normalizes supported source types only', () => {
  assert.deepEqual(normalizeSource({ id: 'npm', type: 'npm', enabled: true }), {
    id: 'npm', name: 'npm', type: 'npm', enabled: true,
  })
  assert.equal(normalizeSource({ id: 'legacy', type: 'dsh-plugin-shop' }), undefined)
})

test('recognizes private and public addresses', () => {
  assert.equal(isPrivateAddress('127.0.0.1'), true)
  assert.equal(isPrivateAddress('10.0.0.1'), true)
  assert.equal(isPrivateAddress('8.8.8.8'), false)
})

test('counts custom catalog rows without real network access', async () => {
  const fetchImpl = async () => Response.json({
    plugins: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
  })
  const result = await countSources([
    { id: 'catalog', name: 'Catalog', type: 'custom-json', url: 'https://catalog.example/plugins.json', enabled: true },
  ], { fetchImpl, resolveHost: publicResolver, maxPlugins: 10 })

  assert.equal(result[0].count, 3)
  assert.equal(result[0].truncated, false)
})

test('npm count deduplicates discovery batches and reports truncation', async () => {
  const fetchImpl = async () => Response.json({
    total: 10,
    objects: [
      { package: { name: 'dsh-one' } },
      { package: { name: 'dsh-two' } },
    ],
  })
  const result = await countSources([
    { id: 'npm', name: 'npm', type: 'npm', enabled: true },
  ], { fetchImpl, resolveHost: publicResolver, maxPlugins: 20 })

  assert.equal(result[0].count, 2)
  assert.equal(result[0].truncated, true)
})

test('health blocks localhost before fetch', async () => {
  let called = false
  const result = await healthSources([
    { id: 'local', name: 'Local', type: 'custom-json', url: 'http://localhost/plugins.json', enabled: true },
  ], {
    fetchImpl: async () => {
      called = true
      return Response.json([])
    },
    resolveHost: async () => [{ address: '127.0.0.1', family: 4 }],
  })

  assert.equal(called, false)
  assert.equal(result[0].health.ok, false)
  assert.match(result[0].health.error, /private network destinations are blocked/)
})


test('browse merges npm and GitHub candidates by repository and keeps npm install spec', async () => {
  const fetchImpl = async input => {
    const url = new URL(input)
    if (url.hostname === 'api.github.com') {
      return Response.json({
        items: [{
          name: 'dsh-alpha',
          full_name: 'acme/dsh-alpha',
          description: 'Alpha plugin for DeepSeek Harness',
          html_url: 'https://github.com/acme/dsh-alpha',
          stargazers_count: 42,
          pushed_at: '2026-10-01T12:00:00Z',
          updated_at: '2026-10-01T18:00:00Z',
          topics: ['deepseek-harness', 'dsh-plugin'],
        }],
      })
    }
    return Response.json({
      objects: [{
        package: {
          name: '@acme/dsh-alpha',
          version: '1.2.3',
          description: 'Alpha plugin for DeepSeek Harness',
          date: '2026-09-29T00:00:00Z',
          links: {
            repository: 'https://github.com/acme/dsh-alpha.git',
            npm: 'https://www.npmjs.com/package/@acme/dsh-alpha',
          },
        },
        score: { final: 0.9 },
      }],
    })
  }

  const result = await browseSources([
    { id: 'npm', name: 'npm', type: 'npm', enabled: true },
    { id: 'github', name: 'GitHub', type: 'github', enabled: true },
  ], '', {
    fetchImpl,
    resolveHost: publicResolver,
    maxPlugins: 20,
    limit: 20,
  })

  assert.equal(result.total, 1)
  assert.equal(result.plugins[0].packageName, '@acme/dsh-alpha')
  assert.equal(result.plugins[0].installSpec, '@acme/dsh-alpha')
  assert.equal(result.plugins[0].stars, 42)
  assert.equal(result.plugins[0].releasedAt, '2026-09-29T00:00:00Z')
  assert.equal(result.plugins[0].repositoryUpdatedAt, '2026-10-01T12:00:00Z')
  assert.equal(result.plugins[0].updatedAt, '2026-09-29T00:00:00Z')
  assert.deepEqual(result.plugins[0].sources.map(item => item.id).sort(), ['github', 'npm'])
})

test('browse filters a custom catalog by query', async () => {
  const fetchImpl = async () => Response.json({
    plugins: [
      { name: 'scheduler-tools', description: 'Automation helpers' },
      { name: 'theme-tools', description: 'Theme helpers' },
    ],
  })
  const result = await browseSources([
    { id: 'catalog', name: 'Catalog', type: 'custom-json', url: 'https://catalog.example/plugins.json', enabled: true },
  ], 'scheduler', {
    fetchImpl,
    resolveHost: publicResolver,
    limit: 20,
  })

  assert.equal(result.total, 1)
  assert.equal(result.plugins[0].name, 'scheduler-tools')
})


test('browse can enrich npm packages with 30-day downloads', async () => {
  const fetchImpl = async input => {
    const url = new URL(input)
    if (url.hostname === 'api.npmjs.org') {
      return Response.json({ downloads: 12345, package: '@acme/dsh-alpha' })
    }
    return Response.json({
      objects: [{
        package: {
          name: '@acme/dsh-alpha',
          version: '1.2.3',
          description: 'Alpha plugin',
          date: '2026-09-29T00:00:00Z',
          keywords: ['dsh-plugin', 'automation'],
          links: { npm: 'https://www.npmjs.com/package/@acme/dsh-alpha' },
        },
        score: { final: 0.9 },
      }],
    })
  }

  const result = await browseSources([
    { id: 'npm', name: 'npm', type: 'npm', enabled: true },
  ], 'alpha', {
    fetchImpl,
    resolveHost: publicResolver,
    enrichDownloads: true,
    limit: 20,
  })

  assert.equal(result.plugins[0].downloads30d, 12345)
  assert.equal(result.plugins[0].channel, 'stable')
  assert.ok(result.plugins[0].tags.includes('automation'))
})


test('plugin icons follow the DSH manifest-relative icon contract and return data URLs', async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>'
  const fetchImpl = async input => {
    const url = new URL(input)
    if (url.hostname === 'registry.npmjs.org') {
      return Response.json({ icon: './assets/icon.svg' })
    }
    if (url.hostname === 'unpkg.com') {
      return new Response(svg, { status: 200, headers: { 'content-type': 'image/svg+xml' } })
    }
    throw new Error('unexpected URL ' + url)
  }

  const rows = await resolvePluginIcons([
    { key: 'alpha', packageName: '@acme/dsh-alpha', version: '1.2.3' },
  ], { fetchImpl, resolveHost: publicResolver })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].key, 'alpha')
  assert.match(rows[0].icon, /^data:image\/svg\+xml;base64,/)
})

test('plugin icon resolution rejects URL icon declarations', async () => {
  const fetchImpl = async input => {
    const url = new URL(input)
    if (url.hostname === 'registry.npmjs.org') {
      return Response.json({ icon: 'https://example.com/icon.svg' })
    }
    throw new Error('unexpected URL ' + url)
  }

  const rows = await resolvePluginIcons([
    { key: 'alpha', packageName: '@acme/dsh-alpha', version: '1.2.4' },
  ], { fetchImpl, resolveHost: publicResolver })

  assert.deepEqual(rows, [{ key: 'alpha' }])
})


test('plugin metadata verifies DSH peer compatibility against the target runtime', async () => {
  const fetchImpl = async input => {
    const url = new URL(input)
    if (url.hostname === 'registry.npmjs.org') {
      return Response.json({
        name: '@acme/dsh-plugin',
        version: '2.3.4',
        peerDependencies: {
          '@deepseek-ai/dsh': '>=0.2.0-rc.1 <0.3.0',
          '@deepseek-ai/dsh-client-ui-slots': '^0.2.0-rc.2',
        },
      })
    }
    throw new Error('unexpected URL ' + url)
  }

  const rows = await resolvePluginMetadata([
    { key: 'plugin', packageName: '@acme/dsh-plugin', version: '2.3.4' },
  ], { fetchImpl, resolveHost: publicResolver, runtimeVersion: '0.2.0-rc.2' })

  assert.equal(rows[0].version, '2.3.4')
  assert.equal(rows[0].compatibility, 'compatible')
  assert.equal(rows[0].runtimeVersion, '0.2.0-rc.2')
  assert.equal(rows[0].dshPeers.length, 2)
})

test('plugin metadata keeps non-confirmed compatibility neutral for the UI', async () => {
  let manifest = {
    name: '@acme/no-peer',
    version: '1.0.0',
    peerDependencies: { '@deepseek-ai/cordis': '^4.0.0' },
  }
  const fetchImpl = async input => {
    const url = new URL(input)
    if (url.hostname === 'registry.npmjs.org') return Response.json(manifest)
    throw new Error('unexpected URL ' + url)
  }

  let rows = await resolvePluginMetadata([
    { key: 'no-peer', packageName: '@acme/no-peer', version: '1.0.0' },
  ], { fetchImpl, resolveHost: publicResolver, runtimeVersion: '0.2.0-rc.2' })
  assert.equal(rows[0].compatibility, 'unchecked')

  manifest = {
    name: '@acme/old-plugin',
    version: '1.0.1',
    peerDependencies: { '@deepseek-ai/dsh': '<0.2.0' },
  }
  rows = await resolvePluginMetadata([
    { key: 'old-plugin', packageName: '@acme/old-plugin', version: '1.0.1' },
  ], { fetchImpl, resolveHost: publicResolver, runtimeVersion: '0.2.0-rc.2' })
  assert.equal(rows[0].compatibility, 'unsupported')
})
