<script setup>
import { isFreshReading } from '../lib/dashboardPresentation'
const props = defineProps({
  devices: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
  loading: Boolean,
  now: { type: Number, default: () => Date.now() },
})
const emit = defineEmits(['select'])

function name(device, index) {
  return device.display_name || `AirSense ${index + 1}`
}

function online(device) {
  if (!device.last_seen_at) return false
  return isFreshReading({ recorded_at: device.last_seen_at }, props.now)
}
</script>

<template>
  <section class="device-switcher" aria-label="Dispositivos AirSense">
    <div class="device-switcher-heading">
      <div>
        <span class="section-kicker">MIS ESTACIONES</span>
        <h2>{{ devices.length > 1 ? `${devices.length} estaciones disponibles` : 'Tu dispositivo AirSense' }}</h2>
      </div>
      <RouterLink to="/configuracion/" class="device-settings-link" aria-label="Administrar dispositivos">Administrar</RouterLink>
    </div>
    <div v-if="loading" class="device-chip-list" aria-busy="true">
      <span class="device-chip skeleton-chip"></span>
    </div>
    <div v-else-if="devices.length" class="device-chip-list">
      <button
        v-for="(device, index) in devices"
        :key="device.id"
        type="button"
        class="device-chip"
        :class="{ selected: device.id === selectedId }"
        :aria-pressed="device.id === selectedId"
        @click="emit('select', device.id)"
      >
        <span class="device-chip-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6"/><circle cx="12" cy="17" r="1"/></svg>
        </span>
        <span><strong>{{ name(device, index) }}</strong><small>{{ device.id }}</small></span>
        <i :class="{ online: online(device) }"></i>
      </button>
    </div>
    <div v-else class="empty-device-state">
      <p>Todavía no hay un AirSense asociado a esta cuenta.</p>
      <RouterLink to="/configuracion/">Agregar dispositivo</RouterLink>
    </div>
  </section>
</template>
