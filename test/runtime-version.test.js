import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { runtimeVersionFromContext } from '../index.js'

test('compatibility uses the active DSH installation version instead of a hardcoded RC', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'registry-aggregator-runtime-'))
  try {
    const anchor = join(dir, 'package.json')
    await writeFile(anchor, JSON.stringify({ name: '@deepseek-ai/dsh', version: '0.2.0-rc.3' }))
    assert.equal(runtimeVersionFromContext({ profileContext: { installAnchor: anchor } }), '0.2.0-rc.3')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
