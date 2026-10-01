import assert from 'node:assert/strict'
import test from 'node:test'
import {
  countSources,
  healthSources,
  isPrivateAddress,
  normalizeSource,
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
