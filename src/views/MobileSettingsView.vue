<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { openProvisioningPortal, openWifiSettings } from '../lib/deviceSetup'
import LocalAlertsPanel from '../components/LocalAlertsPanel.vue'
import MfaSettingsPanel from '../components/MfaSettingsPanel.vue'
import DeviceTechnicalStatus from '../components/DeviceTechnicalStatus.vue'
import { useDevices } from '../composables/useDevices'

const auth = useAuth()
const router = useRouter()
const busy = ref(false)
const message = ref('')
const error = ref('')
const emailForm = reactive({ email: auth.profile.value?.email || auth.user.value?.email || '' })
const region = ref(localStorage.getItem('airsense.installation-region') || 'Buenos Aires, Argentina')
const deviceManager = useDevices()
const deviceName = ref('')
const selectedDeviceName = computed(() => deviceManager.selectedDevice.value?.display_name || deviceManager.selectedDevice.value?.id || 'AirSense')

watch(deviceManager.selectedDevice, (device) => {
  deviceName.value = device?.display_name || ''
}, { immediate: true })

emailForm.email = auth.profile.value?.email || auth.user.value?.email || ''

async function changeEmail() {
  error.value = ''; message.value = ''; busy.value = true
  try {
    await auth.updateEmail(emailForm.email)
    message.value = 'Revisá el correo actual y el nuevo para confirmar el cambio de dirección.'
  } catch (updateError) {
    error.value = updateError?.message || 'No pudimos cambiar el correo.'
  } finally {
    busy.value = false
  }
}

function saveRegion() {
  const value = region.value.trim()
  if (!value) {
    error.value = 'Ingresá una ciudad, provincia o región.'
    return
  }
  localStorage.setItem('airsense.installation-region', value)
  message.value = 'Región guardada en este teléfono para contextualizar las recomendaciones.'
  error.value = ''
}

async function renameSelectedDevice() {
  error.value = ''; message.value = ''; busy.value = true
  try {
    await deviceManager.renameDevice(deviceManager.selectedDeviceId.value, deviceName.value)
    message.value = 'Nombre del dispositivo actualizado.'
  } catch (renameError) {
    error.value = renameError?.message || 'No pudimos cambiar el nombre del dispositivo.'
  } finally {
    busy.value = false
  }
}

async function sendPasswordEmail() {
  error.value = ''
  message.value = ''
  busy.value = true
  try {
    await auth.requestPasswordReset(auth.profile.value?.email || auth.user.value?.email || '')
    message.value = 'Te enviamos un correo con el enlace para elegir una contraseña nueva.'
  } catch (sendError) {
    error.value = sendError?.message || 'No pudimos enviar el correo de recuperación.'
  } finally {
    busy.value = false
  }
}

async function launchWifiSettings() {
  error.value = ''
  try {
    await openWifiSettings()
  } catch (setupError) {
    error.value = setupError?.message || 'No pudimos abrir la configuración Wi-Fi.'
  }
}

async function launchPortal() {
  error.value = ''
  try {
    await openProvisioningPortal()
  } catch (setupError) {
    error.value = setupError?.message || 'No pudimos abrir el asistente del dispositivo.'
  }
}

async function leave() {
  await auth.signOut()
  await router.replace('/cuenta/ingresar/')
}
</script>

