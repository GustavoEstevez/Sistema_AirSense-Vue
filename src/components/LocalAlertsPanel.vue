<script setup>
import { onMounted, toRef, watch } from 'vue'
import { useLocalAlerts } from '../composables/useLocalAlerts'

const props = defineProps({
  deviceId: { type: String, default: '' },
  deviceName: { type: String, default: '' },
})
const alerts = useLocalAlerts(toRef(props, 'deviceId'))
onMounted(() => alerts.refreshSmartThresholds(false))
watch(() => props.deviceId, () => alerts.refreshSmartThresholds(false))
</script>

<template>
  <article class="local-alert-panel panel">
    <div class="local-alert-heading">
      <div>
        <span class="section-kicker">ALERTAS DEL DISPOSITIVO</span>
        <h2>Umbrales y notificaciones locales</h2>
        <p>Configuración de <strong>{{ deviceName || deviceId || 'AirSense' }}</strong>. Se guarda solamente en este teléfono y no modifica sus mediciones.</p>
      </div>
      <span class="state-pill" :data-state="alerts.settings.enabled ? 'normal' : 'unknown'">
        {{ alerts.settings.enabled ? 'Activadas' : 'Desactivadas' }}
      </span>
    </div>

    <div class="local-threshold-grid">
      <fieldset>
        <legend>Temperatura crítica</legend>
        <label>Mínimo <input v-model.number="alerts.settings.temperatureMin" type="number" step="0.5" /> °C</label>
        <label>Máximo <input v-model.number="alerts.settings.temperatureMax" type="number" step="0.5" /> °C</label>
      </fieldset>
      <fieldset>
        <legend>Humedad crítica</legend>
        <label>Mínimo <input v-model.number="alerts.settings.humidityMin" type="number" step="1" /> %</label>
        <label>Máximo <input v-model.number="alerts.settings.humidityMax" type="number" step="1" /> %</label>
      </fieldset>
      <fieldset>
        <legend>Nivel sonoro crítico</legend>
        <label>Máximo <input v-model.number="alerts.settings.noiseMax" type="number" step="1" /> dB</label>
      </fieldset>
      <fieldset>
        <legend>Calidad del aire crítica</legend>
        <label>Máximo <input v-model.number="alerts.settings.co2Max" type="number" step="10" /> ppm</label>
      </fieldset>
    </div>

    <div class="smart-threshold-panel">
      <div>
        <strong>Umbrales inteligentes</strong>
        <p>Ajustan únicamente la tolerancia térmica según el clima exterior y la región. Los límites de seguridad permanecen entre 15 y 30 °C.</p>
        <small v-if="alerts.settings.smartWeatherLabel">
          {{ alerts.settings.smartWeatherLabel }} · rango aplicado {{ alerts.settings.smartTemperatureMin }}–{{ alerts.settings.smartTemperatureMax }} °C · Datos meteorológicos: WeatherAPI.com
        </small>
      </div>
      <div class="smart-threshold-actions">
        <button v-if="!alerts.settings.smartEnabled" type="button" class="button primary" @click="alerts.enableSmartThresholds">Activar</button>
        <template v-else>
          <button type="button" class="button secondary" @click="alerts.refreshSmartThresholds(true)">Actualizar con el clima</button>
          <button type="button" class="text-button" @click="alerts.disableSmartThresholds">Desactivar</button>
        </template>
      </div>
    </div>

    <div class="local-alert-actions">
      <button type="button" class="button secondary" @click="alerts.saveSettings">Guardar en el teléfono</button>
      <button v-if="!alerts.settings.enabled" type="button" class="button primary" @click="alerts.enableNotifications">Habilitar notificaciones</button>
      <button v-else type="button" class="button primary" @click="alerts.disableNotifications">Desactivar notificaciones</button>
      <button type="button" class="text-button" @click="alerts.sendTestNotification">Enviar prueba</button>
    </div>
    <small class="local-alert-feedback" role="status">{{ alerts.feedback }}</small>
    <p class="local-alert-limitation">
      En esta APK de prueba las alertas se generan localmente mientras el proceso de la aplicación está activo. Las alertas con la aplicación cerrada requerirán push desde el servidor en una etapa posterior.
    </p>
  </article>
</template>
