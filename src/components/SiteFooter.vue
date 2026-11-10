<script setup>
const groups = [
  { title: 'Explorá AirSense', links: [
    { label: 'Inicio', to: '/' },
    { label: 'El dispositivo', to: '/hardware/' },
    { label: 'Espacios e instalaciones', to: '/instalaciones/' },
    { label: 'Dashboard', to: '/dashboard/' },
  ] },
  { title: 'Tecnología', links: [
    { label: 'Cómo funciona', to: '/documentacion/' },
    { label: 'Conectividad y arquitectura', to: '/documentacion/#arquitectura' },
    { label: 'Sensores y mediciones', to: '/documentacion/#rangos' },
    { label: 'Instalación', to: '/documentacion/#instalacion' },
  ] },
  { title: 'Tu cuenta', links: [
    { label: 'Iniciar sesión', to: '/cuenta/ingresar/' },
    { label: 'Crear una cuenta', to: '/cuenta/registro/' },
    { label: 'Recuperar acceso', to: '/cuenta/recuperar/' },
  ] },
]
</script>

<template>
  <footer class="airsense-footer">
    <div class="footer-content">
      <div class="footer-intro">
        <RouterLink to="/" class="footer-wordmark" aria-label="AirSense, inicio">
          <img src="/assets/Logos/LogoAirSense.png" alt="" width="44" height="44" />
          <span class="footer-brand-name">Air<span>Sense</span></span>
        </RouterLink>
        <p>Información para entender tu entorno.</p>
      </div>
      <nav class="footer-directory" aria-label="Navegación al pie de página">
        <div v-for="group in groups" :key="group.title" class="footer-column">
          <h2>{{ group.title }}</h2>
          <ul>
            <li v-for="link in group.links" :key="link.to"><RouterLink :to="link.to">{{ link.label }}</RouterLink></li>
          </ul>
        </div>
        <div class="footer-column">
          <h2>Contacto</h2>
          <ul>
            <li><a href="mailto:airsensearg@gmail.com">airsensearg@gmail.com</a></li>
            <li><a href="https://www.instagram.com/airsensearg/" target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗</span><span class="footer-sr-only"> (se abre en otra pestaña)</span></a></li>
          </ul>
          <p class="footer-location">Buenos Aires, Argentina</p>
        </div>
      </nav>
      <div class="footer-assistance">
        Conocé más sobre <RouterLink to="/hardware/">el dispositivo AirSense</RouterLink> o consultá <RouterLink to="/documentacion/">cómo funciona</RouterLink>.
      </div>
      <div class="footer-copyright">
        <p>© {{ new Date().getFullYear() }} AirSense. Todos los derechos reservados.</p>
        <span>Argentina</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.airsense-footer { background: #f2f5f6; color: #56636b; border-top: 1px solid rgba(10,76,96,.08); font-family: var(--font-body); font-size: 12px; line-height: 1.5; }
.footer-content { width: min(1040px, calc(100% - 48px)); margin-inline: auto; padding: 32px 0 20px; }
.footer-intro { display: flex; align-items: center; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid rgba(10,76,96,.14); }
.footer-wordmark { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; color: var(--c-navy); font-family: var(--font-display); font-size: 21px; font-weight: 600; letter-spacing: -.8px; }
.footer-wordmark img { width: 44px; height: 44px; object-fit: contain; }
.footer-brand-name > span { color: var(--c-teal); }
.footer-intro p { margin: 0; }
.footer-directory { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; padding: 28px 0 32px; }
.footer-column h2 { margin: 0 0 12px; color: #273b43; font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: 0; line-height: 1.5; }
.footer-column ul { list-style: none; margin: 0; padding: 0; }
.footer-column li + li { margin-top: 10px; }
.footer-column a { display: inline-block; padding-block: 2px; }
.footer-location { margin: 14px 0 0; color: #56636b; }
.footer-assistance { padding-bottom: 16px; border-bottom: 1px solid rgba(10,76,96,.14); }
.footer-assistance a { color: var(--teal-deep); text-decoration: underline; text-underline-offset: 3px; }
.footer-copyright { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding-top: 16px; font-size: 11px; }
.footer-copyright p { margin: 0; }
.footer-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
a:focus-visible { outline: 2px solid var(--c-teal); outline-offset: 4px; border-radius: 2px; }
@media (hover: hover) { .footer-column a:hover { color: var(--c-navy); text-decoration: underline; text-underline-offset: 3px; } }
@media (max-width: 760px) {
  .footer-directory { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 20px; }
  .footer-column a { min-height: 36px; display: inline-flex; align-items: center; }
  .footer-column li + li { margin-top: 2px; }
}
@media (max-width: 480px) {
  .footer-content { width: calc(100% - 40px); padding-top: 28px; }
  .footer-intro { align-items: flex-start; flex-direction: column; gap: 8px; }
  .footer-directory { grid-template-columns: 1fr; gap: 0; padding-bottom: 20px; }
  .footer-column { padding: 20px 0; border-bottom: 1px solid rgba(10,76,96,.08); }
  .footer-column:last-child { border-bottom: 0; }
  .footer-column a { min-height: 44px; }
  .footer-copyright { flex-direction: column; gap: 8px; }
}
</style>
