export function isMeasurement(value) {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value))
}

// Allow short network/realtime interruptions without making a station that
// reports every two seconds flicker between connected and disconnected.
export const READING_FRESHNESS_MS = 120_000
export const CLOCK_SKEW_TOLERANCE_MS = 30_000

export function isFreshReading(reading, now = Date.now()) {
  const age = now - new Date(reading?.recorded_at).getTime()
  return Number.isFinite(age) && age >= -CLOCK_SKEW_TOLERANCE_MS && age < READING_FRESHNESS_MS
}

export function mergeReadings(rows, incoming, deviceId) {
  const unique = new Map()
  for (const row of [...rows, ...incoming]) {
    if (row.device_id === deviceId) unique.set(row.id, row)
  }
  return [...unique.values()].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)).slice(-60)
}

export function measurementTrend(readings, field) {
  const valid = readings.filter(row => isMeasurement(row[field]))
  return valid.length < 2 ? NaN : Number(valid.at(-1)[field]) - Number(valid.at(-2)[field])
}

export function connectionStatus({ online, error, configured, demo, latest, active, now = Date.now() }) {
  if (!online) return { key: 'offline', label: 'Sin conexión a internet' }
  if (error) return { key: 'error', label: 'Error de conexión' }
  if (demo) return { key: 'demo', label: 'Demostración' }
  if (!configured || !latest) return { key: 'waiting', label: 'Esperando datos' }
  const fresh = typeof active === 'boolean' ? active : isFreshReading(latest, now)
  return fresh
    ? { key: 'online', label: 'Conectado' }
    : { key: 'offline', label: 'Estación desconectada' }
}
