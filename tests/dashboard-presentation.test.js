import test from 'node:test'
import assert from 'node:assert/strict'
import { connectionStatus, isMeasurement, measurementTrend } from '../src/lib/dashboardPresentation.js'

test('missing measurements remain missing while zero is a valid measurement', () => {
  for (const value of [null, undefined, '', NaN, Infinity, 'invalid']) assert.equal(isMeasurement(value), false)
  for (const value of [0, -1, 24.5, '52.3']) assert.equal(isMeasurement(value), true)
})

test('trends require two real measurements and do not turn null into zero', () => {
  assert.ok(Number.isNaN(measurementTrend([{ temperature: null }, { temperature: 20 }], 'temperature')))
  assert.equal(measurementTrend([{ temperature: 20 }, { temperature: null }, { temperature: 21.5 }], 'temperature'), 1.5)
})

test('connection labels distinguish missing setup, waiting, fresh, stale, demo and error', () => {
  const now = Date.parse('2026-11-09T15:00:00Z')
  const base = { online: true, configured: true, demo: false, now }
  assert.equal(connectionStatus(base).key, 'waiting')
  assert.equal(connectionStatus({ ...base, configured: false }).key, 'waiting')
  const fresh = { recorded_at: new Date(now - 5000).toISOString() }
  assert.equal(connectionStatus({ ...base, latest: fresh }).key, 'online')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: new Date(now - 30000).toISOString() } }).key, 'offline')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: 'bad date' } }).key, 'offline')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: new Date(now + 1000).toISOString() } }).key, 'offline')
  assert.equal(connectionStatus({ ...base, demo: true }).key, 'demo')
  assert.equal(connectionStatus({ ...base, error: 'Query failed', latest: fresh }).key, 'error')
  assert.equal(connectionStatus({ ...base, online: false, latest: fresh }).key, 'offline')
})
