import test from 'node:test'
import assert from 'node:assert/strict'
import { CLOCK_SKEW_TOLERANCE_MS, connectionStatus, isFreshReading, isMeasurement, measurementTrend, mergeReadings, READING_FRESHNESS_MS } from '../src/lib/dashboardPresentation.js'
import { classifyReading, recommendations } from '../src/lib/environment.js'

test('missing measurements remain missing while zero is a valid measurement', () => {
  for (const value of [null, undefined, '', '   ', false, true, [], {}, NaN, Infinity, 'invalid']) assert.equal(isMeasurement(value), false)
  for (const value of [0, -1, 24.5, '52.3']) assert.equal(isMeasurement(value), true)
})

test('missing environmental values never become zero-valued critical measurements', () => {
  for (const missing of [null, undefined, '', ' ', false]) {
    const reading = { temperature: missing, humidity: missing, noise: missing, co2: missing }
    const state = classifyReading(reading)
    assert.equal(state.level, 'unknown')
    assert.ok(Object.values(state.metrics).every(metric => metric.level === 'unknown'))
    assert.deepEqual(recommendations(reading), ['Encendé la estación AirSense y verificá su conexión Wi-Fi.'])
  }
  assert.equal(classifyReading({ temperature: 0 }).metrics.temperature.level, 'danger')
  assert.equal(classifyReading({ noise: 0 }).metrics.noise.level, 'normal')
})

test('snapshot and realtime overlap deduplicates, sorts and isolates the selected station', () => {
  const row = (id, device_id, second) => ({ id, device_id, recorded_at: new Date(second * 1000).toISOString() })
  const rows = mergeReadings([row('2', 'A', 2), row('1', 'A', 1)], [row('2', 'A', 2), row('3', 'B', 3), row('4', 'A', 4)], 'A')
  assert.deepEqual(rows.map(item => item.id), ['1', '2', '4'])
  assert.equal(mergeReadings([], Array.from({ length: 80 }, (_, i) => row(String(i), 'A', i)), 'A').length, 60)
})

test('freshness uses one boundary and tolerates small clock differences', () => {
  const now = 100000
  for (const age of [0, 30_000, READING_FRESHNESS_MS - 1]) assert.equal(isFreshReading({ recorded_at: new Date(now - age).toISOString() }, now), true)
  assert.equal(isFreshReading({ recorded_at: new Date(now + CLOCK_SKEW_TOLERANCE_MS).toISOString() }, now), true)
  for (const date of ['bad', new Date(now - READING_FRESHNESS_MS).toISOString(), new Date(now + CLOCK_SKEW_TOLERANCE_MS + 1).toISOString()]) assert.equal(isFreshReading({ recorded_at: date }, now), false)
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
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: new Date(now - 30_000).toISOString() } }).key, 'online')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: new Date(now - READING_FRESHNESS_MS).toISOString() } }).key, 'offline')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: 'bad date' } }).key, 'offline')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: new Date(now + 1000).toISOString() } }).key, 'online')
  assert.equal(connectionStatus({ ...base, latest: fresh, active: false }).key, 'offline')
  assert.equal(connectionStatus({ ...base, latest: { recorded_at: 'bad date' }, active: true }).key, 'online')
  assert.equal(connectionStatus({ ...base, demo: true }).key, 'demo')
  assert.equal(connectionStatus({ ...base, error: 'Query failed', latest: fresh }).key, 'error')
  assert.equal(connectionStatus({ ...base, online: false, latest: fresh }).key, 'offline')
})
