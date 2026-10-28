<script setup>
import { computed, ref } from 'vue'
import MetricCard from '../components/MetricCard.vue'
import SparkChart from '../components/SparkChart.vue'
import QuoteModal from '../components/QuoteModal.vue'
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

const showQuote = ref(false)
const selectedRoom = ref('Sede Central · Sala de Operaciones (Piso 3)')

const email = ref('')
const sending = ref(false)
const emailMessage = ref('')
const emailSuccess = ref(false)
const analysis = computed(() => classifyReading(latest.value ?? {}))
const tips = computed(() => recommendations(latest.value ?? {}))

const cards = computed(() => [
  { key: 'temperature', title: 'Temperatura Confort', sensor: 'Sensor Sensirion SHT30', value: format(latest.value?.temperature), unit: '°C', icon: '°', accent: '#f97316' },
  { key: 'humidity', title: 'Humedad Relativa', sensor: 'Sensor Sensirion SHT30', value: format(latest.value?.humidity), unit: '%', icon: '◒', accent: '#08a6ba' },
  { key: 'noise', title: 'Presión Acústica', sensor: 'Micrófono MAX4466', value: format(latest.value?.noise, 0), unit: 'dB', icon: '≋', accent: '#775cf6' },
  { key: 'co2', title: 'Calidad de Aire CO₂', sensor: 'Sensor MQ-135 Industrial', value: format(latest.value?.co2, 0), unit: 'ppm', icon: '◌', accent: '#10b981' },
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
        
        <div class="room-selector-strip">
          <span class="room-label">Punto de Medición:</span>
          <select v-model="selectedRoom" class="room-select">
            <option value="Sede Central · Sala de Operaciones (Piso 3)">Sede Central · Sala de Operaciones (Piso 3)</option>
            <option value="Sede Central · Sala de Directorio">Sede Central · Sala de Directorio (Piso 5)</option>
            <option value="Edificio Norte · Open Space Coworking">Edificio Norte · Open Space Coworking</option>
            <option value="Planta Industrial · Laboratorio de Calidad">Planta Industrial · Laboratorio de Calidad</option>
          </select>
          <span class="sensor-id-pill">ID: <code>AS-PRO-0042</code></span>
        </div>
      </div>

      <div class="connection-card panel">
        <span class="connection-dot" :class="{ online: stationOnline }"></span>
        <div>
          <strong>{{ stationOnline ? 'Estación IoT Transmitiendo' : 'Estación en Reposo / Esperando Señal' }}</strong>
          <small>{{ realtimeConnected || demoEnabled ? 'Canal Cifrado WSS Supabase Activo' : 'Conectando con Supabase Cloud' }}</small>
        </div>
      </div>
    </section>

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

    <!-- Main Live Metrics Grid -->
    <section class="dashboard-content page-width">
      <div class="dashboard-meta">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="live-indicator-dot"></span>
          <p style="margin: 0;">{{ loading ? 'Recuperando telemetría de sensores…' : `Última muestra recibida: ${formatDate(latest?.recorded_at)}` }}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span v-if="demoEnabled" class="demo-pill">Simulación Demostrativa</span>
          <button type="button" class="corp-quote-mini-btn" @click="showQuote = true">Solicitar Presupuesto</button>
        </div>
      </div>

      <div class="metrics-grid">
        <MetricCard v-for="card in cards" :key="card.key" v-bind="card" />
        <article class="environment-card panel" :data-state="analysis.level">
          <div class="environment-icon">{{ analysis.level === 'normal' ? '✓' : analysis.level === 'unknown' ? '…' : '!' }}</div>
          <h3>{{ analysis.title }}</h3>
          <p>{{ analysis.description }}</p>
          <span>{{ analysis.badge }}</span>
        </article>
      </div>

      <!-- Facility Protocols and Executive Email Reports -->
      <div class="dashboard-two-cols">
        <article class="recommendations panel">
          <span class="section-kicker">PROTOCOLOS DE FACILITY MANAGEMENT</span>
          <h2>Acciones Operativas Recomendadas</h2>
          <p style="color: var(--muted); font-size: 0.85rem; margin-top: -8px; margin-bottom: 14px;">
            Medidas automáticas basadas en estándares internacionales de calidad de aire interior (ASHRAE y WELL):
          </p>
          <ul>
            <li v-for="tip in tips" :key="tip">
              <b>→</b>{{ tip }}
            </li>
          </ul>
        </article>

        <article class="email-panel panel">
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

    <!-- Historical Audit Charts -->
    <section class="charts-section">
      <div class="page-width">
        <div class="section-heading left">
          <span>TRAZABILIDAD Y REGISTRO HISTÓRICO</span>
          <h2>Comportamiento de Variables Ambientales</h2>
          <p style="color: var(--muted); margin-top: 6px;">Visualizá la evolución de las últimas lecturas para identificar patrones térmicos o picos de CO₂ durante las jornadas laborales.</p>
        </div>
        <div class="charts-grid">
          <SparkChart title="Temperatura Confort" :readings="readings" field="temperature" unit="°C" color="#f97316" :reference="26" />
          <SparkChart title="Humedad Relativa" :readings="readings" field="humidity" unit="%" color="#08a6ba" :reference="60" />
          <SparkChart title="Presión Sonora" :readings="readings" field="noise" unit="dB" color="#775cf6" :reference="50" />
          <SparkChart title="Concentración de CO₂" :readings="readings" field="co2" unit="ppm" color="#10b981" :reference="800" />
        </div>
      </div>
    </section>

    <QuoteModal :show="showQuote" @close="showQuote = false" />
  </div>
</template>
