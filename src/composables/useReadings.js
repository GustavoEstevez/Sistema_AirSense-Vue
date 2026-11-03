import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase'

const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true'

function makeDemoReadings() {
  const now = Date.now()
  return Array.from({ length: 24 }, (_, index) => ({
    id: `demo-${index}`,
    temperature: 22 + Math.sin(index / 3) * 2.2,
    humidity: 52 + Math.cos(index / 4) * 7,
    noise: 43 + Math.sin(index / 2) * 8,
    co2: 690 + Math.cos(index / 3) * 130,
    recorded_at: new Date(now - (23 - index) * 5000).toISOString(),
  }))
}

export function useReadings() {
  const readings = ref(demoEnabled ? makeDemoReadings() : [])
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
    try {
      const { data, error: queryError } = await supabase
        .from('sensor_readings')
        .select('id, temperature, humidity, noise, co2, recorded_at')
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
    channel = supabase
      .channel('airsense-readings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        ({ new: reading }) => {
          readings.value = [...readings.value.slice(-59), reading]
          error.value = ''
        },
      )
      .subscribe((status) => { realtimeConnected.value = status === 'SUBSCRIBED' })
  }

  onMounted(async () => {
    await load()
    subscribe()
  })
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
