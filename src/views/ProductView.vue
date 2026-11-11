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
        <h1 id="product-hero-title">Hacemos visible lo invisible.</h1>
        <p>AirSense monitorea las condiciones ambientales para acercarte información que antes pasaba desapercibida.</p>
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
