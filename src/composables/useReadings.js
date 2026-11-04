import { computed, onBeforeUnmount, ref, unref, watch } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase'

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

  const latest = computed(() => readings.value.at(-1) ?? null)
  const stationOnline = computed(() => {
    if (demoEnabled) return true
    if (!latest.value) return false
    const timestamp = new Date(latest.value.recorded_at).getTime()
    return Date.now() - timestamp < 30_000
  })

  async function load() {
    if (!supabase) {
      loading.value = false
      return
    }
    loading.value = true
    error.value = ''
    const selectedId = unref(deviceId)
    if (!selectedId) {
      readings.value = []
      loading.value = false
      return
    }
    try {
      const { data, error: queryError } = await supabase
        .from('sensor_readings')
        .select('id, device_id, temperature, humidity, noise, co2, recorded_at')
        .eq('device_id', selectedId)
        .order('recorded_at', { ascending: false })
        .limit(60)
      if (queryError) throw queryError
      readings.value = [...(data ?? [])].reverse()
    } catch (loadError) {
      error.value = loadError?.message || 'No se pudieron recuperar las lecturas.'
    } finally {
      loading.value = false
    }
  }

  function subscribe() {
    if (!supabase) return
    const selectedId = unref(deviceId)
    if (!selectedId) return
    channel = supabase
      .channel(`airsense-readings-${selectedId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings', filter: `device_id=eq.${selectedId}` },
        ({ new: reading }) => {
          readings.value = [...readings.value.slice(-59), reading]
          error.value = ''
        },
      )
      .subscribe((status) => { realtimeConnected.value = status === 'SUBSCRIBED' })
  }

  watch(() => unref(deviceId), async (next, previous) => {
    if (demoEnabled) {
      readings.value = makeDemoReadings(next || 'airsense-demo')
      loading.value = false
      return
    }
    if (next === previous && channel) return
    if (channel && supabase) await supabase.removeChannel(channel)
    channel = undefined
    readings.value = []
    realtimeConnected.value = false
    await load()
    subscribe()
  }, { immediate: true })
  onBeforeUnmount(() => {
    if (channel && supabase) supabase.removeChannel(channel)
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
