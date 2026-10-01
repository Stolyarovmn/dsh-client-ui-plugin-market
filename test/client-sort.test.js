import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const start = client.indexOf('    function browsePluginKey')
const end = client.indexOf('    function IconRefresh', start)
assert.ok(start >= 0 && end > start, 'composite sort helper block is present')
const helpers = client.slice(start, end)
const { compositeSortPlugins } = new Function(helpers + '\nreturn { compositeSortPlugins }')()

function key(plugin) {
  return plugin.key
}

const plugins = [
  { key: 'a', name: 'A', stars: 100, releasedAt: '2026-01-01T00:00:00Z' },
  { key: 'b', name: 'B', stars: 75, downloads30d: 100_000, releasedAt: '2026-09-01T00:00:00Z' },
  { key: 'c', name: 'C', stars: 50, downloads30d: 90_000, releasedAt: '2026-09-30T00:00:00Z' },
]
const baseOrder = new Map(plugins.map((plugin, index) => [plugin.key, index]))

test('single Browse criterion still sorts by that criterion', () => {
  assert.deepEqual(
    compositeSortPlugins(plugins, [{ key: 'stars', direction: 'desc' }], baseOrder).map(key),
    ['a', 'b', 'c'],
  )
  assert.deepEqual(
    compositeSortPlugins(plugins, [{ key: 'downloads', direction: 'desc' }], baseOrder).map(key),
    ['b', 'c', 'a'],
  )
})

test('multiple Browse criteria contribute to one equal-weight composite rank', () => {
  const combined = compositeSortPlugins(plugins, [
    { key: 'stars', direction: 'desc' },
    { key: 'downloads', direction: 'desc' },
  ], baseOrder).map(key)

  assert.deepEqual(combined, ['b', 'a', 'c'])
  assert.notDeepEqual(combined, ['a', 'b', 'c'])
})

test('combined Browse ranking is independent of click order', () => {
  const first = compositeSortPlugins(plugins, [
    { key: 'stars', direction: 'desc' },
    { key: 'freshness', direction: 'desc' },
  ], baseOrder).map(key)
  const second = compositeSortPlugins(plugins, [
    { key: 'freshness', direction: 'desc' },
    { key: 'stars', direction: 'desc' },
  ], baseOrder).map(key)

  assert.deepEqual(first, second)
})

test('missing metric evidence is worse than measured values for that criterion', () => {
  const byDownloads = compositeSortPlugins(plugins, [
    { key: 'downloads', direction: 'asc' },
  ], baseOrder).map(key)

  assert.deepEqual(byDownloads, ['c', 'b', 'a'])
})
