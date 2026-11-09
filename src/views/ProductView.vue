<script setup>
import { ref } from 'vue'
import QuoteModal from '../components/QuoteModal.vue'
import NoiseInsightSection from '../components/NoiseInsightSection.vue'
import EnvironmentalProblemsSection from '../components/EnvironmentalProblemsSection.vue'
import SpacesExperienceSection from '../components/SpacesExperienceSection.vue'

const showQuote = ref(false)

const sectors = [
  { title: 'Oficinas Corporativas', desc: 'Ambientes ventilados que potencian la concentración, el bienestar y previenen el letargo vespertino.' },
  { title: 'Salas de Reuniones', desc: 'Espacios de alta densidad donde la calidad del aire puede deteriorarse rápidamente si no hay renovación activa.' },
  { title: 'Clínicas y Laboratorios', desc: 'Control estricto de humedad y temperatura para conservación ambiental y seguridad biológica.' },
  { title: 'Centros Educativos', desc: 'Aulas y auditorios con aire limpio que garantizan una experiencia pedagógica saludable.' },
]
</script>

<template>
  <div class="product-page">
    <section id="producto" class="product-video-hero" aria-labelledby="product-hero-title">
      <div class="product-hero-copy page-width">
        <h1 id="product-hero-title">Hacemos visible lo invisible.</h1>
        <p>AirSense monitorea las condiciones ambientales para acercarte información que antes pasaba desapercibida.</p>
        <RouterLink to="/hardware/" class="hero-learn-more">Conocer más</RouterLink>
      </div>
      <video
        class="product-hero-video"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-label="Video de presentaci&#243;n del dispositivo AirSense"
      >
        <source src="/assets/airsense-product-hero.mp4" type="video/mp4" />
        Tu navegador no puede reproducir este video.
        <a href="/assets/airsense-product-hero.mp4">Descargar video de AirSense</a>
      </video>
    </section>

    <EnvironmentalProblemsSection />
    <NoiseInsightSection />

    <!-- International Standards Section -->
    <section class="section page-width standards-section">
      <div class="section-heading">
        <span>ESTÁNDARES INTERNACIONALES</span>
        <h2>Diseñado según estándares internacionales</h2>
        <p>Cada estación y cada informe de AirSense se alinean con las principales normas de calidad ambiental, eficiencia edilicia y seguridad ocupacional.</p>
      </div>

      <div class="standards-grid">
        <article class="standard-card panel">
          <strong>ASHRAE 62.1</strong>
          <span>Ventilación para calidad de aire interior</span>
        </article>
        <article class="standard-card panel">
          <strong>WELL v2</strong>
          <span>Confort térmico, acústico y bienestar</span>
        </article>
        <article class="standard-card panel">
          <strong>LEED v4.1</strong>
          <span>Criterios de eficiencia y calidad ambiental</span>
        </article>
        <article class="standard-card panel">
          <strong>OSHA / SRT</strong>
          <span>Seguridad e higiene en el trabajo</span>
        </article>
        <article class="standard-card panel">
          <strong>TLS 1.2+</strong>
          <span>Cifrado de datos en tránsito</span>
        </article>
      </div>
    </section>

    <SpacesExperienceSection />

    <!-- Interactive Live Telemetry Showcase -->
    <section class="showcase">
      <div class="page-width showcase-grid">
        <div>
          <span class="eyebrow dark">PLATAFORMA CLOUD CENTRALIZADA</span>
          <h2>Visibilidad inmediata de cada metro cuadrado de tu empresa.</h2>
          <p>
            Nuestra consola web conectada a Supabase Cloud y arquitectura Node.js procesa lecturas cada pocos segundos.
            Visualizá tendencias históricas, configurá umbrales de alerta y enviá informes de auditoría a la gerencia con un solo clic.
          </p>
          <ul class="showcase-list">
            <li>✓ Sincronización instantánea mediante WebSockets y Supabase Realtime.</li>
            <li>✓ Envío automatizado de resúmenes por correo electrónico a RRHH y Facilities.</li>
            <li>✓ Sin necesidad de instalar servidores locales ni configurar VPNs complejas.</li>
          </ul>
          <div style="margin-top: 30px; display: flex; gap: 14px; flex-wrap: wrap;">
            <RouterLink to="/documentacion/" class="button secondary" style="color: white; border-color: rgba(255,255,255,0.2);">
              Ver Funcionamiento
            </RouterLink>
          </div>
        </div>
        <div class="showcase-img-wrap">
          <img src="/assets/Fotos/DashboardLive.jpg" alt="Consola de Monitoreo Centralizado AirSense" />
        </div>
      </div>
    </section>

    <!-- Sectors / Use Cases -->
    <section class="section page-width">
      <div class="section-heading">
        <span>APLICACIONES CORPORATIVAS</span>
        <h2>Adaptado a las exigencias de tu industria</h2>
      </div>

      <div class="sectors-grid">
        <div v-for="sector in sectors" :key="sector.title" class="sector-card panel">
          <div class="sector-badge">Solución Personalizada</div>
          <h3>{{ sector.title }}</h3>
          <p>{{ sector.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Bottom Corporate CTA -->
    <section id="contacto" class="page-width" style="padding-bottom: 110px;">
      <div class="cta-section">
        <span>IMPLEMENTACIÓN RÁPIDA · SOPORTE TÉCNICO DEDICADO</span>
        <h2>Transformá el ambiente de tu empresa en una ventaja competitiva.</h2>
        <p style="max-width: 620px; margin: 15px auto 35px; color: #d5e9ea; font-size: 1.1rem; line-height: 1.5;">
          Agendá una reunión con nuestros asesores comerciales para dimensionar la cantidad de dispositivos óptima para tus instalaciones.
        </p>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          <button type="button" class="button light" style="font-weight: 800;" @click="showQuote = true">
            Solicitar Presupuesto Formal
          </button>
          <RouterLink to="/documentacion/" class="button" style="border: 1px solid rgba(255,255,255,.4); color: white;">
            Ver Funcionamiento
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Quote Modal -->
    <QuoteModal :show="showQuote" @close="showQuote = false" />
  </div>
</template>

<style scoped>
.product-video-hero {
  display: grid;
  position: relative;
  isolation: isolate;
  width: 100%;
  background: var(--c-ice);
}
/* A continuous veil keeps the copy readable without a separate text panel. */
.product-video-hero::after {
  content: '';
  grid-area: 1 / 1;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg,
    rgba(235, 244, 246, .96) 0%,
    rgba(235, 244, 246, .88) 26%,
    rgba(235, 244, 246, .45) 45%,
    rgba(235, 244, 246, .12) 60%,
    rgba(235, 244, 246, 0) 72%);
}
.product-hero-copy {
  grid-area: 1 / 1;
  align-self: start;
  z-index: 2;
  width: 100%;
  padding: clamp(112px, 14svh, 152px) var(--page-gutter, 16px) 32px;
  text-align: center;
}
.product-hero-copy h1 {
  max-width: 18ch;
  margin: 0 auto;
  color: var(--c-navy);
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5.6vw, 5rem);
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -.045em;
  text-wrap: balance;
}
.product-hero-copy p {
  max-width: 48ch;
  margin: clamp(18px, 2vw, 26px) auto 0;
  color: var(--c-navy);
  font-size: clamp(1rem, 1.65vw, 1.375rem);
  font-weight: 400;
  line-height: 1.5;
  text-wrap: pretty;
}
.hero-learn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 24px;
  padding: 11px 24px;
  border: 1px solid var(--c-navy);
  border-radius: 999px;
  background: var(--c-navy);
  color: var(--c-ice);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  transition: background-color .2s ease, border-color .2s ease;
}
.hero-learn-more:focus-visible {
  outline: 3px solid var(--c-navy);
  outline-offset: 4px;
}
@media (hover: hover) {
  .hero-learn-more:hover { background: var(--c-black); border-color: var(--c-black); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-learn-more { transition: none; }
}
.product-hero-video {
  grid-area: 1 / 1;
  display: block;
  width: 100%;
  height: 100%;
  min-height: clamp(640px, 100svh, 960px);
  object-fit: cover;
  object-position: center;
}
@media (max-width: 560px) {
  .product-hero-copy { padding-top: 104px; }
  .product-hero-copy h1 { max-width: 16ch; font-size: clamp(2.25rem, 9vw, 3rem); }
  .product-hero-copy p { max-width: 33ch; }
  .product-hero-video { min-height: clamp(620px, 100svh, 800px); }
}
@media (max-height: 500px) and (min-width: 561px) {
  .product-hero-copy { padding-top: 104px; }
  .product-hero-copy h1 { font-size: 3rem; }
  .product-hero-video { min-height: 600px; }
}
</style>
