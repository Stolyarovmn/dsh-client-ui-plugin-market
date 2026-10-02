import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const client = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const start = client.indexOf('    async function readInstalledBundles')
const end = client.indexOf('    function PluginArtwork', start)
assert.ok(start >= 0 && end > start, 'install helper block is present')
const helpers = client.slice(start, end)

function loadHelpers(fakeRemote) {
  return new Function('fakeRemote', [
    'let remote = fakeRemote;',
    helpers,
    'return { readInstalledBundles, installBrowsePlugin, updateInstalledPlugin };',
  ].join('\n'))(fakeRemote)
}

test('Browse install inspects then installs through native Plugin Manager', async () => {
  const calls = []
  const listeners = new Map()
  const fakeRemote = {
    pluginManager: {
      inspect: async (spec, options) => {
        calls.push(['inspect', spec, options])
        return { ok: true, value: { status: 'accepted', kind: 'registry', bundle: true, registry: null } }
      },
      installBundle: async (spec, options) => {
        calls.push(['installBundle', spec, options])
        listeners.get('plugin-manager/install-state')?.({
          requestId: options.requestId,
          phase: 'installing',
          attempt: { registry: null, index: 1, total: 1 },
        })
        return { ok: true, value: { application: 'applied', bundle: '@acme/plugin' } }
      },
      listBundles: async () => ({ ok: true, value: [{ name: '@acme/plugin', installed: true }] }),
    },
    $on: (event, listener) => {
      listeners.set(event, listener)
      return () => listeners.delete(event)
    },
  }

  const { installBrowsePlugin, readInstalledBundles } = loadHelpers(fakeRemote)
  const progress = []
  const result = await installBrowsePlugin(
    { installSpec: '@acme/plugin' },
    state => progress.push(state.phase),
  )

  assert.equal(result.application, 'applied')
  assert.equal(result.bundle, '@acme/plugin')
  assert.equal(calls[0][0], 'inspect')
  assert.equal(calls[1][0], 'installBundle')
  assert.equal(calls[1][2].enabled, true)
  assert.equal(typeof calls[1][2].requestId, 'string')
  assert.ok(progress.includes('checking'))
  assert.ok(progress.includes('installing'))
  assert.ok(progress.includes('done'))
  assert.deepEqual(await readInstalledBundles(), [{ name: '@acme/plugin', installed: true }])
})

test('Browse install refuses non-bundles before running installBundle', async () => {
  let installed = false
  const fakeRemote = {
    pluginManager: {
      inspect: async () => ({ ok: true, value: { status: 'refused', problem: 'not-a-bundle', reason: 'no dsh.bundle' } }),
      installBundle: async () => {
        installed = true
        return { ok: true, value: { application: 'applied' } }
      },
    },
  }
  const { installBrowsePlugin } = loadHelpers(fakeRemote)

  await assert.rejects(
    installBrowsePlugin({ installSpec: 'plain-package' }),
    error => error?.problem === 'not-a-bundle' && /dsh\.bundle/.test(error.message),
  )
  assert.equal(installed, false)
})


test('Updates use native installBundle directly for an installed exact version', async () => {
  const calls = []
  const listeners = new Map()
  const fakeRemote = {
    pluginManager: {
      installBundle: async (spec, options) => {
        calls.push([spec, options])
        listeners.get('plugin-manager/install-state')?.({ requestId: options.requestId, phase: 'applying' })
        return { ok: true, value: { application: 'applied', bundle: '@acme/plugin' } }
      },
    },
    $on: (event, listener) => {
      listeners.set(event, listener)
      return () => listeners.delete(event)
    },
  }

  const { updateInstalledPlugin } = loadHelpers(fakeRemote)
  const progress = []
  const result = await updateInstalledPlugin(
    { name: '@acme/plugin', version: '1.0.0', enabled: true },
    '1.1.0',
    state => progress.push(state.phase),
  )

  assert.equal(result.application, 'applied')
  assert.equal(calls[0][0], '@acme/plugin@1.1.0')
  assert.equal(calls[0][1].enabled, true)
  assert.ok(progress.includes('starting'))
  assert.ok(progress.includes('applying'))
  assert.ok(progress.includes('done'))
})
