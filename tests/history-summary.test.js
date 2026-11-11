import test from 'node:test'
import assert from 'node:assert/strict'
import { loadHistorySummary } from '../src/lib/historySummary.js'

const options = () => ({ deviceId: 'A', from: '2026-11-01T00:00:00Z', to: '2026-11-10T00:00:00Z', signal: new AbortController().signal })

test('summary uses one bounded RPC and preserves supplied extreme readings without resampling', async () => {
  const points = [{ id: 'peak', device_id: 'A', noise: 140 }, { id: 'low', device_id: 'A', noise: 10 }]
  let calls = 0
  const client = { rpc(name, args) {
    calls++
    assert.equal(name, 'get_reading_history_summary')
    assert.equal(args.p_device_id, 'A')
    assert.equal(args.p_from, options().from)
    assert.equal(args.p_to, options().to)
    return { abortSignal: async () => ({ data: { total_count: 100000, points } }) }
  } }
  const result = await loadHistorySummary(client, options())
  assert.equal(calls, 1)
  assert.deepEqual(result, { readings: points, total: 100000, partial: false })
})

test('missing migration uses a single limited query and explicitly reports partial coverage', async () => {
  const calls = []
  const query = { select() { return this }, eq(key, value) { calls.push([key, value]); return this },
    lte(key, value) { calls.push([key, value]); return this }, gte(key, value) { calls.push([key, value]); return this },
    order() { return this }, limit(n) { calls.push(['limit', n]); return this }, abortSignal() { return this },
    then(resolve) { return Promise.resolve({ data: [{ id: 'last' }, { id: 'first' }] }).then(resolve) },
  }
  const client = { rpc: () => ({ abortSignal: async () => ({ error: { code: 'PGRST202' } }) }), from: () => query }
  const result = await loadHistorySummary(client, options())
  assert.deepEqual(calls, [['device_id', 'A'], ['recorded_at', options().to], ['limit', 240], ['recorded_at', options().from]])
  assert.deepEqual(result.readings.map(row => row.id), ['first', 'last'])
  assert.equal(result.total, null)
  assert.equal(result.partial, true)
})

test('authorization errors never trigger fallback, malformed summaries are rejected and cancelled requests return nothing', async () => {
  const denied = { code: '42501', message: 'denied' }
  await assert.rejects(loadHistorySummary({ rpc: () => ({ abortSignal: async () => ({ error: denied }) }) }, options()), error => error === denied)
  for (const data of [{ total_count: 1, points: [{ device_id: 'B' }] }, { total_count: 300, points: Array.from({ length: 241 }, () => ({ device_id: 'A' })) }]) {
    await assert.rejects(loadHistorySummary({ rpc: () => ({ abortSignal: async () => ({ data }) }) }, options()), /formato válido/)
  }
  const controller = new AbortController()
  controller.abort()
  assert.equal(await loadHistorySummary({ rpc: () => ({ abortSignal: async () => ({ error: denied }) }) }, { ...options(), signal: controller.signal }), null)
})
