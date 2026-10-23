<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)

const links = [
  { to: '/inicio/', label: 'Inicio' },
  { to: '/', label: 'AirSense AI', badge: 'Nuevo' },
  { to: '/clasico/', label: 'Classic' },
  { to: '/dashboard/', label: 'Dashboard' },
  { to: '/documentacion/', label: 'Documentación' },
  { to: '/galeria/', label: 'Galería' },
]

function isActive(path) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <header class="site-header">
    <div class="nav-wrap">
      <RouterLink to="/" class="brand" aria-label="AirSense, inicio" @click="menuOpen = false">
        <img src="/assets/Logos/LogoAirSense.png" alt="" />
        <span>
          <strong>Air<span>Sense</span></strong>
          <small>Monitoreo ambiental inteligente</small>
        </span>
      </RouterLink>

      <button
        class="menu-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-label="Abrir o cerrar navegación"
        @click="menuOpen = !menuOpen"
      >
        <span></span><span></span><span></span>
      </button>

      <nav :class="{ open: menuOpen }" aria-label="Navegación principal">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="{ active: isActive(link.to) }"
          @click="menuOpen = false"
        >
          <small v-if="link.badge">{{ link.badge }}</small>{{ link.label }}
        </RouterLink>
      </nav>

      <RouterLink to="/dashboard/" class="live-link">
        <span></span> En vivo
      </RouterLink>
    </div>
  </header>
</template>
