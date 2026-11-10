<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)
const scrolled = ref(false)
const header = ref(null)
const surfacePath = ref('')
let headerObserver

// Two symmetric cubic segments per corner: zero curvature at the straight
// edges and matching tangent/curvature at the diagonal join (G2).
function updateSurface() {
  if (!header.value) return
  const { width: w, height: h } = header.value.getBoundingClientRect()
  const r = Math.min(32, h / 2, w / 2)
  const a = .55 * r, b = .4 * r, c = .2 * r
  surfacePath.value = `M ${r} 0 H ${w-r}
    C ${w-a} 0 ${w-b} 0 ${w-c} ${c} C ${w} ${b} ${w} ${a} ${w} ${r}
    V ${h-r} C ${w} ${h-a} ${w} ${h-b} ${w-c} ${h-c}
    C ${w-b} ${h} ${w-a} ${h} ${w-r} ${h}
    H ${r} C ${a} ${h} ${b} ${h} ${c} ${h-c}
    C 0 ${h-b} 0 ${h-a} 0 ${h-r}
    V ${r} C 0 ${a} 0 ${b} ${c} ${c} C ${b} 0 ${a} 0 ${r} 0 Z`
}
const menuButton = ref(null)
let mobileQuery

const links = [
  { to: '/', name: 'producto', label: 'Inicio' },
  { to: '/dashboard/', name: 'dashboard', label: 'Dashboard' },
]

