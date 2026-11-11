<script setup>
import { computed, ref, watch } from 'vue'
import { chartTimeline, nearestTimePoint } from '../lib/chartTimeline'

const props = defineProps({
  title: String,
  readings: { type: Array, default: () => [] },
  field: String,
  unit: String,
  color: String,
  reference: Number,
  loading: Boolean,
})

const timeline = computed(() => chartTimeline(props.readings, props.field))
const samples = computed(() => timeline.value.samples)
const values = computed(() => samples.value.map(item => Number(item[props.field])))
const selectedPoint = ref(null)
watch(samples, () => { selectedPoint.value = null })
const timeFormat = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const inspected = computed(() => selectedPoint.value == null ? null : samples.value[selectedPoint.value])
const inspectedLabel = computed(() => {
  if (!inspected.value) return ''
  const date = new Date(inspected.value.recorded_at)
  const time = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('es-AR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
  return `${Number(inspected.value[props.field]).toFixed(1)} ${props.unit} · ${time}`
})
function inspect(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  if (!rect.width) return
  selectedPoint.value = nearestTimePoint(timeline.value.positions, (event.clientX - rect.left) / rect.width * 100)
}
function navigate(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const index = selectedPoint.value ?? 0
  selectedPoint.value = event.key === 'Home' ? 0 : event.key === 'End' ? values.value.length - 1 : Math.max(0, Math.min(values.value.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))
}
const range = computed(() => {
  if (!values.value.length) return { min: 0, max: 1 }
  const all = props.reference == null ? values.value : [...values.value, props.reference]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const padding = Math.max((max - min) * 0.18, 1)
  return { min: min - padding, max: max + padding }
})
const points = computed(() => values.value.map((value, index) => {
  const x = timeline.value.positions[index]
  const y = 92 - ((value - range.value.min) / (range.value.max - range.value.min)) * 82
  return `${x.toFixed(2)},${y.toFixed(2)}`
}).join(' '))
const referenceY = computed(() => {
  if (props.reference == null) return null
  return 92 - ((props.reference - range.value.min) / (range.value.max - range.value.min)) * 82
})
const last = computed(() => values.value.at(-1))
</script>

<template>
  <article class="chart-card panel">
    <div class="chart-head"><h3>{{ title }}</h3><strong>{{ last == null ? '—' : last.toFixed(1) }} {{ unit }}</strong></div>
    <div class="chart-inspection" aria-live="polite">{{ inspectedLabel }}</div>
    <div v-if="loading || !values.length" class="chart-empty" role="status"><span aria-hidden="true">{{ loading ? '…' : '—' }}</span><p>{{ loading ? 'Cargando mediciones…' : 'Sin mediciones en este período' }}</p><small v-if="!loading">Elegí otro período o esperá la próxima lectura.</small></div>
    <svg v-else class="spark-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="group" tabindex="0" :aria-label="`Tendencia de ${title}. Usá las flechas para explorar las lecturas.`" @pointermove="inspect" @pointerleave="selectedPoint = null" @focus="selectedPoint = 0" @blur="selectedPoint = null" @keydown="navigate">
      <defs>
        <linearGradient :id="`fill-${field}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity=".28" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line v-for="y in [10, 51, 92]" :key="y" x1="0" x2="100" :y1="y" :y2="y" class="chart-grid-line" />
      <line v-if="referenceY != null" x1="0" x2="100" :y1="referenceY" :y2="referenceY" class="reference-line" />
      <polygon v-if="values.length > 1" :points="`${points} ${timeline.positions.at(-1)},100 ${timeline.positions[0]},100`" :fill="`url(#fill-${field})`" />
      <polyline v-if="points" :points="points" fill="none" :stroke="color" stroke-width="2.4" vector-effect="non-scaling-stroke" />
      <ellipse v-if="values.length === 1" :cx="timeline.positions[0]" :cy="92 - ((values[0] - range.min) / (range.max - range.min)) * 82" rx=".6" ry="1.5" :fill="color" />
      <line v-if="inspected" :x1="timeline.positions[selectedPoint]" :x2="timeline.positions[selectedPoint]" y1="0" y2="100" class="chart-cursor" />
    </svg>
    <div v-if="values.length && !loading" class="chart-time-axis"><span>{{ timeFormat.format(timeline.start) }}</span><span>{{ timeFormat.format(timeline.end) }}</span></div>
    <div v-if="values.length && !loading" class="chart-scale"><span>{{ range.min.toFixed(0) }}</span><span>{{ values.length }} lecturas · mín. / máx. de escala</span><span>{{ range.max.toFixed(0) }}</span></div>
  </article>
</template>

<style scoped>
.chart-time-axis { display: flex; justify-content: space-between; gap: 12px; font-size: .75rem; color: var(--muted); }
.chart-time-axis span:last-child { text-align: right; }
</style>
