<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import SparkChart from './SparkChart.vue'
import { supabase } from '../lib/supabase'
import { loadHistorySummary } from '../lib/historySummary'

const props = defineProps({ deviceId: { type: String, default: '' }, reconnectKey: Boolean })

const periods = [
  { key: 'hour', label: '1 hora' },
  { key: 'day', label: 'Hoy' },
  { key: 'week', label: '7 días' },
  { key: 'month', label: '30 días' },
  { key: 'all', label: 'Todo' },
]

const selected = ref('day')
const readings = ref([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const partial = ref(false)
let request = 0
let controller
const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true'

const chartReadings = computed(() => readings.value)

const periodDescription = computed(() => ({
  hour: 'de la última hora',
  day: 'desde las 00:00 de hoy',
  week: 'de los últimos 7 días',
  month: 'de los últimos 30 días',
  all: 'desde la primera medición guardada',
}[selected.value]))

function fromDate() {
  const now = new Date()
  if (selected.value === 'hour') return new Date(Date.now() - 60 * 60 * 1000).toISOString()
  if (selected.value === 'day') {
    now.setHours(0, 0, 0, 0)
    return now.toISOString()
  }
  if (selected.value === 'week') return new Date(Date.now() - 7 * 86_400_000).toISOString()
  if (selected.value === 'month') return new Date(Date.now() - 30 * 86_400_000).toISOString()
  return null
}

async function loadHistory() {
  const pending = ++request
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  const deviceId = props.deviceId
  const start = fromDate()
  const end = new Date().toISOString()
  readings.value = []
  total.value = 0
  partial.value = false
  error.value = ''
  loading.value = false
  if (!supabase || !deviceId || demoEnabled) return
  loading.value = true
  error.value = ''
  try {
    const summary = await loadHistorySummary(supabase, { deviceId, from: start, to: end, signal })
    if (pending !== request || signal.aborted || !summary) return
    readings.value = summary.readings
    total.value = summary.total
    partial.value = summary.partial
  } catch (loadError) {
    if (pending === request && !signal.aborted) error.value = loadError?.message || 'No se pudo recuperar el historial.'
  } finally {
    if (pending === request) loading.value = false
  }
}

async function selectPeriod(period) {
  if (selected.value === period && readings.value.length) return
  if (selected.value === period) await loadHistory()
  else selected.value = period
}

watch(() => props.reconnectKey, (connected) => { if (connected) void loadHistory() })
watch([() => props.deviceId, selected], loadHistory, { immediate: true, flush: 'sync' })
onBeforeUnmount(() => { ++request; controller?.abort() })
</script>

<template>
  <section class="charts-section">
    <div class="page-width">
      <div class="history-heading">
        <div class="section-heading left">
          <span>TU ENTORNO A LO LARGO DEL TIEMPO</span>
          <h2>Historial ambiental</h2>
          <p>Descubrí cómo cambia tu espacio. Mediciones {{ periodDescription }}.</p>
        </div>
        <div class="history-periods" role="group" aria-label="Período del historial">
          <button
            v-for="period in periods"
            :key="period.key"
            type="button"
            :class="{ active: selected === period.key }"
            :aria-pressed="selected === period.key"
            :disabled="loading"
            @click="selectPeriod(period.key)"
          >{{ period.label }}</button>
        </div>
      </div>

      <p v-if="demoEnabled" class="history-status">El historial guardado no está disponible en el modo de demostración.</p>
      <p v-else-if="!deviceId" class="history-status">Seleccioná una estación para consultar su historial.</p>
      <p v-else-if="loading" class="history-status">Recuperando historial…</p>
      <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="partial" class="history-status" role="status">Vista parcial: hasta las últimas 240 lecturas del período. El resumen completo todavía no está disponible en este entorno.</p>
      <p v-else class="history-status">{{ total.toLocaleString('es-AR') }} mediciones del período · {{ readings.length }} puntos mostrados. Si hay más de 240 mediciones, se conservan el inicio, el final y los mínimos y máximos de cada variable por intervalo.</p>

      <div class="charts-grid" :aria-busy="loading">
        <SparkChart title="Temperatura" :readings="chartReadings" field="temperature" unit="°C" color="#088395" :reference="26" :loading="loading" />
        <SparkChart title="Humedad relativa" :readings="chartReadings" field="humidity" unit="%" color="#088395" :reference="60" :loading="loading" />
        <SparkChart title="Nivel sonoro" :readings="chartReadings" field="noise" unit="dB" color="#088395" :reference="50" :loading="loading" />
        <SparkChart title="Indicador del aire · estimado" :readings="chartReadings" field="co2" unit="ppm" color="#088395" :reference="800" :loading="loading" />
      </div>
    </div>
  </section>
</template>
