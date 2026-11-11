import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase'

import { isFreshReading, mergeReadings } from '../lib/dashboardPresentation'

const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true'

function makeDemoReadings(deviceId = 'airsense-demo') {
  const now = Date.now()
  return Array.from({ length: 24 }, (_, index) => ({
    id: `demo-${index}`,
    temperature: 22 + Math.sin(index / 3) * 2.2,
    humidity: 52 + Math.cos(index / 4) * 7,
    noise: 43 + Math.sin(index / 2) * 8,
    co2: 690 + Math.cos(index / 3) * 130,
    device_id: deviceId,
    recorded_at: new Date(now - (23 - index) * 5000).toISOString(),
  }))
}

export function useReadings(deviceId) {
  const readings = ref(demoEnabled ? makeDemoReadings(unref(deviceId)) : [])
  const loading = ref(supabaseConfigured)
  const error = ref('')
  const realtimeConnected = ref(false)
  let channel
  let generation = 0
  let request = 0
  let disposed = false
  const clock = ref(Date.now())
  let timer
  const latest = computed(() => readings.value.at(-1) ?? null)
  const stationOnline = computed(() => demoEnabled || isFreshReading(latest.value, clock.value))

  async function load() {
    const selectedId = unref(deviceId)
    const context = generation
    const pending = ++request
    const current = () => !disposed && context === generation && pending === request && selectedId === unref(deviceId)
    if (!supabase || !selectedId || demoEnabled) {
      loading.value = false
      return
    }
    loading.value = true
    error.value = ''
    try {
      const { data, error: queryError } = await supabase
        .from('sensor_readings')
        .select('id, device_id, temperature, humidity, noise, co2, recorded_at')
        .eq('device_id', selectedId)
        .order('recorded_at', { ascending: false })
        .limit(60)
      if (!current()) return
      if (queryError) throw queryError
      readings.value = mergeReadings(data ?? [], readings.value, selectedId)
    } catch (loadError) {
      if (current()) error.value = loadError?.message || 'No se pudieron recuperar las lecturas.'
    } finally {
      if (current()) loading.value = false
    }
  }

  watch(() => unref(deviceId), (selectedId) => {
    const context = ++generation
    ++request
    const previous = channel
    channel = undefined
    if (previous && supabase) void supabase.removeChannel(previous)
    readings.value = []
    error.value = ''
    loading.value = false
    realtimeConnected.value = false
    if (demoEnabled) {
      readings.value = makeDemoReadings(selectedId || 'airsense-demo')
      return
    }
    if (!supabase || !selectedId) return
    const current = () => !disposed && context === generation && selectedId === unref(deviceId)
    channel = supabase
      .channel(`airsense-readings-${selectedId}-${crypto.randomUUID()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings', filter: `device_id=eq.${selectedId}` },
        ({ new: reading }) => {
          if (!current()) return
          readings.value = mergeReadings(readings.value, [reading], selectedId)
        })
      .subscribe((status) => {
        if (!current()) return
        realtimeConnected.value = status === 'SUBSCRIBED'
        // Refresh the snapshot on each successful subscription, including reconnects.
        if (status === 'SUBSCRIBED') void load()
      })
    void load()
  }, { immediate: true, flush: 'sync' })

  function reconnect() { void load() }
  onMounted(() => {
    timer = window.setInterval(() => { clock.value = Date.now() }, 5000)
    window.addEventListener('online', reconnect)
  })
  onBeforeUnmount(() => {
    disposed = true
    ++generation
    ++request
    clearInterval(timer)
    window.removeEventListener('online', reconnect)
    if (channel && supabase) void supabase.removeChannel(channel)
  })

  return {
    readings,
    latest,
    loading,
    error,
    configured: supabaseConfigured,
    demoEnabled,
    realtimeConnected,
    stationOnline,
    reload: load,
  }
}
