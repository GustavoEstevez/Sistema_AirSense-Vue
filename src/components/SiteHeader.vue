<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import QuoteModal from './QuoteModal.vue'

const route = useRoute()
const menuOpen = ref(false)
const showQuoteModal = ref(false)

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/hardware/', label: 'Tecnología' },
  { to: '/documentacion/', label: 'Funcionamiento' },
  { to: '/instalaciones/', label: 'Despliegues' },
]

function isActive(path) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <header class="site-header">
    <div class="nav-wrap">
      <RouterLink to="/" class="brand" aria-label="AirSense Enterprise" @click="menuOpen = false">
        <img src="/assets/Logos/LogoAirSense.png" alt="Logo AirSense" />
        <span>
          <strong>Air<span>Sense</span>™</strong>
          <small>Monitoreo Ambiental Corporativo</small>
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
          {{ link.label }}
        </RouterLink>

        <!-- CTA in mobile menu -->
        <button
          type="button"
          class="header-cta-btn mobile-only"
          @click="menuOpen = false; showQuoteModal = true"
        >
          Cotización Personalizada
        </button>
      </nav>

      <!-- Desktop corporate quote CTA -->
      <div class="header-actions desktop-only">
        <button
          type="button"
          class="header-cta-btn"
          @click="showQuoteModal = true"
        >
          Cotización Personalizada →
        </button>
      </div>
    </div>

    <!-- Quote Modal -->
    <QuoteModal :show="showQuoteModal" @close="showQuoteModal = false" />
  </header>
</template>
