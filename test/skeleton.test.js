import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const host = await readFile(new URL('../index.js', import.meta.url), 'utf8')
const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

test('targets only DSH 0.2.x', () => {
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh'], '>=0.2.0-rc.2 <0.3.0')
  assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-plugin-manager'))
  assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-connection'))
  assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings'))
})

test('uses the native bundle slot but binds the Host entry form explicitly', () => {
  assert.match(client, /plugins\.bundle\.config/)
  assert.match(client, /ctx\.configForms\.get\(HOST_ENTRY\)/)
  assert.match(client, /ctx\.configForms\.whileServed\(\[HOST_ENTRY\]/)
  assert.match(client, /sourceConfigForm\.subscribe/)
  assert.match(client, /sourceConfigForm\.mutate/)
  assert.match(host, /export const Config/)
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

test('source RPC is Host-owned and client uses the Connection service', () => {
  assert.match(host, /connection\.fetch\.register/)
  assert.match(host, /route\('health'\)/)
  assert.match(host, /route\('counts'\)/)
  assert.match(host, /route\('browse'\)/)
  assert.match(client, /connection\.rpc\.call/)
  assert.match(client, /rpc\('browse'/)
})

test('copies the DSH 0.2 native switch geometry and uses icon actions', () => {
  assert.match(client, /width:36px;height:20px;padding:2px/)
  assert.match(client, /ra-switch-thumb/)
  assert.match(client, /--dsw-alias-brand-primary/)
  assert.match(client, /width:28px;height:28px/)
  assert.match(client, /function IconRefresh/)
  assert.match(client, /function IconCopy/)
})

test('styles use DSH theme tokens and no feature gradient', () => {
  assert.match(client, /--dsw-alias-/)
  assert.doesNotMatch(client, /linear-gradient|radial-gradient/i)
})
