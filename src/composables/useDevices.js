import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase'

const STORAGE_KEY = 'airsense.selected-device.v1'
const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true'

function demoDevice() {
  return {
    id: 'airsense-demo',
    display_name: 'AirSense de demostración',
    wifi_rssi: -53,
    uptime_seconds: 18720,
    firmware_version: 'demo',
    battery_percent: null,
    last_seen_at: new Date().toISOString(),
  }
}

export function useDevices() {
  const devices = ref(demoEnabled ? [demoDevice()] : [])
  const selectedDeviceId = ref(localStorage.getItem(STORAGE_KEY) || '')
  const loading = ref(supabaseConfigured && !demoEnabled)
  const error = ref('')
  let channel

  const selectedDevice = computed(() => (
    devices.value.find((device) => device.id === selectedDeviceId.value) ?? devices.value[0] ?? null
  ))

  function normalizeSelection() {
    if (!devices.value.length) {
      selectedDeviceId.value = ''
      return
    }
    if (!devices.value.some((device) => device.id === selectedDeviceId.value)) {
      selectedDeviceId.value = devices.value[0].id
    }
    localStorage.setItem(STORAGE_KEY, selectedDeviceId.value)
  }

  function selectDevice(deviceId) {
    if (!devices.value.some((device) => device.id === deviceId)) return
    selectedDeviceId.value = deviceId
    localStorage.setItem(STORAGE_KEY, deviceId)
    if ('vibrate' in navigator) navigator.vibrate(12)
  }

  async function load() {
    if (demoEnabled || !supabase) {
      normalizeSelection()
      loading.value = false
      return
    }
    loading.value = true
    error.value = ''
    try {
      const { data, error: queryError } = await supabase
        .from('devices')
        .select('id, owner_id, display_name, wifi_rssi, uptime_seconds, firmware_version, battery_percent, last_seen_at, created_at, updated_at')
        .order('created_at', { ascending: true })
      if (queryError) throw queryError
      devices.value = data ?? []
      normalizeSelection()
    } catch (loadError) {
      error.value = loadError?.message || 'No se pudieron recuperar los dispositivos.'
    } finally {
      loading.value = false
    }
  }

  async function renameDevice(deviceId, displayName) {
    const name = String(displayName || '').trim()
    if (!name) throw new Error('Ingresá un nombre para el dispositivo.')
    const { data, error: renameError } = await supabase.rpc('update_owned_device_name', {
      p_device_id: deviceId,
      p_display_name: name,
    })
    if (renameError) throw renameError
    const updated = Array.isArray(data) ? data[0] : data
    if (updated) {
      devices.value = devices.value.map((device) => device.id === deviceId ? { ...device, ...updated } : device)
    } else {
      await load()
    }
  }

  function subscribe() {
    if (!supabase || demoEnabled) return
    channel = supabase
      .channel(`airsense-devices-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, ({ eventType, new: changed, old }) => {
        if (eventType === 'DELETE') {
          devices.value = devices.value.filter((device) => device.id !== old.id)
          normalizeSelection()
          return
        }
        const index = devices.value.findIndex((device) => device.id === changed.id)
        if (index === -1) devices.value = [...devices.value, changed]
        else devices.value = devices.value.map((device) => device.id === changed.id ? { ...device, ...changed } : device)
        normalizeSelection()
      })
      .subscribe()
  }

  onMounted(async () => {
    await load()
    subscribe()
  })
  onBeforeUnmount(() => {
    if (channel && supabase) supabase.removeChannel(channel)
  })

  return {
    devices,
    selectedDeviceId,
    selectedDevice,
    loading,
    error,
    selectDevice,
    renameDevice,
    reload: load,
  }
}
