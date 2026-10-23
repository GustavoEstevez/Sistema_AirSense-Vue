<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  readings: { type: Array, default: () => [] },
  field: String,
  unit: String,
  color: String,
  reference: Number,
})

const values = computed(() => props.readings.map((item) => Number(item[props.field])).filter(Number.isFinite))
const range = computed(() => {
  if (!values.value.length) return { min: 0, max: 1 }
  const all = props.reference == null ? values.value : [...values.value, props.reference]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const padding = Math.max((max - min) * 0.18, 1)
  return { min: min - padding, max: max + padding }
})
const points = computed(() => values.value.map((value, index) => {
  const x = values.value.length === 1 ? 50 : (index / (values.value.length - 1)) * 100
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
    <svg class="spark-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" :aria-label="`Tendencia de ${title}`">
      <defs>
        <linearGradient :id="`fill-${field}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity=".28" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line v-if="referenceY != null" x1="0" x2="100" :y1="referenceY" :y2="referenceY" class="reference-line" />
      <polygon v-if="points" :points="`${points} 100,100 0,100`" :fill="`url(#fill-${field})`" />
      <polyline v-if="points" :points="points" fill="none" :stroke="color" stroke-width="2.4" vector-effect="non-scaling-stroke" />
    </svg>
    <div class="chart-scale"><span>{{ range.min.toFixed(0) }}</span><span>Últimas {{ values.length }} lecturas</span><span>{{ range.max.toFixed(0) }}</span></div>
  </article>
</template>
