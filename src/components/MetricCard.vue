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
      <div class="metric-icon" aria-hidden="true">
        <svg v-if="icon === 'temperature'" viewBox="0 0 24 24">
          <path d="M10 14.76V5a2 2 0 1 1 4 0v9.76a4.5 4.5 0 1 1-4 0Z" />
          <path d="M12 7v9" />
        </svg>
        <svg v-else-if="icon === 'humidity'" viewBox="0 0 24 24">
          <path d="M12 3.2S6.5 9.32 6.5 14a5.5 5.5 0 0 0 11 0C17.5 9.32 12 3.2 12 3.2Z" />
          <path d="M9.2 14.5a3 3 0 0 0 3 2.8" />
        </svg>
        <svg v-else-if="icon === 'noise'" viewBox="0 0 24 24">
          <path d="M5 10v4h3l4 3V7L8 10H5Z" />
          <path d="M15 9.2a4 4 0 0 1 0 5.6M17.7 6.8a7.4 7.4 0 0 1 0 10.4" />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path d="M4 8.2h10.5a2.5 2.5 0 1 0-2.2-3.7M4 12h14a2 2 0 1 1-1.8 2.9M4 15.8h7.8a2.5 2.5 0 1 1-2.2 3.7" />
        </svg>
      </div>
      <div><h3>{{ title }}</h3><p>{{ sensor }}</p></div>
    </div>
    <div class="metric-number">
      <Transition name="metric-value" mode="out-in">
        <strong :key="value">{{ value ?? '—' }}</strong>
      </Transition><span>{{ unit }}</span>
      <small v-if="Number.isFinite(trend)" :class="trend > 0 ? 'up' : trend < 0 ? 'down' : ''">
        {{ trend > 0 ? '↗' : trend < 0 ? '↘' : '→' }} {{ Math.abs(trend).toFixed(1) }}
      </small>
    </div>
    <span class="state-pill" :data-state="state.level">{{ state.label }}</span>
  </article>
</template>
