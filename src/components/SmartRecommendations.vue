<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { recommendations } from '../lib/environment'
import { isFreshReading } from '../lib/dashboardPresentation'
import { edgeFunctionErrorMessage } from '../lib/edgeFunctionError'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/supabase'

const props = defineProps({ reading: { type: Object, default: null }, fresh: Boolean, demo: Boolean, now: { type: Number, default: () => Date.now() } })
const auth = useAuth()
let request = 0
const analyzedAt = ref('')
const analyzedReading = ref(null)
const canAnalyze = computed(() => props.fresh && !props.demo && auth.isAuthenticated.value && Boolean(supabase && props.reading))
const region = ref(localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina')
const aiTips = ref([])
const loading = ref(false)
const error = ref('')
const weather = ref(null)
const tips = computed(() => !props.fresh && props.reading ? ['Esperá una lectura reciente antes de interpretar el estado actual del ambiente.'] : aiTips.value.length ? aiTips.value : recommendations(props.reading || {}))
watch([() => props.reading?.device_id, () => props.fresh], () => {
  ++request
  aiTips.value = []
  weather.value = null
  analyzedAt.value = ''
  analyzedReading.value = null
  error.value = ''
  loading.value = false
}, { flush: 'sync' })
watch(() => props.now, () => {
  if (analyzedReading.value && !isFreshReading(analyzedReading.value, props.now)) {
    aiTips.value = []
    weather.value = null
    analyzedAt.value = ''
    analyzedReading.value = null
  }
})
onBeforeUnmount(() => { ++request })

async function refreshWithAi() {
  if (!canAnalyze.value || !isFreshReading(props.reading)) return
  const pending = ++request
  const reading = { ...props.reading }
  region.value = localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina'
  loading.value = true
  error.value = ''
  try {
    const { data, error: functionError } = await supabase.functions.invoke('environment-recommendations', {
      body: { mode: 'recommendations', reading, region: region.value },
    })
    if (pending !== request) return
    if (functionError) throw new Error(await edgeFunctionErrorMessage(functionError, 'No pudimos conectar con el servicio de análisis. Intentá nuevamente.'))
    if (!Array.isArray(data?.recommendations) || !data.recommendations.length) throw new Error('La IA no devolvió recomendaciones válidas.')
    if (pending !== request || !isFreshReading(reading)) return
    aiTips.value = data.recommendations.filter(tip => typeof tip === 'string' && tip.trim()).slice(0, 4)
    analyzedReading.value = reading
    analyzedAt.value = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(reading.recorded_at))
    weather.value = data.weather || null
  } catch (requestError) {
    if (pending === request) error.value = `${requestError?.message || 'No pudimos actualizar con IA.'} Se mantienen las reglas locales.`
  } finally {
    if (pending === request) loading.value = false
  }
}
</script>

<template>
  <article class="recommendations panel">
    <span class="section-kicker">ANÁLISIS DEL AMBIENTE</span>
    <h2>Entendé tu ambiente.</h2>
    <p class="recommendation-context">Orientaciones para tu estación y la región configurada: <strong>{{ region }}</strong>.</p>
    <p v-if="weather && Number.isFinite(weather.temperatureC) && Number.isFinite(weather.feelsLikeC)" class="recommendation-weather">Exterior: {{ weather.temperatureC.toFixed(1) }} °C, sensación {{ weather.feelsLikeC.toFixed(1) }} °C · {{ weather.condition }}. <small>Datos meteorológicos: WeatherAPI.com</small></p>
    <ul>
      <li v-for="tip in tips" :key="tip"><b>→</b>{{ tip }}</li>
    </ul>
    <p class="recommendation-source">{{ aiTips.length ? 'Análisis generado con IA. Revisalo junto con las mediciones de tu estación.' : 'Orientaciones automáticas según las lecturas disponibles. No constituyen una evaluación de salubridad.' }}</p>
    <p v-if="analyzedAt" class="recommendation-source">Lectura analizada: {{ analyzedAt }}.</p>
    <div class="ai-recommendation-actions">
      <button type="button" class="text-button" :disabled="loading || !canAnalyze" @click="refreshWithAi">
        {{ loading ? 'Analizando…' : 'Actualizar con IA' }}
      </button>
      <small v-if="!auth.isAuthenticated.value">Iniciá sesión para solicitar un análisis con IA.</small>
      <small v-else-if="demo">El análisis con IA no está disponible para datos de demostración.</small>
      <small v-if="error" role="status">{{ error }}</small>
    </div>
  </article>
</template>
