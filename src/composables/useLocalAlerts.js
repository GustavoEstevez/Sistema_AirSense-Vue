import { reactive, ref, unref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { isMeasurement } from '../lib/dashboardPresentation'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'airsense.android-alert-settings.v1'
const STORAGE_PREFIX = 'airsense.android-alert-settings.v2.'

const defaults = {
  enabled: false,
  temperatureMin: 15,
  temperatureMax: 30,
  humidityMin: 30,
  humidityMax: 70,
  noiseMax: 70,
  co2Max: 1200,
  smartEnabled: false,
  smartTemperatureMin: null,
  smartTemperatureMax: null,
  smartWeatherLabel: '',
  smartUpdatedAt: '',
}

function settingsKey(deviceId) {
  return `${STORAGE_PREFIX}${encodeURIComponent(deviceId || 'default')}`
}

function loadSettings(deviceId = 'default') {
  try {
    const raw = localStorage.getItem(settingsKey(deviceId)) || localStorage.getItem(STORAGE_KEY) || '{}'
    const saved = JSON.parse(raw)
    return { ...defaults, ...saved }
  } catch {
    return { ...defaults }
  }
}

const settings = reactive(loadSettings())
const permission = ref('prompt')
const feedback = ref('')
let activeDeviceId = 'default'
let primed = false
let wasCritical = false
let smartRefreshPromise = null
let lastSmartAttempt = 0
let contextVersion = 0

function activateDevice(deviceId) {
  const nextId = deviceId || 'default'
  if (nextId === activeDeviceId) return
  ++contextVersion
  smartRefreshPromise = null
  lastSmartAttempt = 0
  activeDeviceId = nextId
  Object.assign(settings, loadSettings(nextId))
  primed = false
  wasCritical = false
  feedback.value = ''
}

function finite(value) {
  const number = Number(value)
  return isMeasurement(value) ? number : null
}

function findBreaches(reading = {}) {
  const breaches = []
  const temperature = finite(reading.temperature)
  const humidity = finite(reading.humidity)
  const noise = finite(reading.noise)
  const co2 = finite(reading.co2)

  const temperatureMin = settings.smartEnabled && settings.smartTemperatureMin != null && Number.isFinite(Number(settings.smartTemperatureMin))
    ? Number(settings.smartTemperatureMin)
    : Number(settings.temperatureMin)
  const temperatureMax = settings.smartEnabled && settings.smartTemperatureMax != null && Number.isFinite(Number(settings.smartTemperatureMax))
    ? Number(settings.smartTemperatureMax)
    : Number(settings.temperatureMax)

  if (temperature != null && (temperature < temperatureMin || temperature > temperatureMax)) {
    breaches.push(`Temperatura: ${temperature.toFixed(1)} °C`)
  }
  if (humidity != null && (humidity < Number(settings.humidityMin) || humidity > Number(settings.humidityMax))) {
    breaches.push(`Humedad: ${humidity.toFixed(1)} %`)
  }
  if (noise != null && noise > Number(settings.noiseMax)) {
    breaches.push(`Nivel sonoro: ${noise.toFixed(0)} dB`)
  }
  if (co2 != null && co2 > Number(settings.co2Max)) {
    breaches.push(`Calidad del aire: ${co2.toFixed(0)} ppm`)
  }
  return breaches
}

async function refreshSmartThresholds(force = true) {
  if (!settings.smartEnabled || !supabase) return
  const lastUpdate = new Date(settings.smartUpdatedAt || 0).getTime()
  if (!force && Number.isFinite(lastUpdate) && Date.now() - lastUpdate < 6 * 60 * 60 * 1000) return
  if (smartRefreshPromise) return smartRefreshPromise
  if (!force && Date.now() - lastSmartAttempt < 15 * 60 * 1000) return
  lastSmartAttempt = Date.now()
  const context = contextVersion
  const regionContext = localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina'
  const current = () => context === contextVersion && settings.smartEnabled && regionContext === (localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina')
  const pending = (async () => {
    feedback.value = 'Consultando el clima de la región…'
    try {
      const region = localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina'
      const { data, error } = await supabase.functions.invoke('environment-recommendations', {
        body: {
          mode: 'thresholds',
          region,
          deviceId: activeDeviceId === 'default' ? null : activeDeviceId,
          thresholds: { temperatureMin: settings.temperatureMin, temperatureMax: settings.temperatureMax },
        },
      })
      if (!current()) return
      if (error) throw error
      settings.smartTemperatureMin = Number(data.thresholds.temperatureMin)
      settings.smartTemperatureMax = Number(data.thresholds.temperatureMax)
      settings.smartWeatherLabel = `${data.weather.temperatureC.toFixed(1)} °C afuera · ${data.weather.condition}`
      settings.smartUpdatedAt = new Date().toISOString()
      saveSettings()
      feedback.value = `Umbrales inteligentes actualizados: ${settings.smartTemperatureMin}–${settings.smartTemperatureMax} °C.`
    } catch (error) {
      if (current()) feedback.value = error?.message || 'No pudimos actualizar los umbrales con el clima actual.'
    }
  })()
  smartRefreshPromise = pending
  try {
    await pending
  } finally {
    if (smartRefreshPromise === pending) smartRefreshPromise = null
  }
}

async function enableSmartThresholds() {
  settings.smartEnabled = true
  saveSettings()
  await refreshSmartThresholds(true)
}

function disableSmartThresholds() {
  ++contextVersion
  smartRefreshPromise = null
  settings.smartEnabled = false
  saveSettings()
  feedback.value = 'Umbrales inteligentes desactivados. Se usarán los valores manuales.'
}

function saveSettings() {
  localStorage.setItem(settingsKey(activeDeviceId), JSON.stringify({ ...settings }))
  feedback.value = 'Umbrales guardados para este AirSense únicamente en este teléfono.'
}

async function ensurePermission() {
  if (!Capacitor.isNativePlatform()) {
    permission.value = 'web'
    feedback.value = 'Las notificaciones locales se habilitan dentro de la APK Android.'
    return false
  }

  let status = await LocalNotifications.checkPermissions()
  if (status.display !== 'granted') status = await LocalNotifications.requestPermissions()
  permission.value = status.display
  if (status.display !== 'granted') {
    settings.enabled = false
    saveSettings()
    feedback.value = 'Android no concedió permiso para mostrar notificaciones.'
    return false
  }
  return true
}

async function showNotification(title, body) {
  if (!(await ensurePermission())) return false
  await LocalNotifications.schedule({
    notifications: [{
      id: Math.floor(Date.now() % 2_000_000_000),
      title,
      body,
      foreground: true,
      isExactNotification: false,
      extra: { route: '/dashboard/' },
    }],
  })
  return true
}

async function enableNotifications() {
  feedback.value = ''
  if (await ensurePermission()) {
    settings.enabled = true
    saveSettings()
    feedback.value = 'Alertas locales activadas en este dispositivo.'
  }
}

function disableNotifications() {
  settings.enabled = false
  saveSettings()
  feedback.value = 'Alertas locales desactivadas en este dispositivo.'
}

async function sendTestNotification() {
  feedback.value = ''
  if (await showNotification('Prueba AirSense', 'Las notificaciones locales funcionan correctamente.')) {
    feedback.value = 'Notificación de prueba enviada.'
  }
}

async function processReading(reading) {
  if (!reading) return
  const context = contextVersion
  if (reading.device_id !== activeDeviceId) return
  if (settings.smartEnabled) await refreshSmartThresholds(false)
  if (context !== contextVersion || reading.device_id !== activeDeviceId) return
  const breaches = findBreaches(reading)
  const critical = breaches.length > 0

  if (!primed) {
    primed = true
    wasCritical = critical
    return
  }

  if (settings.enabled && critical && !wasCritical) {
    try {
      await showNotification('Ambiente no saludable', breaches.join(' · '))
    } catch (error) {
      feedback.value = error?.message || 'No se pudo mostrar la alerta local.'
    }
  }
  wasCritical = critical
}

export function useLocalAlerts(deviceId) {
  activateDevice(unref(deviceId))
  if (deviceId && typeof deviceId === 'object') {
    watch(() => unref(deviceId), (value) => activateDevice(value))
  }
  return {
    isNative: Capacitor.isNativePlatform(),
    settings,
    permission,
    feedback,
    findBreaches,
    saveSettings,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    processReading,
    refreshSmartThresholds,
    enableSmartThresholds,
    disableSmartThresholds,
  }
}
