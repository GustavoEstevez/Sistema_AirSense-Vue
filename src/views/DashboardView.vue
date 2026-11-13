<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import MetricCard from '../components/MetricCard.vue'
import HistoricalDashboard from '../components/HistoricalDashboard.vue'
import SmartRecommendations from '../components/SmartRecommendations.vue'
import QuoteModal from '../components/QuoteModal.vue'
import DeviceSwitcher from '../components/DeviceSwitcher.vue'
import DeviceTechnicalStatus from '../components/DeviceTechnicalStatus.vue'
import { useReadings } from '../composables/useReadings'
import { useDevices } from '../composables/useDevices'
import { useLocalAlerts } from '../composables/useLocalAlerts'
import { useAuth } from '../composables/useAuth'
import { classifyReading } from '../lib/environment'
import { supabase } from '../lib/supabase'
import { connectionStatus, isFreshReading, isMeasurement, measurementTrend } from '../lib/dashboardPresentation'

const deviceManager = useDevices()
const auth = useAuth()
const {
  readings,
  latest,
  loading,
  error,
  configured,
  demoEnabled,
  reload,
  realtimeConnected,
} = useReadings(deviceManager.selectedDeviceId)

const showQuote = ref(false)
const nativeApp = Capacitor.isNativePlatform()
const localAlerts = useLocalAlerts(deviceManager.selectedDeviceId)
const networkOnline = ref(navigator.onLine)
const clock = ref(Date.now())
let statusTimer
const connection = computed(() => connectionStatus({ online: networkOnline.value, error: error.value, configured, demo: demoEnabled, latest: latest.value, now: clock.value }))
const fresh = computed(() => demoEnabled || isFreshReading(latest.value, clock.value))
const stationName = computed(() => deviceManager.selectedDevice.value?.display_name || deviceManager.selectedDevice.value?.id || 'Sin estación seleccionada')

const email = ref('')
const sending = ref(false)
const emailMessage = ref('')
const emailSuccess = ref(false)
let emailRequest = 0
watch(deviceManager.selectedDeviceId, () => {
  ++emailRequest
  sending.value = false
  emailMessage.value = ''
  emailSuccess.value = false
}, { flush: 'sync' })
const analysis = computed(() => classifyReading(latest.value ?? {}))

function updateNetworkState() {
  networkOnline.value = navigator.onLine
}
onMounted(() => {
  statusTimer = window.setInterval(() => { clock.value = Date.now() }, 5000)
  window.addEventListener('online', updateNetworkState)
  window.addEventListener('offline', updateNetworkState)
})
onBeforeUnmount(() => {
  clearInterval(statusTimer)
  window.removeEventListener('online', updateNetworkState)
  window.removeEventListener('offline', updateNetworkState)
})

watch(
  () => latest.value?.id,
  () => { if (fresh.value && !demoEnabled) void localAlerts.processReading(latest.value) },
  { immediate: true },
)

const cards = computed(() => [
  { key: 'temperature', title: 'Temperatura', value: format(latest.value?.temperature), unit: '°C', icon: 'temperature', accent: '#f97316' },
  { key: 'humidity', title: 'Humedad relativa', value: format(latest.value?.humidity), unit: '%', icon: 'humidity', accent: '#088395' },
  { key: 'noise', title: 'Nivel sonoro', value: format(latest.value?.noise, 0), unit: 'dB', icon: 'noise', accent: '#775cf6' },
  { key: 'co2', title: 'Indicador del aire', value: format(latest.value?.co2, 0), unit: 'ppm', icon: 'air', accent: '#088395' },
].map((card) => ({ ...card, accent: '#088395', state: !fresh.value && isMeasurement(latest.value?.[card.key]) ? { level: 'unknown', label: 'Lectura anterior' } : card.key === 'co2' ? { level: 'unknown', label: isMeasurement(latest.value?.co2) ? 'Medición estimada' : 'Sin datos' } : !isMeasurement(latest.value?.[card.key]) ? { level: 'unknown', label: 'Sin datos' } : analysis.value.metrics[card.key], trend: getTrend(card.key) })))

function format(value, decimals = 1) {
  return isMeasurement(value) ? Number(value).toFixed(decimals) : '—'
}

function getTrend(field) {
  return measurementTrend(readings.value, field)
}

function formatDate(date) {
  if (!date) return 'Aguardando telemetría'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Fecha de telemetría no válida'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'medium' }).format(parsed)
}

async function sendEmail() {
  if (sending.value || demoEnabled || !auth.isAuthenticated.value) return
  const pending = ++emailRequest
  emailMessage.value = ''
  emailSuccess.value = false
  if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    emailMessage.value = 'Ingresá un correo corporativo válido.'
    return
  }
  if (!supabase) {
    emailMessage.value = 'Conectá las credenciales de Supabase en producción.'
    return
  }
  if (!latest.value) {
    emailMessage.value = 'No hay lecturas registradas para exportar en este momento.'
    return
  }
  sending.value = true
  try {
    const { error: functionError } = await supabase.functions.invoke('send-reading-email', {
      body: { email: email.value, readingId: latest.value.id },
    })
    if (pending !== emailRequest) return
    if (functionError) throw functionError
    emailSuccess.value = true
    emailMessage.value = 'Informe de auditoría despachado correctamente por la Edge Function.'
    email.value = ''
  } catch (sendError) {
    if (pending === emailRequest) emailMessage.value = sendError?.message || 'No se pudo despachar el informe corporativo. Intentá nuevamente.'
  } finally {
    if (pending === emailRequest) sending.value = false
  }
}
</script>

