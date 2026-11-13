<script setup>
import NoiseInsightSection from '../components/NoiseInsightSection.vue'
import EnvironmentalProblemsSection from '../components/EnvironmentalProblemsSection.vue'
import SpacesExperienceSection from '../components/SpacesExperienceSection.vue'
import DeviceDetailSection from '../components/DeviceDetailSection.vue'

</script>

<template>
  <div class="product-page">
    <section id="producto" class="product-video-hero" aria-labelledby="product-hero-title">
      <div class="product-hero-copy page-width">
        <h1 id="product-hero-title" data-entrance>Hacemos visible lo invisible.</h1>
        <p data-entrance="80">AirSense monitorea las condiciones ambientales para acercarte información que antes pasaba desapercibida.</p>
        <a class="product-hero-button" href="#device-detail-heading" data-entrance="160">Descubrí AirSense</a>
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
    <DeviceDetailSection />
    <NoiseInsightSection />

    <SpacesExperienceSection />

    <section class="instagram-cta" aria-labelledby="instagram-cta-title">
      <div class="instagram-cta-inner">
        <p class="instagram-cta-eyebrow" data-entrance>AIRSENSE EN INSTAGRAM</p>
        <h2 id="instagram-cta-title" data-entrance="60">Lo que viene.<br /><span>Seguilo de cerca.</span></h2>
        <p class="instagram-cta-copy" data-entrance="100">El proyecto sigue creciendo. Descubrí nuestros avances, las nuevas pruebas y lo que estamos preparando. Acompañá a AirSense en cada próximo paso.</p>
        <a class="instagram-cta-button" data-entrance="160" href="https://www.instagram.com/airsense.ar/" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
          Seguí a @airsense.ar
          <span aria-hidden="true">↗</span>
          <span class="instagram-cta-sr-only"> (se abre en otra pestaña)</span>
        </a>
      </div>
    </section>

  </div>
</template>

<style scoped>
.instagram-cta { padding: clamp(88px, 11vw, 160px) 24px; background: linear-gradient(180deg, var(--ice-soft), var(--c-ice)); color: var(--c-navy); text-align: center; }
.instagram-cta-inner { max-width: 900px; margin-inline: auto; }
.instagram-cta-eyebrow { margin: 0 0 24px; color: var(--teal-deep); font-size: .75rem; font-weight: 600; letter-spacing: .17em; }
.instagram-cta h2 { margin: 0; font-family: var(--font-display); font-size: clamp(2.5rem, 6vw, 5.5rem); font-weight: 600; line-height: 1.06; letter-spacing: -.045em; text-wrap: balance; }
.instagram-cta h2 span { color: var(--c-teal); }
.instagram-cta-copy { max-width: 48ch; margin: 28px auto 32px; color: var(--muted); font-size: clamp(1rem, 1.7vw, 1.25rem); line-height: 1.65; text-wrap: pretty; }
.instagram-cta-button { display: inline-flex; align-items: center; justify-content: center; gap: 12px; min-height: 52px; padding: 14px 24px; border-radius: 999px; background: var(--c-navy); color: var(--white); font-size: 1rem; font-weight: 500; transition: background-color .2s ease; }
.instagram-cta-button svg { width: 22px; height: 22px; flex-shrink: 0; }
.instagram-cta-button:focus-visible { outline: 3px solid var(--c-teal); outline-offset: 5px; }
.instagram-cta-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (hover: hover) { .instagram-cta-button:hover { background: var(--teal-deep); } }
@media (prefers-reduced-motion: reduce) { .instagram-cta-button { transition: none; } }
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
.product-hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 28px;
  padding: 13px 26px;
  border-radius: 999px;
  background: var(--c-navy);
  color: var(--white);
  font-size: 1rem;
  font-weight: 500;
  transition: background-color .2s ease;
}
.product-hero-button:focus-visible { outline: 3px solid var(--c-teal); outline-offset: 5px; }
@media (hover: hover) { .product-hero-button:hover { background: var(--teal-deep); } }
@media (prefers-reduced-motion: reduce) { .product-hero-button { transition: none; } }
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
