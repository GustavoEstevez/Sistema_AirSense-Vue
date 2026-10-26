import { createRouter, createWebHistory } from 'vue-router'
import ProductView from './views/ProductView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 100, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'producto', component: ProductView, meta: { title: 'AirSense Pro · Solución de Monitoreo Ambiental Corporativo' } },
    { path: '/dashboard/', name: 'dashboard', component: () => import('./views/DashboardView.vue'), meta: { title: 'Consola de Telemetría' } },
    { path: '/hardware/', alias: '/clasico/', name: 'hardware', component: () => import('./views/ClassicView.vue'), meta: { title: 'Tecnología' } },
    { path: '/documentacion/', name: 'documentacion', component: () => import('./views/DocumentationView.vue'), meta: { title: 'Funcionamiento & Integración IT' } },
    { path: '/instalaciones/', alias: '/galeria/', name: 'instalaciones', component: () => import('./views/GalleryView.vue'), meta: { title: 'Instalaciones y Despliegues' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
