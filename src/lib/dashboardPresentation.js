export function isMeasurement(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

export function measurementTrend(readings, field) {
  const valid = readings.filter(row => isMeasurement(row[field]))
  return valid.length < 2 ? NaN : Number(valid.at(-1)[field]) - Number(valid.at(-2)[field])
}

export function connectionStatus({ online, error, configured, demo, latest, now = Date.now() }) {
  if (!online) return { key: 'offline', label: 'Sin conexión a internet' }
  if (error) return { key: 'error', label: 'Error de conexión' }
  if (demo) return { key: 'demo', label: 'Demostración' }
  if (!configured || !latest) return { key: 'waiting', label: 'Esperando datos' }
  const age = now - new Date(latest.recorded_at).getTime()
  return Number.isFinite(age) && age >= 0 && age < 30_000
    ? { key: 'online', label: 'Conectado' }
    : { key: 'offline', label: 'Estación desconectada' }
}
