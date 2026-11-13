<script setup>
import { computed, toRef } from 'vue'
import { useSampledBattery } from '../composables/useSampledBattery'

const props = defineProps({ device: { type: Object, default: null }, connection: { type: Object, default: () => ({ key: 'waiting', label: 'Esperando datos' }) } })
const sampledBattery = useSampledBattery(toRef(props, 'device'))

const signal = computed(() => {
  if (props.device?.wifi_rssi == null) return { label: 'Pendiente', bars: 0 }
  const rssi = Number(props.device?.wifi_rssi)
  if (!Number.isFinite(rssi)) return { label: 'Pendiente', bars: 0 }
  if (rssi >= -55) return { label: 'Excelente', bars: 4 }
  if (rssi >= -67) return { label: 'Buena', bars: 3 }
  if (rssi >= -75) return { label: 'Regular', bars: 2 }
  return { label: 'Débil', bars: 1 }
})

const uptime = computed(() => {
  if (props.device?.uptime_seconds == null) return 'Pendiente'
  const seconds = Number(props.device?.uptime_seconds)
  if (!Number.isFinite(seconds)) return 'Pendiente'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days) return `${days} d ${hours} h`
  if (hours) return `${hours} h ${minutes} min`
  return `${minutes} min`
})

const battery = computed(() => {
  const value = Number(sampledBattery.value)
  return sampledBattery.value != null && Number.isFinite(value) ? `${Math.round(value)} %` : 'Dato no disponible'
})
</script>

<template>
  <article class="technical-status panel">
    <div class="technical-status-heading">
      <div><span class="section-kicker">TU DISPOSITIVO</span><h2>Estado de la estación</h2></div>
      <span class="technical-live-pill" :data-connection="connection.key">{{ connection.label }}</span>
    </div>
    <div class="technical-status-grid">
      <div class="technical-item">
        <span class="technical-icon wifi-bars" :data-bars="signal.bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span><small>Señal Wi-Fi</small><strong>{{ signal.label }}</strong><em v-if="device?.wifi_rssi != null">{{ device.wifi_rssi }} dBm</em></span>
      </div>
      <div class="technical-item">
        <span class="technical-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></span>
        <span><small>Tiempo encendido</small><strong>{{ uptime }}</strong></span>
      </div>
      <div class="technical-item">
        <span class="technical-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg></span>
        <span><small>Firmware</small><strong>{{ device?.firmware_version || 'Pendiente' }}</strong></span>
      </div>
      <div class="technical-item">
        <span class="technical-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="17" height="10" rx="2"/><path d="M20 10h2v4h-2M7 10v4"/></svg></span>
        <span><small>Batería</small><strong>{{ battery }}</strong></span>
      </div>
    </div>
    <p v-if="!device?.firmware_version" class="technical-status-note">La información técnica aparecerá cuando esté disponible en tu estación.</p>
  </article>
</template>
