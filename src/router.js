import { createRouter, createWebHistory } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import ProductView from './views/ProductView.vue'
import { initializeAuth, useAuth } from './composables/useAuth'
import { supabase } from './lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 100, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'producto', component: ProductView, meta: { title: 'AirSense Pro · Solución de Monitoreo Ambiental Corporativo' } },
    { path: '/dashboard/', name: 'dashboard', component: () => import('./views/DashboardView.vue'), meta: { title: 'Consola de Telemetría', requiresAuth: true } },
    { path: '/hardware/', alias: '/clasico/', name: 'hardware', component: () => import('./views/ClassicView.vue'), meta: { title: 'Tecnología' } },
    { path: '/documentacion/', name: 'documentacion', component: () => import('./views/DocumentationView.vue'), meta: { title: 'Funcionamiento & Integración IT' } },
    { path: '/instalaciones/', alias: '/galeria/', name: 'instalaciones', component: () => import('./views/GalleryView.vue'), meta: { title: 'Instalaciones y Despliegues' } },
    { path: '/cuenta/ingresar/', name: 'ingresar', component: () => import('./views/AuthView.vue'), meta: { title: 'Iniciar sesión', guestOnly: true } },
    { path: '/cuenta/registro/', name: 'registro', component: () => import('./views/AuthView.vue'), meta: { title: 'Crear cuenta', guestOnly: true } },
    { path: '/cuenta/recuperar/', name: 'recuperar', component: () => import('./views/AuthView.vue'), meta: { title: 'Recuperar contraseña' } },
    { path: '/cuenta/verificar-2fa/', name: 'verificar-2fa', component: () => import('./views/MfaChallengeView.vue'), meta: { title: 'Verificación en dos pasos', requiresAuth: true } },
    { path: '/panel/', name: 'perfil', component: () => import('./views/ProfileView.vue'), meta: { title: 'Mi perfil', requiresAuth: true } },
    { path: '/configuracion/', name: 'configuracion', component: () => import('./views/MobileSettingsView.vue'), meta: { title: 'Configuración', requiresAuth: true } },
    { path: '/admin/usuarios/', name: 'usuarios-admin', component: () => import('./views/AdminUsersView.vue'), meta: { title: 'Gestión de usuarios', requiresAuth: true, requiresAdmin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  await initializeAuth()
  const auth = useAuth()
  const nativeApp = Capacitor.isNativePlatform()
  if (nativeApp && to.name === 'producto') {
    return { name: auth.isAuthenticated.value ? 'dashboard' : 'ingresar' }
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { name: 'ingresar', query: { redirect: to.fullPath } }
  }
  if (auth.isAuthenticated.value && to.name !== 'verificar-2fa' && to.name !== 'recuperar' && supabase) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assurance?.currentLevel === 'aal1' && assurance?.nextLevel === 'aal2') {
      return { name: 'verificar-2fa', query: { redirect: to.fullPath } }
    }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin.value) return { name: 'perfil' }
  if (to.meta.guestOnly && auth.isAuthenticated.value) return { name: nativeApp ? 'dashboard' : 'perfil' }
  return true
})

export default router
