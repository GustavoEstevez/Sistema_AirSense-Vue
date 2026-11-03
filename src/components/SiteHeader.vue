<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuoteModal from './QuoteModal.vue'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
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

async function leave() {
  await auth.signOut()
  menuOpen.value = false
  await router.push('/')
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

        <RouterLink v-if="auth.isAuthenticated.value" to="/dashboard/" :class="{ active: isActive('/dashboard/') }" @click="menuOpen = false">Dashboard</RouterLink>
        <RouterLink v-if="auth.isAdmin.value" to="/admin/usuarios/" :class="{ active: isActive('/admin/') }" @click="menuOpen = false">Usuarios</RouterLink>
        <RouterLink v-if="auth.isAuthenticated.value" to="/panel/" class="mobile-only account-mobile-link" @click="menuOpen = false">Mi perfil</RouterLink>
        <RouterLink v-else to="/cuenta/ingresar/" class="mobile-only account-mobile-link" @click="menuOpen = false">Iniciar sesión</RouterLink>
        <button v-if="auth.isAuthenticated.value" type="button" class="mobile-only account-mobile-link" @click="leave">Cerrar sesión</button>

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
        <RouterLink v-if="auth.isAuthenticated.value" to="/panel/" class="account-link" aria-label="Abrir mi perfil">
          {{ auth.profile.value?.first_name || 'Mi cuenta' }}
        </RouterLink>
        <RouterLink v-else to="/cuenta/ingresar/" class="account-link">Ingresar</RouterLink>
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
