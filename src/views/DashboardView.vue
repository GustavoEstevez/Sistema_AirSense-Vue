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
import { classifyReading } from '../lib/environment'
import { supabase } from '../lib/supabase'

const deviceManager = useDevices()
const {
  readings,
  latest,
  loading,
  error,
  configured,
  demoEnabled,
  realtimeConnected,
  stationOnline,
  reload,
} = useReadings(deviceManager.selectedDeviceId)

const showQuote = ref(false)
const nativeApp = Capacitor.isNativePlatform()
const localAlerts = useLocalAlerts(deviceManager.selectedDeviceId)
const networkOnline = ref(navigator.onLine)

const email = ref('')
const sending = ref(false)
const emailMessage = ref('')
const emailSuccess = ref(false)
const analysis = computed(() => classifyReading(latest.value ?? {}))

function updateNetworkState() {
  networkOnline.value = navigator.onLine
}
onMounted(() => {
  window.addEventListener('online', updateNetworkState)
  window.addEventListener('offline', updateNetworkState)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', updateNetworkState)
  window.removeEventListener('offline', updateNetworkState)
})

watch(
  () => latest.value?.id,
  () => localAlerts.processReading(latest.value),
  { immediate: true },
)

const cards = computed(() => [
  { key: 'temperature', title: 'Temperatura', sensor: 'Sensor Sensirion SHT30', value: format(latest.value?.temperature), unit: '°C', icon: 'temperature', accent: '#f97316' },
  { key: 'humidity', title: 'Humedad Relativa', sensor: 'Sensor Sensirion SHT30', value: format(latest.value?.humidity), unit: '%', icon: 'humidity', accent: '#08a6ba' },
  { key: 'noise', title: 'Nivel sonoro', sensor: 'Micrófono MAX4466', value: format(latest.value?.noise, 0), unit: 'dB', icon: 'noise', accent: '#775cf6' },
  { key: 'co2', title: 'Calidad del aire', sensor: 'Sensor MQ-135 · estimación en partes por millón', value: format(latest.value?.co2, 0), unit: 'ppm', icon: 'air', accent: '#10b981' },
].map((card) => ({ ...card, state: analysis.value.metrics[card.key], trend: getTrend(card.key) })))

function format(value, decimals = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : '—'
}

function getTrend(field) {
  const valid = readings.value.map((item) => Number(item[field])).filter(Number.isFinite)
  if (valid.length < 2) return NaN
  return valid.at(-1) - valid.at(-2)
}

function formatDate(date) {
  if (!date) return 'Aguardando telemetría'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Fecha de telemetría no válida'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'medium' }).format(parsed)
}

async function sendEmail() {
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
    if (functionError) throw functionError
    emailSuccess.value = true
    emailMessage.value = 'Informe de auditoría despachado correctamente por la Edge Function.'
    email.value = ''
  } catch (sendError) {
    emailMessage.value = sendError?.message || 'No se pudo despachar el informe corporativo. Intentá nuevamente.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="dashboard-page page-grid-bg">
    <!-- Corporate Dashboard Top Bar -->
    <section class="dashboard-hero page-width">
      <div>
        <div class="corp-pill-wrap">
          <span class="eyebrow"><i></i> CENTRO DE TELEMETRÍA AMBIENTAL</span>
          <span class="enterprise-badge">AIRSENSE™ ENTERPRISE CLOUD</span>
        </div>
        <h1>Consola de Supervisión en Tiempo Real</h1>
        <p>Telemetría continua de parámetros ambientales para auditorías de higiene, confort térmico y calidad de aire interior.</p>
        
      </div>

      <div class="connection-card panel">
        <span class="connection-dot" :class="{ online: stationOnline }"></span>
        <div>
          <strong>{{ stationOnline ? 'Estación IoT Transmitiendo' : 'Estación en Reposo / Esperando Señal' }}</strong>
          <small>{{ realtimeConnected || demoEnabled ? 'Canal Cifrado WSS Supabase Activo' : 'Conectando con Supabase Cloud' }}</small>
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
        <strong>Conexión con Supabase Cloud en Proceso</strong>
        <p>Para sincronizar dispositivos físicos de tu empresa, configurá las claves en el archivo <code>.env</code>.</p>
      </div>
      <RouterLink to="/documentacion/">Guía de Integración IT →</RouterLink>
    </section>

    <section v-if="error" class="error-notice page-width">
      <span>{{ error }}</span>
      <button type="button" @click="reload">Reintentar Conexión</button>
    </section>

    <DeviceSwitcher
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
          <span class="live-indicator-dot"></span>
          <p style="margin: 0;">{{ loading ? 'Recuperando telemetría de sensores…' : `Última muestra recibida: ${formatDate(latest?.recorded_at)}` }}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span v-if="demoEnabled" class="demo-pill">Simulación Demostrativa</span>
          <button v-if="!nativeApp" type="button" class="corp-quote-mini-btn" @click="showQuote = true">Solicitar Presupuesto</button>
        </div>
      </div>

      <TransitionGroup name="metric-list" tag="div" class="metrics-grid">
        <MetricCard v-for="card in cards" :key="card.key" v-bind="card" />
        <article :key="'environment'" class="environment-card panel" :data-state="analysis.level">
          <div class="environment-icon">{{ analysis.level === 'normal' ? '✓' : analysis.level === 'unknown' ? '…' : '!' }}</div>
          <h3>{{ analysis.title }}</h3>
          <p>{{ analysis.description }}</p>
          <span>{{ analysis.badge }}</span>
        </article>
      </TransitionGroup>

      <DeviceTechnicalStatus :device="deviceManager.selectedDevice.value" />

      <!-- Facility Protocols and Executive Email Reports -->
      <div class="dashboard-two-cols">
        <SmartRecommendations :reading="latest" />

        <article v-if="!nativeApp" class="email-panel panel">
          <span class="section-kicker">AUDITORÍA Y REPORTES EJECUTIVOS</span>
          <h2>Remitir Informe a Dirección</h2>
          <p>
            Envía instantáneamente un resumen ejecutivo certificado con las métricas ambientales actuales a la Gerencia de Recursos Humanos o Seguridad e Higiene.
          </p>
          <form @submit.prevent="sendEmail">
            <label for="reading-email">Correo Electrónico Corporativo</label>
            <div>
              <input
                id="reading-email"
                v-model.trim="email"
                type="email"
                autocomplete="email"
                placeholder="gerencia@tuempresa.com"
              />
              <button :disabled="sending">
                {{ sending ? 'Despachando…' : 'Enviar Informe' }}
              </button>
            </div>
            <small :class="{ success: emailSuccess }" role="status">{{ emailMessage }}</small>
          </form>
          <div class="security-stamp">
            <span>Procesado mediante Supabase Edge Functions con entrega segura vía Gmail SMTP.</span>
          </div>
        </article>
      </div>
    </section>

    <HistoricalDashboard :device-id="deviceManager.selectedDeviceId.value" />

    <QuoteModal v-if="!nativeApp" :show="showQuote" @close="showQuote = false" />
  </div>
</template>