<template>
  <div class="mobile-settings-page page-grid-bg">
    <section class="page-width mobile-settings-heading">
      <img src="/assets/Logos/LogoAirSense.png" alt="AirSense" />
      <div>
        <span class="section-kicker">CONFIGURACIÓN GENERAL</span>
        <h1>Mi AirSense</h1>
        <p>Usuario, seguridad, alertas y configuración de estaciones.</p>
      </div>
    </section>

    <section class="page-width mobile-settings-grid">
      <article class="panel mobile-settings-card">
        <span class="section-kicker">USUARIO</span>
        <h2>{{ auth.profile.value?.first_name }} {{ auth.profile.value?.last_name }}</h2>
        <p>{{ auth.profile.value?.email }}</p>
        <div class="mobile-profile-meta">
          <span>{{ auth.profile.value?.role_slug === 'admin' ? 'Administrador' : 'Usuario' }}</span>
          <span>{{ auth.profile.value?.status === 'active' ? 'Cuenta activa' : 'Cuenta inactiva' }}</span>
        </div>
      </article>

      <article class="panel mobile-settings-card device-manager-card">
        <span class="section-kicker">MIS DISPOSITIVOS</span>
        <h2>Administrar estaciones</h2>
        <p>Elegí qué AirSense querés configurar. Cada estación conserva su propio historial y sus propios umbrales en este teléfono.</p>
        <div v-if="deviceManager.devices.value.length" class="settings-device-list">
          <button
            v-for="(device, index) in deviceManager.devices.value"
            :key="device.id"
            type="button"
            :class="{ active: device.id === deviceManager.selectedDeviceId.value }"
            @click="deviceManager.selectDevice(device.id)"
          >
            <span><strong>{{ device.display_name || `AirSense ${index + 1}` }}</strong><small>{{ device.id }}</small></span>
            <i></i>
          </button>
        </div>
        <p v-else-if="deviceManager.loading.value">Buscando dispositivos asociados…</p>
        <p v-else>No hay estaciones asociadas a esta cuenta todavía.</p>
        <form v-if="deviceManager.selectedDevice.value" class="settings-compact-form device-name-form" @submit.prevent="renameSelectedDevice">
          <label for="device-name">Nombre visible</label>
          <input id="device-name" v-model.trim="deviceName" maxlength="120" placeholder="Ej.: Oficina principal" required />
          <button type="submit" class="button secondary" :disabled="busy">Guardar nombre</button>
        </form>
      </article>

      <DeviceTechnicalStatus v-if="deviceManager.selectedDevice.value" :device="deviceManager.selectedDevice.value" />

      <article class="panel mobile-settings-card">
        <span class="section-kicker">CORREO ELECTRÓNICO</span>
        <h2>Dirección de la cuenta</h2>
        <p>Al cambiarla, Supabase enviará las confirmaciones necesarias para proteger tu cuenta.</p>
        <form class="settings-compact-form" @submit.prevent="changeEmail">
          <label for="settings-email">Correo electrónico</label>
          <input id="settings-email" v-model.trim="emailForm.email" type="email" autocomplete="email" required />
          <button type="submit" class="button secondary" :disabled="busy">Actualizar correo</button>
        </form>
      </article>

      <article class="panel mobile-settings-card">
        <span class="section-kicker">CONTRASEÑA</span>
        <h2>Cambiar contraseña</h2>
        <p>Recibirás por correo un enlace seguro. Al abrirlo podrás definir una contraseña nueva en la página de AirSense.</p>
        <button type="button" class="button secondary" :disabled="busy" @click="sendPasswordEmail">
          {{ busy ? 'Enviando…' : 'Enviar correo de recuperación' }}
        </button>
      </article>

      <MfaSettingsPanel />

      <article class="panel mobile-settings-card">
        <span class="section-kicker">UBICACIÓN DEL DISPOSITIVO</span>
        <h2>Región de referencia</h2>
        <p>Se usa para adaptar las recomendaciones ambientales al clima y contexto local. No activa el GPS.</p>
        <form class="settings-compact-form" @submit.prevent="saveRegion">
          <label for="installation-region">Ciudad, provincia o región</label>
          <input id="installation-region" v-model.trim="region" placeholder="Buenos Aires, Argentina" />
          <button type="submit" class="button secondary">Guardar región</button>
        </form>
      </article>

      <LocalAlertsPanel
        :device-id="deviceManager.selectedDeviceId.value"
        :device-name="selectedDeviceName"
      />

      <article class="panel mobile-settings-card device-setup-card">
        <span class="section-kicker">DISPOSITIVOS</span>
        <h2>Agregar un dispositivo</h2>
        <p>AirSense te acompaña durante la conexión inicial sin que tengas que escribir ninguna dirección IP.</p>

        <ol class="device-setup-steps">
          <li><b>1</b><span>Encendé la estación. Si ya estaba configurada, mantené su botón presionado durante 3 segundos para reiniciar el Wi-Fi.</span></li>
          <li><b>2</b><span>Abrí el selector Wi-Fi y conectate a <code>ESP32-EstacionAmbiental</code> con la clave <code>12345678</code>.</span></li>
          <li><b>3</b><span>Volvé a AirSense y abrí el asistente. Elegí la red, ingresá su contraseña y asigná un ID único si es un segundo equipo (por ejemplo, <code>airsense-oficina-02</code>).</span></li>
        </ol>

        <div class="device-setup-actions">
          <button type="button" class="button secondary" @click="launchWifiSettings">1. Abrir redes Wi-Fi</button>
          <button type="button" class="button primary" @click="launchPortal">2. Configurar AirSense</button>
        </div>
        <small>El portal se abre dentro de la aplicación y sólo se comunica con la estación local.</small>
      </article>
    </section>

    <section class="page-width mobile-settings-feedback">
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-if="message" class="form-notice" role="status">{{ message }}</p>
      <button type="button" class="text-button danger" @click="leave">Cerrar sesión</button>
    </section>
  </div>
</template>
