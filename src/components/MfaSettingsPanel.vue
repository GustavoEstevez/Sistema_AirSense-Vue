<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'

const loading = ref(true)
const factor = ref(null)
const enrollment = ref(null)
const code = ref('')
const message = ref('')
const error = ref('')

async function loadFactors() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: listError } = await supabase.auth.mfa.listFactors()
    if (listError) throw listError
    factor.value = data.totp.find((item) => item.status === 'verified') || null
  } catch (loadError) {
    error.value = loadError?.message || 'No se pudo consultar la autenticación en dos pasos.'
  } finally {
    loading.value = false
  }
}

async function startEnrollment() {
  error.value = ''; message.value = ''
  try {
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'AirSense Authenticator',
    })
    if (enrollError) throw enrollError
    enrollment.value = data
  } catch (enrollError) {
    error.value = enrollError?.message || 'No se pudo iniciar la configuración de 2FA.'
  }
}

async function verifyEnrollment() {
  error.value = ''; message.value = ''
  if (!/^\d{6}$/.test(code.value.trim())) {
    error.value = 'Ingresá el código de 6 dígitos de tu aplicación autenticadora.'
    return
  }
  try {
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.value.id,
      code: code.value.trim(),
    })
    if (verifyError) throw verifyError
    enrollment.value = null
    code.value = ''
    message.value = 'Autenticación en dos pasos activada correctamente.'
    await loadFactors()
  } catch (verifyError) {
    error.value = 'El código no es válido o venció. Probá con el código nuevo del autenticador.'
  }
}

async function cancelEnrollment() {
  if (enrollment.value?.id) await supabase.auth.mfa.unenroll({ factorId: enrollment.value.id }).catch(() => {})
  enrollment.value = null
  code.value = ''
}

async function disableMfa() {
  error.value = ''; message.value = ''
  try {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.value.id })
    if (unenrollError) throw unenrollError
    message.value = 'Autenticación en dos pasos desactivada.'
    await supabase.auth.refreshSession()
    await loadFactors()
  } catch (unenrollError) {
    error.value = unenrollError?.message || 'No se pudo desactivar 2FA.'
  }
}

onMounted(loadFactors)
</script>

<template>
  <article class="panel mobile-settings-card mfa-card">
    <span class="section-kicker">SEGURIDAD</span>
    <h2>Autenticación en dos pasos</h2>
    <p>Protegé tu cuenta con un código temporal de Google Authenticator, Microsoft Authenticator, Authy o una aplicación compatible.</p>

    <p v-if="loading" class="settings-inline-status">Consultando seguridad…</p>
    <template v-else-if="factor">
      <div class="mfa-enabled"><span>✓</span><div><strong>2FA activado</strong><small>Se pedirá un código después de ingresar la contraseña.</small></div></div>
      <button type="button" class="button secondary" @click="disableMfa">Desactivar 2FA</button>
    </template>
    <template v-else-if="enrollment">
      <div class="mfa-enrollment">
        <p>Escaneá este QR con tu aplicación autenticadora:</p>
        <img :src="enrollment.totp.qr_code" alt="Código QR para configurar 2FA" />
        <details><summary>No puedo escanear el QR</summary><code>{{ enrollment.totp.secret }}</code></details>
        <label for="mfa-code">Código de 6 dígitos</label>
        <input id="mfa-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" />
        <div class="mfa-actions">
          <button type="button" class="button primary" @click="verifyEnrollment">Activar y verificar</button>
          <button type="button" class="text-button" @click="cancelEnrollment">Cancelar</button>
        </div>
      </div>
    </template>
    <button v-else type="button" class="button primary" @click="startEnrollment">Configurar 2FA</button>

    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <p v-if="message" class="form-notice" role="status">{{ message }}</p>
  </article>
</template>
