import test from 'node:test'
import assert from 'node:assert/strict'
import { chartTimeline, nearestTimePoint } from '../src/lib/chartTimeline.js'

const row = (time, temperature = 22) => ({ recorded_at: `2026-11-10T${time}:00Z`, temperature })

test('horizontal distance represents elapsed time, including long interruptions', () => {
  const timeline = chartTimeline([row('11:00'), row('10:00'), row('10:01')], 'temperature')
  assert.deepEqual(timeline.samples.map(sample => sample.recorded_at), [row('10:00'), row('10:01'), row('11:00')].map(sample => sample.recorded_at))
  assert.equal(timeline.positions[0], 0)
  assert.ok(Math.abs(timeline.positions[1] - 100 / 60) < 0.00001)
  assert.equal(timeline.positions[2], 100)
  assert.equal(nearestTimePoint(timeline.positions, 2), 1)
  assert.equal(nearestTimePoint(timeline.positions, 90), 2)
})

test('regular measurements retain regular spacing and missing metrics retain a shared time domain', () => {
  assert.deepEqual(chartTimeline([row('10:00'), row('10:01'), row('10:02')], 'temperature').positions, [0, 50, 100])
  assert.deepEqual(chartTimeline([row('10:00', null), row('10:01'), row('10:02')], 'temperature').positions, [50, 100])
})

test('empty, invalid, single and simultaneous timestamps produce safe positions', () => {
  assert.deepEqual(chartTimeline([{ recorded_at: 'bad', temperature: 22 }], 'temperature').positions, [])
  assert.equal(nearestTimePoint([], 50), null)
  assert.deepEqual(chartTimeline([row('10:00')], 'temperature').positions, [50])
  assert.deepEqual(chartTimeline([row('10:00'), row('10:00', 24)], 'temperature').positions, [50, 50])
  assert.equal(nearestTimePoint([0, 50, 100], -10), 0)
  assert.equal(nearestTimePoint([0, 50, 100], 110), 2)
})
