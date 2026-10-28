<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { validateName, validatePassword } from '../lib/authValidation'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const busy = ref(false)
const error = ref('')
const notice = ref('')
const forgotMode = ref(false)
const form = reactive({ firstName: '', lastName: '', email: '', password: '', confirm: '' })

const mode = computed(() => route.name === 'registro' ? 'register' : route.name === 'recuperar' ? 'recovery' : 'login')
const title = computed(() => mode.value === 'register' ? 'Crear una cuenta' : mode.value === 'recovery' ? 'Elegí una nueva contraseña' : forgotMode.value ? 'Recuperar acceso' : 'Ingresar a AirSense')

watch(() => route.name, () => {
  error.value = ''
  notice.value = ''
  forgotMode.value = false
})

async function submit() {
  error.value = ''
  notice.value = ''
  if (!auth.configured) {
    error.value = 'Supabase todavía no está configurado en este entorno.'
    return
  }
  if (mode.value === 'register') {
    if (!validateName(form.firstName) || !validateName(form.lastName)) {
      error.value = 'Ingresá un nombre y apellido válidos.'
      return
    }
    const passwordError = validatePassword(form.password)
    if (passwordError) { error.value = passwordError; return }
    if (form.password !== form.confirm) { error.value = 'Las contraseñas no coinciden.'; return }
  }
  if (mode.value === 'recovery') {
    const passwordError = validatePassword(form.password)
    if (passwordError) { error.value = passwordError; return }
    if (form.password !== form.confirm) { error.value = 'Las contraseñas no coinciden.'; return }
  }

  busy.value = true
  try {
    if (mode.value === 'register') {
      const data = await auth.signUp(form)
      if (data.session) await router.replace('/panel/')
      else notice.value = 'Cuenta creada. Revisá tu correo para confirmar el registro antes de ingresar.'
    } else if (mode.value === 'recovery') {
      await auth.updatePassword(form.password)
      notice.value = 'Contraseña actualizada correctamente.'
      window.setTimeout(() => router.replace('/panel/'), 900)
    } else if (forgotMode.value) {
      await auth.requestPasswordReset(form.email)
      notice.value = 'Si existe una cuenta con ese correo, vas a recibir un enlace para recuperar el acceso.'
    } else {
      await auth.signIn(form.email, form.password)
      await router.replace(String(route.query.redirect || '/panel/'))
    }
  } catch (submitError) {
    error.value = submitError?.message || 'No pudimos completar la operación.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-page page-grid-bg">
    <section class="auth-card panel">
      <RouterLink to="/" class="auth-brand">Air<span>Sense</span>™</RouterLink>
      <span class="section-kicker">ACCESO SEGURO</span>
      <h1>{{ title }}</h1>
      <p class="auth-lead">
        {{ mode === 'register' ? 'Registrate para acceder a la telemetría y las funciones habilitadas.' : mode === 'recovery' ? 'El enlace temporal validó tu identidad. Definí una contraseña segura.' : forgotMode ? 'Te enviaremos un enlace temporal sin revelar si la cuenta existe.' : 'Accedé con tu correo electrónico y contraseña.' }}
      </p>

      <form class="auth-form" @submit.prevent="submit">
        <div v-if="mode === 'register'" class="form-row">
          <div class="form-group"><label for="auth-first">Nombre</label><input id="auth-first" v-model.trim="form.firstName" required autocomplete="given-name" /></div>
          <div class="form-group"><label for="auth-last">Apellido</label><input id="auth-last" v-model.trim="form.lastName" required autocomplete="family-name" /></div>
        </div>

        <div v-if="mode !== 'recovery'" class="form-group">
          <label for="auth-email">Correo electrónico</label>
          <input id="auth-email" v-model.trim="form.email" type="email" required autocomplete="email" placeholder="nombre@empresa.com" />
        </div>

        <div v-if="!forgotMode" class="form-group">
          <label for="auth-password">{{ mode === 'recovery' ? 'Nueva contraseña' : 'Contraseña' }}</label>
          <input id="auth-password" v-model="form.password" type="password" required :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" minlength="10" />
          <small v-if="mode !== 'login'">Mínimo 10 caracteres, con mayúscula, minúscula y número.</small>
        </div>

        <div v-if="mode === 'register' || mode === 'recovery'" class="form-group">
          <label for="auth-confirm">Confirmar contraseña</label>
          <input id="auth-confirm" v-model="form.confirm" type="password" required autocomplete="new-password" minlength="10" />
        </div>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="notice" class="form-notice" role="status">{{ notice }}</p>

        <button type="submit" class="button primary auth-submit" :disabled="busy">
          {{ busy ? 'Procesando…' : mode === 'register' ? 'Crear cuenta' : mode === 'recovery' ? 'Guardar contraseña' : forgotMode ? 'Enviar enlace seguro' : 'Iniciar sesión' }}
        </button>
      </form>

      <div v-if="mode === 'login'" class="auth-links">
        <button type="button" @click="forgotMode = !forgotMode">{{ forgotMode ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?' }}</button>
        <RouterLink to="/cuenta/registro/">Crear una cuenta</RouterLink>
      </div>
      <div v-else-if="mode === 'register'" class="auth-links single"><RouterLink to="/cuenta/ingresar/">Ya tengo una cuenta</RouterLink></div>
    </section>
  </div>
</template>