<template>
  <div class="dashboard-page">
    <!-- Corporate Dashboard Top Bar -->
    <section class="dashboard-hero page-width">
      <div>
        <div class="corp-pill-wrap">
          <span class="dashboard-eyebrow">AIRSENSE · TU ESPACIO</span>
        </div>
        <h1>Tu ambiente, en tiempo real.</h1>
        <p>Toda la información de tu entorno, presentada de forma simple y clara.</p>
        
      </div>

      <div class="connection-card panel" role="status" :data-connection="connection.key">
        <span class="connection-dot" :class="{ online: connection.key === 'online' }"></span>
        <div>
          <strong>{{ connection.label }}</strong>
          <small>{{ stationName }}</small>
          <small v-if="configured && !demoEnabled && latest && !realtimeConnected">Reconectando actualizaciones…</small>
          <small>{{ loading ? 'Actualizando…' : latest ? 'Lecturas disponibles' : 'Sin mediciones disponibles' }}</small>
        </div>
      </div>
    </section>

    <Transition name="offline-banner">
      <section v-if="!networkOnline" class="offline-banner page-width" role="status">
        <strong>Sin conexión a internet</strong>
        <span>Podés consultar lo que ya estaba cargado. AirSense retomará la sincronización automáticamente.</span>
      </section>
    </Transition>

    <!-- Supabase Setup Notice (only if not configured and demo is off) -->
    <section v-if="!configured && !demoEnabled" class="setup-notice page-width">
      <div>
        <strong>Tu espacio está listo para conectar.</strong>
        <p>La conexión de datos todavía no está configurada.</p>
      </div>
    </section>

    <section v-if="error" class="error-notice page-width">
      <span>{{ error }}</span>
      <button type="button" @click="reload">Reintentar Conexión</button>
    </section>

    <DeviceSwitcher
      :now="clock"
      class="page-width"
      :devices="deviceManager.devices.value"
      :selected-id="deviceManager.selectedDeviceId.value"
      :loading="deviceManager.loading.value"
      @select="deviceManager.selectDevice"
    />

    <section v-if="deviceManager.error.value" class="error-notice page-width">
      <span>{{ deviceManager.error.value }}</span>
      <button type="button" @click="deviceManager.reload">Reintentar</button>
    </section>

    <!-- Main Live Metrics Grid -->
    <section class="dashboard-content page-width">
      <div class="dashboard-meta">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="live-indicator-dot" :class="{ 'is-online': connection.key === 'online' }"></span>
          <p style="margin: 0;">{{ loading ? 'Recuperando mediciones…' : `Última muestra recibida: ${formatDate(latest?.recorded_at)}` }}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span v-if="demoEnabled" class="demo-pill">Simulación Demostrativa</span>
          <button v-if="!nativeApp" type="button" class="corp-quote-mini-btn" @click="showQuote = true">Solicitar Presupuesto</button>
        </div>
      </div>

      <TransitionGroup name="metric-list" tag="div" class="metrics-grid">
        <MetricCard v-for="card in cards" :key="card.key" v-bind="card" />
        <article :key="'environment'" class="environment-card panel" :data-state="fresh ? analysis.level : 'unknown'">
          <div class="environment-icon" aria-hidden="true">{{ latest ? '↗' : '…' }}</div>
          <div><h3>{{ latest ? 'Tu entorno, medido.' : 'Esperando tu primera lectura.' }}</h3>
          <p>{{ latest ? 'Consultá cada variable y su evolución. El indicador del aire es una estimación, no una medición verificada de CO₂.' : 'Las métricas aparecerán cuando tu estación envíe datos.' }}</p></div>
          <span>{{ connection.label }}</span>
        </article>
      </TransitionGroup>

      <DeviceTechnicalStatus :device="deviceManager.selectedDevice.value" :connection="connection" />

      <!-- Facility Protocols and Executive Email Reports -->
      <div class="dashboard-two-cols">
        <SmartRecommendations :reading="latest" :fresh="fresh" :demo="demoEnabled" :now="clock" />

        <article v-if="!nativeApp" class="email-panel panel">
          <span class="section-kicker">COMPARTIR INFORMACIÓN</span>
          <h2>Tu ambiente, en un informe.</h2>
          <p>
            Enviá un resumen de las mediciones actuales al correo que elijas.
          </p>
          <form @submit.prevent="sendEmail">
            <label for="reading-email">Correo Electrónico Corporativo</label>
            <div>
              <input
                id="reading-email"
                v-model.trim="email"
                type="email"
                autocomplete="email"
                placeholder="nombre@empresa.com"
              />
              <button :disabled="sending || demoEnabled || !latest || !auth.isAuthenticated.value">
                {{ sending ? 'Enviando…' : 'Enviar informe' }}
              </button>
            </div>
            <small :class="{ success: emailSuccess }" role="status">{{ emailMessage }}</small>
            <small v-if="demoEnabled">Los informes por correo no están disponibles en la demostración.</small>
            <small v-else-if="!auth.isAuthenticated.value"><RouterLink to="/cuenta/ingresar/?redirect=/dashboard/">Iniciá sesión</RouterLink> para enviar un informe.</small>
          </form>
          <div class="security-stamp">
            <span>Se comparte la última lectura disponible de la estación seleccionada.</span>
          </div>
        </article>
      </div>
    </section>

    <HistoricalDashboard :device-id="deviceManager.selectedDeviceId.value" :reconnect-key="realtimeConnected" />

    <QuoteModal v-if="!nativeApp" :show="showQuote" @close="showQuote = false" />
  </div>
</template>