function isActive(link) { return route.name === link.name }
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
watch(() => route.fullPath, closeMenu)
onMounted(() => {
  headerObserver = new ResizeObserver(updateSurface)
  headerObserver.observe(header.value)
  updateSurface()
  updateScroll()
  mobileQuery = window.matchMedia('(max-width: 1120px)')
  mobileQuery.addEventListener('change', onBreakpoint)
  window.addEventListener('scroll', updateScroll, { passive: true })
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  headerObserver?.disconnect()
  mobileQuery?.removeEventListener('change', onBreakpoint)
  window.removeEventListener('scroll', updateScroll)
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header ref="header" class="airsense-header" :class="{ 'is-scrolled': scrolled, 'menu-is-open': menuOpen, 'over-hero': route.name === 'producto' }" :style="{ '--surface-clip': surfacePath ? `path('${surfacePath.replace(/\s+/g, ' ')}')` : undefined }" @focusout="onOutside">
    <svg class="header-surface" width="100%" height="100%" aria-hidden="true">
      <path :d="surfacePath" />
    </svg>
    <div class="header-inner">
      <RouterLink to="/" class="header-brand" aria-label="AirSense, inicio" @click="closeMenu">
        <img src="/assets/Logos/LogoAirSense.png" alt="" width="44" height="44" />
        <span>Air<span class="brand-accent">Sense</span></span>
      </RouterLink>

      <nav id="airsense-navigation" class="header-navigation" :class="{ 'is-open': menuOpen }" aria-label="Navegación principal">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="navigation-link" :class="{ 'is-active': isActive(link) }" :aria-current="isActive(link) ? 'page' : undefined" @click="closeMenu">{{ link.label }}</RouterLink>
      </nav>

      <div class="header-controls">
        <a class="instagram-link" href="https://www.instagram.com/airsensearg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram oficial de AirSense">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
        </a>
        <button ref="menuButton" type="button" class="navigation-toggle" :aria-expanded="menuOpen" aria-controls="airsense-navigation" :aria-label="menuOpen ? 'Cerrar navegación' : 'Abrir navegación'" @click="menuOpen = !menuOpen"><span></span><span></span></button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.airsense-header {
  --header-height: 68px;
  --glass-fill: rgba(248,252,255,.38);
  --glass-blur: blur(28px) saturate(1.65);
  position: sticky;
  --header-offset: 16px;
  top: var(--header-offset);
  z-index: 100;
  width: min(1280px, calc(100% - 48px));
  margin: var(--header-offset) auto 0;
  isolation: isolate;
  color: var(--c-navy);
}
.airsense-header::before { content: ''; position: absolute; inset: 0; z-index: -2; border-radius: 32px; clip-path: var(--surface-clip, inset(0 round 32px)); background: linear-gradient(115deg, rgba(255,255,255,.3), rgba(255,255,255,.04) 45%, rgba(219,241,247,.18)); -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); pointer-events: none; }
.header-surface { position: absolute; inset: 0; z-index: -1; overflow: visible; pointer-events: none; filter: drop-shadow(0 8px 20px rgba(16,39,53,.1)); }
.header-surface path { fill: var(--glass-fill); stroke: rgba(255,255,255,.65); stroke-width: 1; transition: fill .28s ease; }
.airsense-header.over-hero { position: fixed; left: 50%; transform: translateX(-50%); margin: 0; }
.airsense-header.is-scrolled {
  --header-height: 64px;
  --glass-fill: rgba(248,252,255,.58);
}
.header-inner { width: calc(100% - 40px); height: var(--header-height); margin: auto; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; transition: height .28s ease; }
.header-brand { justify-self: start; display: inline-flex; flex-shrink: 0; align-items: center; gap: 8px; }
.header-brand img { width: 44px; height: 44px; object-fit: contain; }
.header-brand > span { font-family: var(--font-display); font-size: 21px; font-weight: 600; letter-spacing: -.9px; line-height: 1.1; }
.brand-accent { color: var(--c-teal); }
.header-navigation { display: flex; align-items: center; justify-content: center; gap: 20px; margin-inline: auto; }
.navigation-link, .utility-link { position: relative; padding-block: 14px; color: var(--c-navy); font-size: 13px; font-weight: 500; white-space: nowrap; transition: color .2s ease; }
.navigation-link::after { content: ''; position: absolute; height: 2px; left: 0; right: 0; bottom: 7px; border-radius: 2px; background: var(--c-teal); transform: scaleX(0); transition: transform .2s ease; }
.navigation-link.is-active { color: var(--c-navy); }
.navigation-link.is-active::after { transform: scaleX(1); }
.header-controls { justify-self: end; display: flex; align-items: center; gap: 16px; }
.instagram-link { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; color: var(--c-navy); transition: color .2s ease, opacity .2s ease; }
.instagram-link svg { flex-shrink: 0; }
.info-button { display: inline-flex; justify-content: center; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 1px solid transparent; border-radius: 9px; background: var(--c-teal); color: white; font-size: 13px; font-weight: 550; white-space: nowrap; transition: background-color .2s ease, box-shadow .2s ease; }
.info-button span { font-size: 17px; }
.navigation-toggle, .mobile-account-links { display: none; }
.inquiry-link { border: 0; background: transparent; text-align: left; font: inherit; font-size: 13px; color: var(--c-navy); }
:where(a, button):focus-visible { outline: 3px solid var(--c-teal); outline-offset: 4px; }
@media (hover: hover) {
  .instagram-link:hover { color: var(--c-teal); opacity: .8; }
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
  .header-inner { display: flex; }
  .header-controls { margin-left: auto; gap: 12px; }
  .utility-link { display: none; }
  .navigation-toggle { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 44px; height: 44px; padding: 10px; border: 1px solid #deeaeb; border-radius: 50%; background: transparent; }
  .navigation-toggle span { width: 18px; height: 1.5px; background: var(--c-navy); transition: transform .2s ease; }
  .menu-is-open .navigation-toggle span:first-child { transform: translateY(3.75px) rotate(45deg); }
  .menu-is-open .navigation-toggle span:last-child { transform: translateY(-3.75px) rotate(-45deg); }
  .header-navigation { position: absolute; top: calc(100% + 10px); left: 0; right: 0; display: none; padding: 16px 24px 24px; margin: 0; max-height: calc(100dvh - var(--header-height) - 52px); overflow-y: auto; background: var(--glass-fill); -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); border: 1px solid rgba(0,0,0,.08); border-radius: 26px; corner-shape: squircle; box-shadow: 0 12px 28px rgba(0,0,0,.08); }
  .header-navigation.is-open { display: flex; flex-direction: column; align-items: stretch; gap: 0; animation: reveal-navigation .16s ease-out; }
  .inquiry-link { font-size: 16px; min-height: 48px; }
  .navigation-link { padding: 15px 8px; font-size: 16px; }
  .navigation-link::after { left: 8px; right: auto; width: 22px; bottom: 8px; }
  .mobile-account-links { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e8eeee; }
  .mobile-account-links a, .mobile-account-links button { display: inline-flex; align-items: center; min-height: 44px; padding: 8px; border: 0; background: transparent; color: var(--c-navy); font-size: 13px; }
}
@media (max-width: 480px) {
  .airsense-header { --header-offset: 10px; width: calc(100% - 20px); }
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
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .header-surface path, .airsense-header.is-scrolled .header-surface path { fill: rgba(248,252,253,.96); }
  .header-navigation { background: #f8fcfd; }
}
@media (prefers-reduced-transparency: reduce) {
  .airsense-header::before, .header-navigation { -webkit-backdrop-filter: none; backdrop-filter: none; }
  .header-surface path, .airsense-header.is-scrolled .header-surface path { fill: #f8fcfd; }
  .header-navigation { background: #f8fcfd; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::after { transition: none !important; animation: none !important; }
}
.airsense-header::after { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: 32px; clip-path: var(--surface-clip, inset(0 round 32px)); background: linear-gradient(180deg, rgba(255,255,255,.5), transparent 38%, transparent 65%, rgba(255,255,255,.16)); box-shadow: inset 0 1px 1px rgba(255,255,255,.95), inset 0 -1px 1px rgba(255,255,255,.65); pointer-events: none; }
</style>
