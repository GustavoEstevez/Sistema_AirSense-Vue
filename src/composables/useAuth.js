import { computed, ref } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { validatePassword } from '../lib/authValidation'

const user = ref(null)
const profile = ref(null)
const loading = ref(true)
let initialized = false
let initialization
let subscription

function authMessage(error) {
  const message = String(error?.message || '').toLowerCase()
  if (message.includes('invalid login')) return 'No pudimos iniciar sesión con esos datos.'
  if (message.includes('email not confirmed')) return 'Confirmá tu correo electrónico antes de ingresar.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'No pudimos crear la cuenta con esos datos.'
  if (message.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos y volvé a probar.'
  if (message.includes('password')) return 'La contraseña no cumple los requisitos de seguridad.'
  return error?.message || 'No pudimos completar la operación.'
}

async function loadProfile() {
  if (!supabase || !user.value) {
    profile.value = null
    return null
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role_slug, status, created_at, updated_at, last_login_at')
    .eq('id', user.value.id)
    .single()
  if (error) throw error
  profile.value = data
  return data
}

export function initializeAuth() {
  if (initialization) return initialization
  initialization = (async () => {
    if (!supabase) {
      loading.value = false
      initialized = true
      return
    }
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) {
      try {
        const current = await loadProfile()
        if (current?.status !== 'active') await supabase.auth.signOut()
      } catch {
        profile.value = null
      }
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      if (!user.value) profile.value = null
      window.setTimeout(() => loadProfile().catch(() => { profile.value = null }), 0)
    })
    subscription = listener.subscription
    initialized = true
    loading.value = false
  })()
  return initialization
}

export function useAuth() {
  if (!initialized) initializeAuth()

  async function signUp({ firstName, lastName, email, password }) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const passwordError = validatePassword(password)
    if (passwordError) throw new Error(passwordError)
    const redirectTo = `${window.location.origin}/cuenta/ingresar/`
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: redirectTo, data: { first_name: firstName.trim(), last_name: lastName.trim() } },
    })
    if (error) throw new Error(authMessage(error))
    return data
  }

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) throw new Error(authMessage(error))
    user.value = data.user
    const current = await loadProfile()
    if (!current || current.status !== 'active') {
      await supabase.auth.signOut()
      throw new Error('La cuenta no está habilitada. Contactá a un administrador.')
    }
    return data
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  async function requestPasswordReset(email) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const redirectTo = `${window.location.origin}/cuenta/recuperar/`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
    if (error && !String(error.message).toLowerCase().includes('rate limit')) return
    if (error) throw new Error(authMessage(error))
  }

  async function updatePassword(password) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const passwordError = validatePassword(password)
    if (passwordError) throw new Error(passwordError)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(authMessage(error))
  }

  async function updateProfile(firstName, lastName) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { data, error } = await supabase.rpc('update_own_profile', {
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
    })
    if (error) throw error
    profile.value = data
    return data
  }

  async function updateEmail(email) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { error } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() })
    if (error) throw new Error(authMessage(error))
  }

  return {
    configured: supabaseConfigured,
    user,
    profile,
    loading,
    isAuthenticated: computed(() => Boolean(user.value && profile.value?.status === 'active')),
    isAdmin: computed(() => profile.value?.role_slug === 'admin' && profile.value?.status === 'active'),
    initialize: initializeAuth,
    refreshProfile: loadProfile,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    updateEmail,
    dispose: () => subscription?.unsubscribe(),
  }
}
