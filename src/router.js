import { createRouter, createWebHistory } from 'vue-router'
import ProductView from './views/ProductView.vue'
import { initializeAuth, useAuth } from './composables/useAuth'

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
    { path: '/panel/', name: 'perfil', component: () => import('./views/ProfileView.vue'), meta: { title: 'Mi perfil', requiresAuth: true } },
    { path: '/admin/usuarios/', name: 'usuarios-admin', component: () => import('./views/AdminUsersView.vue'), meta: { title: 'Gestión de usuarios', requiresAuth: true, requiresAdmin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  await initializeAuth()
  const auth = useAuth()
  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { name: 'ingresar', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin.value) return { name: 'perfil' }
  if (to.meta.guestOnly && auth.isAuthenticated.value) return { name: 'perfil' }
  return true
})

export default router
