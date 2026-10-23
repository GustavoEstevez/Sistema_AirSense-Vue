export const ranges = {
  temperature: { good: [18, 26], warning: [15, 30] },
  humidity: { good: [40, 60], warning: [30, 70] },
  noise: { goodMax: 50, warningMax: 70 },
  co2: { goodMax: 800, warningMax: 1200 },
}

function band(value, good, warning, lowLabels, highLabels) {
  if (!Number.isFinite(Number(value))) return { level: 'unknown', label: 'Sin datos' }
  const n = Number(value)
  if (n < warning[0]) return { level: 'danger', label: lowLabels[1] }
  if (n > warning[1]) return { level: 'danger', label: highLabels[1] }
  if (n < good[0]) return { level: 'warning', label: lowLabels[0] }
  if (n > good[1]) return { level: 'warning', label: highLabels[0] }
  return { level: 'normal', label: 'Normal' }
}

export function classifyReading(reading = {}) {
  const temperature = band(
    reading.temperature,
    ranges.temperature.good,
    ranges.temperature.warning,
    ['Fresco', 'Muy frío'],
    ['Cálido', 'Muy caliente'],
  )
  const humidity = band(
    reading.humidity,
    ranges.humidity.good,
    ranges.humidity.warning,
    ['Seco', 'Muy seco'],
    ['Húmedo', 'Muy húmedo'],
  )
  if (humidity.level === 'normal') humidity.label = 'Óptima'

  const noiseValue = Number(reading.noise)
  const noise = !Number.isFinite(noiseValue)
    ? { level: 'unknown', label: 'Sin datos' }
    : noiseValue > ranges.noise.warningMax
      ? { level: 'danger', label: 'Muy ruidoso' }
      : noiseValue > ranges.noise.goodMax
        ? { level: 'warning', label: 'Elevado' }
        : { level: 'normal', label: 'Ruido bajo' }

  const co2Value = Number(reading.co2)
  const co2 = !Number.isFinite(co2Value)
    ? { level: 'unknown', label: 'Sin datos' }
    : co2Value > ranges.co2.warningMax
      ? { level: 'danger', label: 'Aire viciado' }
      : co2Value > ranges.co2.goodMax
        ? { level: 'warning', label: 'Ventilar' }
        : { level: 'normal', label: 'Aire fresco' }

  const metrics = { temperature, humidity, noise, co2 }
  const levels = Object.values(metrics).map((item) => item.level)
  const level = levels.includes('danger')
    ? 'danger'
    : levels.includes('warning')
      ? 'warning'
      : levels.every((item) => item === 'unknown')
        ? 'unknown'
        : 'normal'

  const state = {
    normal: { title: 'Ambiente saludable', badge: 'Saludable', description: 'Las lecturas están dentro de los rangos recomendados.' },
    warning: { title: 'Atención ambiental', badge: 'Advertencia', description: 'Una o más variables se están alejando del rango óptimo.' },
    danger: { title: 'Ambiente no saludable', badge: 'No saludable', description: 'Hay valores críticos. Aplicá las recomendaciones y ventilá el espacio.' },
    unknown: { title: 'Esperando mediciones', badge: 'Sin datos', description: 'El dashboard se actualizará cuando llegue una lectura.' },
  }[level]

  return { ...state, level, metrics }
}

export function recommendations(reading = {}) {
  const result = []
  const state = classifyReading(reading)
  if (state.metrics.co2.level !== 'normal' && state.metrics.co2.level !== 'unknown') {
    result.push('Abrí puertas o ventanas para renovar el aire del ambiente.')
  }
  if (state.metrics.noise.level !== 'normal' && state.metrics.noise.level !== 'unknown') {
    result.push('Reducí fuentes de ruido o alejate de ellas durante unos minutos.')
  }
  if (state.metrics.temperature.level !== 'normal' && state.metrics.temperature.level !== 'unknown') {
    result.push(Number(reading.temperature) > 26 ? 'Bajá la temperatura o mejorá la circulación de aire.' : 'Acondicioná el espacio para elevar la temperatura gradualmente.')
  }
  if (state.metrics.humidity.level !== 'normal' && state.metrics.humidity.level !== 'unknown') {
    result.push(Number(reading.humidity) > 60 ? 'Ventilá para reducir la humedad acumulada.' : 'Considerá usar un humidificador o una fuente de humedad controlada.')
  }
  if (!result.length && state.level !== 'unknown') result.push('Todo se ve bien. Mantené la ventilación habitual del espacio.')
  if (!result.length) result.push('Encendé la estación AirSense y verificá su conexión Wi-Fi.')
  return result
}
