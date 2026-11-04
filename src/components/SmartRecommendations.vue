<script setup>
import { computed, ref } from 'vue'
import { recommendations } from '../lib/environment'
import { supabase } from '../lib/supabase'

const props = defineProps({ reading: { type: Object, default: null } })
const region = ref(localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina')
const aiTips = ref([])
const loading = ref(false)
const error = ref('')
const weather = ref(null)
const tips = computed(() => aiTips.value.length ? aiTips.value : recommendations(props.reading || {}))

async function refreshWithAi() {
  if (!props.reading || !supabase) return
  loading.value = true
  error.value = ''
  try {
    const { data, error: functionError } = await supabase.functions.invoke('environment-recommendations', {
      body: { mode: 'recommendations', reading: props.reading, region: region.value },
    })
    if (functionError) {
      let detail = ''
      try {
        const payload = await functionError.context?.json()
        detail = String(payload?.error || '')
      } catch { /* La respuesta puede no contener JSON. */ }
      throw new Error(detail || functionError.message)
    }
    if (!Array.isArray(data?.recommendations) || !data.recommendations.length) throw new Error('La IA no devolvió recomendaciones válidas.')
    aiTips.value = data.recommendations.slice(0, 4)
    weather.value = data.weather || null
  } catch (requestError) {
    error.value = `${requestError?.message || 'No pudimos actualizar con IA.'} Se mantienen las reglas locales.`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <article class="recommendations panel">
    <span class="section-kicker">ANÁLISIS DEL AMBIENTE</span>
    <h2>Acciones recomendadas</h2>
    <p class="recommendation-context">Según la lectura actual y la región configurada: <strong>{{ region }}</strong>.</p>
    <p v-if="weather" class="recommendation-weather">Exterior: {{ weather.temperatureC.toFixed(1) }} °C, sensación {{ weather.feelsLikeC.toFixed(1) }} °C · {{ weather.condition }}. <small>Datos meteorológicos: WeatherAPI.com</small></p>
    <ul>
      <li v-for="tip in tips" :key="tip"><b>→</b>{{ tip }}</li>
    </ul>
    <div class="ai-recommendation-actions">
      <button type="button" class="text-button" :disabled="loading || !reading" @click="refreshWithAi">
        {{ loading ? 'Analizando…' : 'Actualizar con IA' }}
      </button>
      <small v-if="error" role="status">{{ error }}</small>
    </div>
  </article>
</template>
