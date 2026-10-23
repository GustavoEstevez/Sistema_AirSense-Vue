<script setup>
defineProps({
  title: String,
  sensor: String,
  value: [String, Number],
  unit: String,
  state: { type: Object, required: true },
  icon: String,
  accent: String,
  trend: Number,
})
</script>

<template>
  <article class="metric-card panel" :style="{ '--accent': accent }">
    <div class="metric-heading">
      <div class="metric-icon" aria-hidden="true">{{ icon }}</div>
      <div><h3>{{ title }}</h3><p>{{ sensor }}</p></div>
    </div>
    <div class="metric-number">
      <strong>{{ value ?? '—' }}</strong><span>{{ unit }}</span>
      <small v-if="Number.isFinite(trend)" :class="trend > 0 ? 'up' : trend < 0 ? 'down' : ''">
        {{ trend > 0 ? '↗' : trend < 0 ? '↘' : '→' }} {{ Math.abs(trend).toFixed(1) }}
      </small>
    </div>
    <span class="state-pill" :data-state="state.level">{{ state.label }}</span>
  </article>
</template>
