<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuoteModal from './QuoteModal.vue'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const menuOpen = ref(false)
const scrolled = ref(false)
const showQuoteModal = ref(false)
const header = ref(null)
const menuButton = ref(null)
const quoteButton = ref(null)
let mobileQuery

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/hardware/', label: 'Producto' },
  { to: '/documentacion/', label: 'Cómo funciona' },
  { to: '/#beneficios', label: 'Beneficios' },
  { to: '/#contacto', label: 'Contacto' },
]

function isActive(path) {
  return path.includes('#') ? route.fullPath === path : route.path === path && !route.hash
}
function updateScroll() { scrolled.value = window.scrollY > 24 }
function closeMenu() { menuOpen.value = false }
function onOutside(event) {
  const target = event.type === 'focusout' ? event.relatedTarget : event.target
  if (menuOpen.value && !header.value?.contains(target)) closeMenu()
}
function onKeydown(event) {
  if (event.key === 'Escape' && menuOpen.value) {
    closeMenu()
    menuButton.value?.focus()
  }
}
function onBreakpoint(event) { if (!event.matches) closeMenu() }
async function openQuote() {
  closeMenu()
  await nextTick()
  if (mobileQuery?.matches) menuButton.value?.focus()
  else quoteButton.value?.focus()
  showQuoteModal.value = true
}
async function closeQuote() {
  showQuoteModal.value = false
  await nextTick()
  if (mobileQuery?.matches) menuButton.value?.focus()
  else quoteButton.value?.focus()
}
async function leave() {
  await auth.signOut()
  closeMenu()
  await router.push('/')
}
watch(() => route.fullPath, closeMenu)
onMounted(() => {
  updateScroll()
  mobileQuery = window.matchMedia('(max-width: 1120px)')
  mobileQuery.addEventListener('change', onBreakpoint)
  window.addEventListener('scroll', updateScroll, { passive: true })
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  mobileQuery?.removeEventListener('change', onBreakpoint)
  window.removeEventListener('scroll', updateScroll)
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header ref="header" class="airsense-header" :class="{ 'is-scrolled': scrolled, 'menu-is-open': menuOpen }" @focusout="onOutside">
    <div class="header-inner">
      <RouterLink to="/" class="header-brand" aria-label="AirSense, inicio" @click="closeMenu">
        <img src="/assets/Logos/LogoAirSense.png" alt="" width="44" height="44" />
        <span>Air<span class="brand-accent">Sense</span></span>
      </RouterLink>

      <nav id="airsense-navigation" class="header-navigation" :class="{ 'is-open': menuOpen }" aria-label="Navegación principal">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="navigation-link" :class="{ 'is-active': isActive(link.to) }" :aria-current="isActive(link.to) ? (link.to.includes('#') ? 'location' : 'page') : undefined" @click="closeMenu">{{ link.label }}</RouterLink>
        <button ref="quoteButton" type="button" class="navigation-link inquiry-link" @click="openQuote">Solicitar info</button>
        <div class="mobile-account-links">
          <RouterLink v-if="auth.isAuthenticated.value" to="/dashboard/" @click="closeMenu">Dashboard</RouterLink>
          <RouterLink v-if="auth.isAdmin.value" to="/admin/usuarios/" @click="closeMenu">Usuarios</RouterLink>
          <RouterLink :to="auth.isAuthenticated.value ? '/panel/' : '/cuenta/ingresar/'" @click="closeMenu">{{ auth.isAuthenticated.value ? 'Mi cuenta' : 'Ingresar' }}</RouterLink>
          <button v-if="auth.isAuthenticated.value" type="button" @click="leave">Cerrar sesión</button>
        </div>
      </nav>

      <div class="header-controls">
        <RouterLink v-if="auth.isAuthenticated.value" class="utility-link" to="/dashboard/">Dashboard</RouterLink>
        <RouterLink v-if="auth.isAdmin.value" class="utility-link" to="/admin/usuarios/">Usuarios</RouterLink>
        <RouterLink class="utility-link" :to="auth.isAuthenticated.value ? '/panel/' : '/cuenta/ingresar/'">{{ auth.isAuthenticated.value ? 'Mi cuenta' : 'Ingresar' }}</RouterLink>
        <RouterLink to="/hardware/" class="info-button" @click="closeMenu">Conocer AirSense</RouterLink>
        <button ref="menuButton" type="button" class="navigation-toggle" :aria-expanded="menuOpen" aria-controls="airsense-navigation" :aria-label="menuOpen ? 'Cerrar navegación' : 'Abrir navegación'" @click="menuOpen = !menuOpen"><span></span><span></span></button>
      </div>
    </div>
  </header>
  <QuoteModal :show="showQuoteModal" @close="closeQuote" />
</template>

<style scoped>
.airsense-header {
  --header-height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(10, 76, 96, .08);
  background: #fff;
  color: var(--c-navy);
  transition: background-color .28s ease, box-shadow .28s ease, backdrop-filter .28s ease;
}
.airsense-header.is-scrolled {
  --header-height: 60px;
  background: rgba(235, 244, 246, .94);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  box-shadow: none;
}
.header-inner { width: min(1180px, calc(100% - 48px)); height: var(--header-height); margin: auto; display: flex; align-items: center; gap: 24px; transition: height .28s ease; }
.header-brand { display: inline-flex; flex-shrink: 0; align-items: center; gap: 8px; }
.header-brand img { width: 44px; height: 44px; object-fit: contain; }
.header-brand > span { font-family: var(--font-display); font-size: 21px; font-weight: 600; letter-spacing: -.9px; line-height: 1.1; }
.brand-accent { color: var(--c-teal); }
.header-navigation { display: flex; align-items: center; justify-content: center; gap: 20px; margin-inline: auto; }
.navigation-link, .utility-link { position: relative; padding-block: 14px; color: var(--c-navy); font-size: 13px; font-weight: 500; white-space: nowrap; transition: color .2s ease; }
.navigation-link::after { content: ''; position: absolute; height: 2px; left: 0; right: 0; bottom: 7px; border-radius: 2px; background: var(--c-teal); transform: scaleX(0); transition: transform .2s ease; }
.navigation-link.is-active { color: var(--c-navy); }
.navigation-link.is-active::after { transform: scaleX(1); }
.header-controls { display: flex; align-items: center; gap: 16px; }
.info-button { display: inline-flex; justify-content: center; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 1px solid transparent; border-radius: 9px; background: var(--c-teal); color: white; font-size: 13px; font-weight: 550; white-space: nowrap; transition: background-color .2s ease, box-shadow .2s ease; }
.info-button span { font-size: 17px; }
.navigation-toggle, .mobile-account-links { display: none; }
.inquiry-link { border: 0; background: transparent; text-align: left; font: inherit; font-size: 13px; color: var(--c-navy); }
:where(a, button):focus-visible { outline: 3px solid var(--c-teal); outline-offset: 4px; }
@media (hover: hover) {
  .navigation-link:hover, .utility-link:hover { color: var(--c-teal); }
  .navigation-link:hover::after { transform: scaleX(1); }
  .info-button:hover { background: var(--c-navy); box-shadow: 0 3px 12px rgba(8, 118, 129, .14); }
}
@media (max-width: 1280px) {
  .header-inner { gap: 18px; width: calc(100% - 40px); }
  .header-navigation { gap: 16px; }
  .header-controls { gap: 10px; }
}
@media (max-width: 1120px) {
  .airsense-header { --header-height: 64px; }
  .airsense-header.is-scrolled { --header-height: 60px; }
  .header-controls { margin-left: auto; gap: 12px; }
  .utility-link { display: none; }
  .navigation-toggle { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 44px; height: 44px; padding: 10px; border: 1px solid #deeaeb; border-radius: 50%; background: transparent; }
  .navigation-toggle span { width: 18px; height: 1.5px; background: var(--c-navy); transition: transform .2s ease; }
  .menu-is-open .navigation-toggle span:first-child { transform: translateY(3.75px) rotate(45deg); }
  .menu-is-open .navigation-toggle span:last-child { transform: translateY(-3.75px) rotate(-45deg); }
  .header-navigation { position: absolute; top: 100%; left: 0; right: 0; display: none; padding: 16px 24px 24px; margin: 0; max-height: calc(100dvh - var(--header-height)); overflow-y: auto; background: #fff; border-bottom: 1px solid #deeaeb; box-shadow: 0 18px 24px rgba(10, 76, 96, .06); }
  .header-navigation.is-open { display: flex; flex-direction: column; align-items: stretch; gap: 0; animation: reveal-navigation .16s ease-out; }
  .inquiry-link { font-size: 16px; min-height: 48px; }
  .navigation-link { padding: 15px 8px; font-size: 16px; }
  .navigation-link::after { left: 8px; right: auto; width: 22px; bottom: 8px; }
  .mobile-account-links { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e8eeee; }
  .mobile-account-links a, .mobile-account-links button { display: inline-flex; align-items: center; min-height: 44px; padding: 8px; border: 0; background: transparent; color: var(--c-navy); font-size: 13px; }
}
@media (max-width: 480px) {
  .header-inner { width: calc(100% - 24px); gap: 8px; }
  .header-brand { gap: 3px; }
  .header-brand img { width: 34px; height: 34px; }
  .header-brand > span { font-size: 20px; }
  .header-controls { gap: 8px; }
  .info-button { padding-inline: 12px; font-size: 12px; gap: 6px; }
  .info-button span { display: none; }
}
@media (max-width: 380px) {
  .header-brand img { width: 30px; height: 30px; }
  .header-brand > span { font-size: 19px; }
  .info-button { padding-inline: 8px; font-size: 11px; }
}
@keyframes reveal-navigation { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  *, *::after { transition: none !important; animation: none !important; }
}
</style>
