import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'ai', component: HomeView, meta: { title: 'AirSense AI' } },
    { path: '/inicio/', name: 'inicio', component: () => import('./views/StoryView.vue'), meta: { title: 'El proyecto' } },
    { path: '/clasico/', name: 'clasico', component: () => import('./views/ClassicView.vue'), meta: { title: 'AirSense Classic' } },
    { path: '/dashboard/', name: 'dashboard', component: () => import('./views/DashboardView.vue'), meta: { title: 'Dashboard en vivo' } },
    { path: '/documentacion/', name: 'documentacion', component: () => import('./views/DocumentationView.vue'), meta: { title: 'Documentación' } },
    { path: '/galeria/', name: 'galeria', component: () => import('./views/GalleryView.vue'), meta: { title: 'Galería' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
