<script setup>
import { computed, ref } from 'vue'
import MetricCard from '../components/MetricCard.vue'
import SparkChart from '../components/SparkChart.vue'
import { useReadings } from '../composables/useReadings'
import { classifyReading, recommendations } from '../lib/environment'
import { supabase } from '../lib/supabase'

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
} = useReadings()

const email = ref('')
const sending = ref(false)
const emailMessage = ref('')
const emailSuccess = ref(false)
const analysis = computed(() => classifyReading(latest.value ?? {}))
const tips = computed(() => recommendations(latest.value ?? {}))

const cards = computed(() => [
  { key: 'temperature', title: 'Temperatura', sensor: 'Sensor SHT30', value: format(latest.value?.temperature), unit: '°C', icon: '°', accent: '#f97316' },
  { key: 'humidity', title: 'Humedad', sensor: 'Sensor SHT30', value: format(latest.value?.humidity), unit: '%', icon: '◒', accent: '#08a6ba' },
  { key: 'noise', title: 'Nivel de ruido', sensor: 'Micrófono MAX4466', value: format(latest.value?.noise, 0), unit: 'dB', icon: '≋', accent: '#775cf6' },
  { key: 'co2', title: 'Calidad del aire', sensor: 'Sensor MQ-135', value: format(latest.value?.co2, 0), unit: 'ppm', icon: '◌', accent: '#10b981' },
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
  if (!date) return 'Sin mediciones'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(date))
}

async function sendEmail() {
  emailMessage.value = ''
  emailSuccess.value = false
  if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    emailMessage.value = 'Ingresá un correo válido.'
    return
  }
  if (!supabase) {
    emailMessage.value = 'Primero configurá las variables de Supabase.'
    return
  }
  if (!latest.value) {
    emailMessage.value = 'Todavía no hay una lectura para enviar.'
    return
  }
  sending.value = true
  const { error: functionError } = await supabase.functions.invoke('send-reading-email', {
    body: { email: email.value, readingId: latest.value.id },
  })
  sending.value = false
  if (functionError) emailMessage.value = functionError.message || 'No se pudo enviar el correo.'
  else {
    emailSuccess.value = true
    emailMessage.value = 'Lectura enviada. Revisá tu bandeja de entrada.'
    email.value = ''
  }
}
</script>

<template>
  <div class="dashboard-page page-grid-bg">
    <section class="dashboard-hero page-width">
      <div>
        <span class="eyebrow"><i></i> TELEMETRÍA AMBIENTAL</span>
        <h1>Dashboard en vivo</h1>
        <p>La última medición aparece automáticamente mediante Supabase Realtime.</p>
      </div>
      <div class="connection-card panel">
        <span class="connection-dot" :class="{ online: stationOnline }"></span>
        <div><strong>{{ stationOnline ? 'Estación conectada' : 'Estación sin señal' }}</strong><small>{{ realtimeConnected || demoEnabled ? 'Canal en tiempo real activo' : 'Esperando conexión' }}</small></div>
      </div>
    </section>

    <section v-if="!configured && !demoEnabled" class="setup-notice page-width">
      <div><strong>Falta conectar Supabase</strong><p>Copiá <code>.env.example</code> como <code>.env</code> y completá la URL y la clave pública del proyecto.</p></div>
      <RouterLink to="/documentacion/">Ver configuración →</RouterLink>
    </section>

    <section v-if="error" class="error-notice page-width">
      <span>{{ error }}</span><button type="button" @click="reload">Reintentar</button>
    </section>

    <section class="dashboard-content page-width">
      <div class="dashboard-meta">
        <p>{{ loading ? 'Consultando mediciones…' : `Última actualización: ${formatDate(latest?.recorded_at)}` }}</p>
        <span v-if="demoEnabled" class="demo-pill">Datos de demostración</span>
      </div>

      <div class="metrics-grid">
        <MetricCard v-for="card in cards" :key="card.key" v-bind="card" />
        <article class="environment-card panel" :data-state="analysis.level">
          <div class="environment-icon">{{ analysis.level === 'normal' ? '✓' : analysis.level === 'unknown' ? '…' : '!' }}</div>
          <h3>{{ analysis.title }}</h3><p>{{ analysis.description }}</p><span>{{ analysis.badge }}</span>
        </article>
      </div>

      <div class="dashboard-two-cols">
        <article class="recommendations panel">
          <span class="section-kicker">RECOMENDACIONES</span><h2>Qué podés hacer ahora</h2>
          <ul><li v-for="tip in tips" :key="tip"><b>→</b>{{ tip }}</li></ul>
        </article>
        <article class="email-panel panel">
          <span class="section-kicker">COMPARTIR LECTURA</span><h2>Recibila por correo</h2><p>La Edge Function arma el resumen y lo envía con Resend, sin exponer claves en el navegador.</p>
          <form @submit.prevent="sendEmail">
            <label for="reading-email">Correo electrónico</label>
            <div><input id="reading-email" v-model.trim="email" type="email" autocomplete="email" placeholder="nombre@correo.com" /><button :disabled="sending">{{ sending ? 'Enviando…' : 'Enviar' }}</button></div>
            <small :class="{ success: emailSuccess }" role="status">{{ emailMessage }}</small>
          </form>
        </article>
      </div>
    </section>

    <section class="charts-section">
      <div class="page-width"><div class="section-heading left"><span>HISTORIAL RECIENTE</span><h2>Cómo evolucionaron las variables</h2></div>
        <div class="charts-grid">
          <SparkChart title="Temperatura" :readings="readings" field="temperature" unit="°C" color="#f97316" :reference="26" />
          <SparkChart title="Humedad" :readings="readings" field="humidity" unit="%" color="#08a6ba" :reference="60" />
          <SparkChart title="Ruido" :readings="readings" field="noise" unit="dB" color="#775cf6" :reference="50" />
          <SparkChart title="CO₂" :readings="readings" field="co2" unit="ppm" color="#10b981" :reference="800" />
        </div>
      </div>
    </section>
  </div>
</template>
