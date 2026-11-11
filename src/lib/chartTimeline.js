import { isMeasurement } from './dashboardPresentation.js'

export function chartTimeline(readings, field) {
  const dated = readings
    .filter(row => typeof row.recorded_at === 'string' && Number.isFinite(Date.parse(row.recorded_at)))
    .slice().sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at))
  const start = dated.length ? Date.parse(dated[0].recorded_at) : null
  const end = dated.length ? Date.parse(dated.at(-1).recorded_at) : null
  const samples = dated.filter(row => isMeasurement(row[field]))
  const positions = samples.map(row => end === start ? 50 : (Date.parse(row.recorded_at) - start) / (end - start) * 100)
  return { samples, positions, start, end }
}

export function nearestTimePoint(positions, x) {
  if (!positions.length) return null
  let nearest = 0
  for (let index = 1; index < positions.length; index++) {
    if (Math.abs(positions[index] - x) < Math.abs(positions[nearest] - x)) nearest = index
  }
  return nearest
}
