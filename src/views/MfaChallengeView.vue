<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const factorId = ref('')
const code = ref('')
const loading = ref(true)
const verifying = ref(false)
const error = ref('')

onMounted(async () => {
  const { data, error: listError } = await supabase.auth.mfa.listFactors()
  factorId.value = data?.totp?.find((item) => item.status === 'verified')?.id || ''
  if (listError || !factorId.value) error.value = 'No encontramos un segundo factor activo para esta cuenta.'
  loading.value = false
})

async function verify() {
  error.value = ''
  if (!/^\d{6}$/.test(code.value.trim())) {
    error.value = 'Ingresá el código de 6 dígitos de tu autenticador.'
    return
  }
  verifying.value = true
  try {
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.value, code: code.value.trim() })
    if (verifyError) throw verifyError
    await router.replace(String(route.query.redirect || '/dashboard/'))
  } catch {
    error.value = 'El código no es válido o venció. Usá el código actual del autenticador.'
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <div class="auth-page page-grid-bg">
    <section class="auth-card panel">
      <span class="auth-brand">Air<span>Sense</span>™</span>
      <span class="section-kicker">VERIFICACIÓN DE SEGURIDAD</span>
      <h1>Código de autenticación</h1>
      <p class="auth-lead">Abrí tu aplicación autenticadora e ingresá el código temporal para completar el inicio de sesión.</p>
      <form class="auth-form" @submit.prevent="verify">
        <div class="form-group">
          <label for="challenge-code">Código de 6 dígitos</label>
          <input id="challenge-code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" :disabled="loading" autofocus />
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="button primary auth-submit" :disabled="loading || verifying || !factorId">{{ verifying ? 'Verificando…' : 'Verificar' }}</button>
      </form>
    </section>
  </div>
</template>
