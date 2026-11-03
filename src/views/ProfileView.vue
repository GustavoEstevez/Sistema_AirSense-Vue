<script setup>
import { reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { validatePassword } from '../lib/authValidation'

const router = useRouter()
const auth = useAuth()
const profileForm = reactive({ firstName: '', lastName: '', email: '' })
const passwordForm = reactive({ current: '', password: '', confirm: '' })
const saving = ref(false)
const message = ref('')
const error = ref('')

watchEffect(() => {
  if (!auth.profile.value) return
  profileForm.firstName = auth.profile.value.first_name
  profileForm.lastName = auth.profile.value.last_name
  profileForm.email = auth.profile.value.email
})

async function saveProfile() {
  saving.value = true; error.value = ''; message.value = ''
  try {
    await auth.updateProfile(profileForm.firstName, profileForm.lastName)
    if (profileForm.email.toLowerCase() !== auth.profile.value.email.toLowerCase()) {
      await auth.updateEmail(profileForm.email)
      message.value = 'Datos guardados. Revisá ambos correos para confirmar el cambio de dirección.'
    } else message.value = 'Perfil actualizado correctamente.'
  } catch (saveError) { error.value = saveError?.message || 'No pudimos actualizar el perfil.' }
  finally { saving.value = false }
}

async function changePassword() {
  error.value = ''; message.value = ''
  const validation = validatePassword(passwordForm.password)
  if (validation) { error.value = validation; return }
  if (passwordForm.password !== passwordForm.confirm) { error.value = 'Las contraseñas no coinciden.'; return }
  saving.value = true
  try {
    await auth.signIn(auth.profile.value.email, passwordForm.current)
    await auth.updatePassword(passwordForm.password)
    passwordForm.current = ''; passwordForm.password = ''; passwordForm.confirm = ''
    message.value = 'Contraseña actualizada correctamente.'
  } catch (changeError) { error.value = changeError?.message || 'No pudimos cambiar la contraseña.' }
  finally { saving.value = false }
}

async function leave() {
  await auth.signOut()
  await router.replace('/')
}
</script>

<template>
  <div class="account-page page-grid-bg">
    <section class="page-width account-heading">
      <span class="eyebrow"><i></i> CUENTA AIRSENSE</span>
      <h1>Mi perfil</h1>
      <p>Administrá tus datos personales y la seguridad de tu cuenta.</p>
    </section>
    <section class="page-width account-grid">
      <article class="panel account-panel">
        <span class="section-kicker">DATOS PERSONALES</span>
        <h2>Información de la cuenta</h2>
        <form class="auth-form" @submit.prevent="saveProfile">
          <div class="form-row">
            <div class="form-group"><label for="profile-first">Nombre</label><input id="profile-first" v-model.trim="profileForm.firstName" required /></div>
            <div class="form-group"><label for="profile-last">Apellido</label><input id="profile-last" v-model.trim="profileForm.lastName" required /></div>
          </div>
          <div class="form-group"><label for="profile-email">Correo electrónico</label><input id="profile-email" v-model.trim="profileForm.email" type="email" required /></div>
          <div class="account-meta"><span>Rol: <b>{{ auth.profile.value?.role_slug === 'admin' ? 'Administrador' : 'Usuario' }}</b></span><span>Estado: <b>{{ auth.profile.value?.status === 'active' ? 'Activo' : 'Inactivo' }}</b></span></div>
          <button class="button primary" :disabled="saving">Guardar cambios</button>
        </form>
      </article>

      <article class="panel account-panel">
        <span class="section-kicker">SEGURIDAD</span>
        <h2>Cambiar contraseña</h2>
        <form class="auth-form" @submit.prevent="changePassword">
          <div class="form-group"><label for="current-password">Contraseña actual</label><input id="current-password" v-model="passwordForm.current" type="password" required autocomplete="current-password" /></div>
          <div class="form-group"><label for="new-password">Nueva contraseña</label><input id="new-password" v-model="passwordForm.password" type="password" required autocomplete="new-password" minlength="10" /></div>
          <div class="form-group"><label for="confirm-password">Confirmar contraseña</label><input id="confirm-password" v-model="passwordForm.confirm" type="password" required autocomplete="new-password" minlength="10" /></div>
          <button class="button secondary" :disabled="saving">Actualizar contraseña</button>
        </form>
      </article>
    </section>
    <section class="page-width account-feedback">
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-if="message" class="form-notice" role="status">{{ message }}</p>
      <button type="button" class="text-button danger" @click="leave">Cerrar sesión</button>
    </section>
  </div>
</template>
