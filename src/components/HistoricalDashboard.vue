<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import SparkChart from './SparkChart.vue'
import { supabase } from '../lib/supabase'

const props = defineProps({ deviceId: { type: String, default: '' } })

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

const chartReadings = computed(() => {
  const rows = readings.value
  if (rows.length <= 240) return rows
  const step = (rows.length - 1) / 239
  return Array.from({ length: 240 }, (_, index) => rows[Math.round(index * step)])
})

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
  if (!supabase) return
  loading.value = true
  error.value = ''
  try {
    const collected = []
    const pageSize = 1000
    const start = fromDate()
    for (let page = 0; ; page += 1) {
      let query = supabase
        .from('sensor_readings')
        .select('id, device_id, temperature, humidity, noise, co2, recorded_at')
        .order('recorded_at', { ascending: true })
        .range(page * pageSize, page * pageSize + pageSize - 1)
      if (start) query = query.gte('recorded_at', start)
      if (props.deviceId) query = query.eq('device_id', props.deviceId)
      const { data, error: queryError } = await query
      if (queryError) throw queryError
      collected.push(...(data || []))
      if (!data || data.length < pageSize) break
    }
    readings.value = collected
  } catch (loadError) {
    error.value = loadError?.message || 'No se pudo recuperar el historial.'
  } finally {
    loading.value = false
  }
}

async function selectPeriod(period) {
  if (selected.value === period && readings.value.length) return
  selected.value = period
  await loadHistory()
}

onMounted(loadHistory)
watch(() => props.deviceId, (current, previous) => {
  if (current && current !== previous) loadHistory()
})
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

      <p v-if="loading" class="history-status">Recuperando historial…</p>
      <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else class="history-status">{{ readings.length.toLocaleString('es-AR') }} mediciones encontradas · se muestran hasta 240 puntos representativos por gráfico.</p>

      <div class="charts-grid" :aria-busy="loading">
        <SparkChart title="Temperatura" :readings="chartReadings" field="temperature" unit="°C" color="#088395" :reference="26" :loading="loading" />
        <SparkChart title="Humedad relativa" :readings="chartReadings" field="humidity" unit="%" color="#088395" :reference="60" :loading="loading" />
        <SparkChart title="Nivel sonoro" :readings="chartReadings" field="noise" unit="dB" color="#088395" :reference="50" :loading="loading" />
        <SparkChart title="Indicador del aire · MQ-135" :readings="chartReadings" field="co2" unit="ppm" color="#088395" :reference="800" :loading="loading" />
      </div>
    </div>
  </section>
</template>
