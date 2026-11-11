<script setup>
import { computed, onMounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const router = useRouter()
const nativeApp = Capacitor.isNativePlatform()
const auth = useAuth()
const showNativeActions = computed(() => nativeApp && auth.isAuthenticated.value && !String(route.name || '').match(/ingresar|registro|recuperar|verificar-2fa/))

function updateTitle() {
  document.title = route.meta.title ? `AirSense - ${route.meta.title}` : 'AirSense'
}

onMounted(updateTitle)
watch(auth.isAuthenticated, (authenticated) => {
  if (!authenticated && route.meta.requiresAuth) {
    router.replace({ name: 'ingresar', query: { redirect: route.fullPath } })
  }
})
watch(() => auth.passwordRecovery.value, (recovering) => {
  if (recovering && route.name !== 'recuperar') router.replace('/cuenta/recuperar/')
}, { immediate: true })
watch(() => route.fullPath, () => {
  updateTitle()
  if (!route.hash) window.scrollTo({ top: 0, behavior: 'auto' })
})
</script>

<template>
  <div class="app-shell" :class="{ 'native-app': nativeApp }">
    <SiteHeader v-if="!nativeApp" />
    <RouterLink
      v-if="showNativeActions && route.path.startsWith('/dashboard/')"
      to="/configuracion/"
      class="native-settings-button"
      aria-label="Abrir configuración"
      title="Configuración"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25 3.25 3.25 0 0 0 12 8.75Z" />
        <path d="M19.1 13.1c.04-.36.04-.74 0-1.1l1.72-1.34-1.82-3.15-2.03.82a7.65 7.65 0 0 0-.95-.55L15.72 5h-3.64l-.3 2.78c-.33.16-.65.34-.95.55L8.8 7.51 6.98 10.66 8.7 12c-.04.36-.04.74 0 1.1l-1.72 1.34 1.82 3.15 2.03-.82c.3.21.62.39.95.55l.3 2.78h3.64l.3-2.78c.33-.16.65-.34.95-.55l2.03.82 1.82-3.15-1.72-1.34Z" />
      </svg>
    </RouterLink>
    <RouterLink
      v-if="showNativeActions && route.path.startsWith('/configuracion/')"
      to="/dashboard/"
      class="native-dashboard-back"
      aria-label="Volver al dashboard"
    >
      <span aria-hidden="true">←</span> Dashboard
    </RouterLink>
    <main>
      <RouterView />
    </main>
    <SiteFooter v-if="!nativeApp" />
  </div>
</template>
