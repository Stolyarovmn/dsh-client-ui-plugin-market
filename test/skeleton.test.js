import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

test('targets only DSH 0.2.x', () => {
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh'], '>=0.2.0-rc.2 <0.3.0')
  assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-plugin-manager'))
})

test('uses the native bundle configuration slot', () => {
  assert.match(client, /plugins\.bundle\.config/)
  assert.match(client, /key:\s*PACKAGE/)
  assert.match(patch, /registry-aggregator/)
})

test('does not runtime-import Harness Client packages', () => {
  assert.doesNotMatch(client, /require\(['"]@deepseek-ai\/dsh-client-/)
  assert.doesNotMatch(client, /require\(['"]@deepseek-ai\/dsh-api-/)
})

test('keeps only Sources, Browse, and Updates top-level views', () => {
  assert.match(client, /sources:\s*'Sources'/)
  assert.match(client, /browse:\s*'Browse'/)
  assert.match(client, /updates:\s*'Updates'/)
  assert.doesNotMatch(client, /installed:\s*'Installed'/i)
})

test('styles use DSH theme tokens and no feature gradient', () => {
  assert.match(client, /--dsw-alias-/)
  assert.doesNotMatch(client, /linear-gradient|radial-gradient/i)
})
