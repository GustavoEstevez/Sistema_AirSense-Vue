<script setup>
import { computed, onMounted, ref } from 'vue'

const activeFeature = ref(null)
const features = [
  { id: 'screen', title: 'La información, a simple vista.', description: 'Consultá las lecturas ambientales directamente en la pantalla del dispositivo, sin abrir una aplicación.' },
  { id: 'temperature', title: 'Temperatura y humedad.', description: 'Conocé las condiciones que influyen en el confort de tus espacios durante el día.' },
  { id: 'air', title: 'Una mirada al aire que respirás.', description: 'El sensor de calidad del aire registra cambios en el ambiente para ayudarte a entender qué ocurre a tu alrededor.' },
  { id: 'sound', title: 'El ruido también cuenta.', description: 'Monitoreá el nivel sonoro del entorno y descubrí cómo cambia a lo largo de la jornada.' },
  { id: 'connection', title: 'Conectado con tu espacio.', description: 'La conexión Wi-Fi lleva las lecturas al dashboard de AirSense para que puedas consultarlas desde la web.' },
]

const featureImages = {
  connection: { src: '/assets/airsense-connected-dashboard.jpg', alt: 'AirSense junto a una notebook que muestra el dashboard de monitoreo ambiental, sobre un escritorio iluminado por luz natural.', width: 1376, height: 768 },
  sound: { src: '/assets/airsense-noise.png', alt: 'AirSense en una oficina compartida, con personas desenfocadas al fondo y ondas turquesa que representan el sonido ambiental.', width: 1672, height: 941 },
  air: { src: '/assets/airsense-air-quality.jpg', alt: 'AirSense sobre una mesa en una sala luminosa, con ondas turquesa que representan la circulación del aire.', width: 1376, height: 768 },
  screen: { src: '/assets/airsense-display-close-up.jpg', alt: 'Primer plano de la pantalla de AirSense mostrando las lecturas de temperatura, humedad, ruido y aire.', width: 1376, height: 768 },
  temperature: { src: '/assets/airsense-temperature-humidity.jpg', alt: 'AirSense sobre un escritorio de madera junto a plantas y una ventana iluminada por luz natural.', width: 1376, height: 768 },
}
const hasPhotoBackground = computed(() => Boolean(featureImages[activeFeature.value]))
const deviceImage = computed(() => featureImages[activeFeature.value]
  ?? { src: '/assets/airsense-device-detail.png', alt: 'Dispositivo AirSense blanco con pantalla de lecturas ambientales y sensores integrados.', width: 901, height: 998 })

onMounted(() => {
  // Warm the image cache so crossfades do not wait for a network request.
  if (navigator.connection?.saveData) return
  Object.values(featureImages).forEach(({ src }) => {
    const image = new Image()
    image.src = src
    image.decode?.().catch(() => {})
  })
})

function changeFeature(direction) {
  const index = features.findIndex(feature => feature.id === activeFeature.value)
  const next = index < 0 ? (direction > 0 ? 0 : features.length - 1) : (index + direction + features.length) % features.length
  activeFeature.value = features[next].id
}
</script>

<template>
  <section class="device-detail" aria-labelledby="device-detail-heading">
    <div class="device-detail-inner">
      <p class="device-detail-eyebrow">CONOCÉ AIRSENSE</p>
      <h2 id="device-detail-heading">Todo tu entorno. En un solo dispositivo.</h2>
      <div class="device-detail-stage" :class="{ 'has-photo-background': hasPhotoBackground }">
        <div class="device-detail-features">
          <div class="device-feature-switcher">
            <div class="device-feature-navigation" role="group" aria-label="Recorrer características">
              <button type="button" aria-label="Característica anterior" aria-controls="device-feature-list" @click="changeFeature(-1)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
              </button>
              <button type="button" aria-label="Característica siguiente" aria-controls="device-feature-list" @click="changeFeature(1)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
              </button>
            </div>
            <div id="device-feature-list" class="device-feature-list">
              <div v-for="feature in features" :key="feature.id" class="device-feature" :class="{ 'is-open': activeFeature === feature.id }">
                <button type="button" class="device-feature-heading" :id="'feature-heading-' + feature.id" :aria-expanded="activeFeature === feature.id" :aria-controls="'feature-body-' + feature.id" @click="activeFeature = activeFeature === feature.id ? null : feature.id">
                  <span class="feature-plus" aria-hidden="true"></span>{{ feature.title }}
                </button>
                <div class="device-feature-body" :id="'feature-body-' + feature.id" :aria-hidden="activeFeature !== feature.id" role="region" :aria-labelledby="'feature-heading-' + feature.id">
                  <div class="device-feature-body-inner"><p>{{ feature.description }}</p></div>
                </div>
              </div>
            </div>
          </div>
          <RouterLink to="/hardware/" class="device-spec-link">Ver todas las características <span aria-hidden="true">↗</span></RouterLink>
        </div>
        <div class="device-detail-image">
          <Transition name="device-photo">
            <img :key="deviceImage.src" :src="deviceImage.src" :alt="deviceImage.alt" :width="deviceImage.width" :height="deviceImage.height" :class="{ 'is-close-up': hasPhotoBackground }" decoding="async" />
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.device-detail { padding: clamp(72px, 9vw, 128px) 0; background: var(--c-ice); color: var(--c-navy); }
.device-detail-inner { width: min(1376px, calc(100% - 48px)); margin-inline: auto; }
.device-detail-eyebrow { margin: 0 0 18px; color: var(--teal-deep); font-size: .75rem; font-weight: 600; letter-spacing: .17em; }
.device-detail h2 { margin: 0 0 clamp(32px, 4vw, 56px); font-family: var(--font-display); font-size: clamp(2.3rem, 4.8vw, 4.5rem); font-weight: 600; letter-spacing: -.045em; line-height: 1.08; }
.device-detail-stage { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; justify-items: center; aspect-ratio: 16 / 9; min-height: 640px; gap: clamp(24px, 4vw, 56px); padding: clamp(24px, 3vw, 44px); border-radius: 32px; position: relative; isolation: isolate; border: 1px solid rgba(255,255,255,.85); background: linear-gradient(135deg, rgba(255,255,255,.72), rgba(235,248,252,.4)); box-shadow: inset 0 1px 1px rgba(255,255,255,.95), inset 0 -1px 1px rgba(255,255,255,.6), 0 24px 64px rgba(10,76,96,.1); -webkit-backdrop-filter: blur(24px) saturate(1.5); backdrop-filter: blur(24px) saturate(1.5); overflow: hidden; }
.device-detail-features { position: relative; z-index: 1; justify-self: start; width: 100%; max-width: 400px; text-align: center; }
.device-detail-hint { max-width: 32ch; margin: 0 auto 20px; color: var(--muted); font-size: 1.05rem; line-height: 1.5; }
.device-feature { width: fit-content; max-width: 100%; margin-bottom: 12px; border: 1px solid var(--glass-edge); border-radius: 27px; background: var(--glass-surface); box-shadow: var(--glass-shadow); transition: background-color .25s ease, box-shadow .25s ease, transform .25s ease; -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4); }
.device-feature-heading { width: 100%; border: 0; background: transparent; border-radius: 27px; display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 54px; padding: 14px 20px 14px 16px; text-align: center; color: inherit; cursor: pointer; font-size: .95rem; font-weight: 600; line-height: 1.4; }

.feature-plus { position: relative; flex: 0 0 20px; height: 20px; border: 1px solid rgba(8,131,149,.4); color: var(--c-teal); background: rgba(255,255,255,.45); box-shadow: inset 0 1px 0 rgba(255,255,255,.8); border-radius: 50%; }
.feature-plus::before, .feature-plus::after { content: ''; position: absolute; top: 8px; left: 4px; width: 10px; height: 1px; background: currentColor; }
.feature-plus::after { transform: rotate(90deg); transition: transform .2s ease; }
.device-feature.is-open .feature-plus::after { transform: rotate(0); }
.device-feature.is-open { background-color: rgba(122,178,178,.24); border-color: rgba(8,131,149,.28); }
.device-feature-switcher { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; align-items: center; }
.device-feature-list { min-width: 0; min-height: 440px; display: flex; flex-direction: column; justify-content: center; }
.device-feature-navigation { display: flex; flex-direction: column; gap: 8px; }
.device-feature-navigation button { display: grid; place-items: center; width: 44px; height: 44px; padding: 10px; border: 1px solid var(--glass-edge); border-radius: 50%; background: var(--glass-surface); box-shadow: var(--glass-shadow); color: var(--c-navy); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); }
.device-feature-navigation svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.device-feature-navigation button:focus-visible { outline: 3px solid var(--c-teal); outline-offset: 3px; }
@media (hover: hover) { .device-feature-navigation button:hover { background: var(--glass-hover); color: var(--c-teal); } }
.device-spec-link { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; margin-top: 12px; color: var(--teal-deep); font-size: .9rem; }
.device-detail-image { position: relative; width: 100%; display: grid; place-items: center; isolation: isolate; overflow: hidden; }
.device-detail-image img { grid-area: 1 / 1; transform-origin: 68% 50%; }
.device-detail-image img { display: block; width: 100%; max-width: 500px; height: clamp(380px, 39vw, 590px); object-fit: contain; margin: auto; filter: drop-shadow(3px 5px 4px rgba(0,0,0,.14)); }
.device-feature-heading:focus-visible, .device-spec-link:focus-visible { outline: 3px solid var(--c-teal); outline-offset: 4px; border-radius: 26px; }
@media (hover: hover) { .device-feature:hover { background-color: rgba(255,255,255,.38); box-shadow: inset 0 1px 1px #fff, 0 10px 26px rgba(10,76,96,.12); transform: translateY(-2px); } .device-feature:hover { color: var(--teal-deep); } .device-spec-link:hover { text-decoration: underline; text-underline-offset: 4px; } }
@media (max-width: 760px) {
  .device-detail-inner { width: calc(100% - 32px); }
  .device-detail-stage { grid-template-columns: 1fr; aspect-ratio: auto; min-height: 0; padding: 28px 22px; border-radius: 24px; }
  .device-detail-image { grid-row: 1; }
  .device-detail-image img { width: min(100%, 360px); height: auto; }
  .device-detail-features { max-width: 100%; }
  .device-feature-list { min-height: 540px; }
  .device-detail-hint { max-width: 100%; }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .device-feature { background: var(--ice-soft); } .device-detail-stage { background: var(--ice-tint); } }
@media (prefers-reduced-transparency: reduce) { .device-feature, .device-detail-stage { background: var(--ice-soft); -webkit-backdrop-filter: none; backdrop-filter: none; } }
@media (prefers-reduced-motion: reduce) { .feature-plus::after, .device-feature { transition: none; } .device-feature:hover { transform: none; } }
.device-feature { display: block; width: 100%; }
.device-feature-body { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .4s cubic-bezier(.22,1,.36,1), opacity .3s ease; }
.device-feature-body-inner { overflow: hidden; min-height: 0; }
.device-feature-body p { margin: 0; padding: 0 20px 20px; text-align: center; color: var(--muted); font-size: .9rem; line-height: 1.65; }
.device-feature.is-open .device-feature-body { grid-template-rows: 1fr; opacity: 1; }
@media (prefers-reduced-motion: reduce) { .device-feature-body { transition: none; } }
.device-detail-image { min-height: clamp(380px, 39vw, 590px); }
.device-detail-image img.is-close-up { border-radius: 24px; filter: none; }
.device-detail-stage { padding-inline: clamp(16px, 1.8vw, 28px); }
.device-detail-stage.has-photo-background .device-detail-image { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; min-height: 0; }
.device-detail-stage.has-photo-background .device-detail-image img { width: 100%; max-width: none; height: 100%; object-fit: cover; object-position: 70% center; border-radius: 0; }
.has-photo-background :is(.device-feature, .device-detail-hint, .device-spec-link, .device-feature-navigation button) {
  background: linear-gradient(135deg, rgba(235,248,252,.38), rgba(255,255,255,.18));
  border: 1px solid rgba(255,255,255,.65);
  box-shadow: inset 0 1px 1px rgba(255,255,255,.9), inset 0 -1px 1px rgba(255,255,255,.3), 0 6px 20px rgba(10,76,96,.12);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  backdrop-filter: blur(20px) saturate(1.5);
  color: var(--navy-deep);
}
.has-photo-background .device-detail-hint { padding: 12px 18px; border-radius: 22px; }
.has-photo-background .device-spec-link { padding: 10px 18px; border-radius: 999px; }
.has-photo-background .device-feature-body p { color: var(--navy-deep); }
.has-photo-background .device-feature.is-open { background-color: rgba(235,248,252,.24); }
.device-photo-enter-active, .device-photo-leave-active { transition: opacity .65s cubic-bezier(.22, 1, .36, 1), transform .65s cubic-bezier(.22, 1, .36, 1); will-change: opacity, transform; }
.device-photo-enter-active { z-index: 1; }
.device-photo-leave-active { z-index: 0; pointer-events: none; }
.device-photo-enter-from { opacity: 0; transform: scale(1.025); }
.device-photo-enter-to { opacity: 1; transform: scale(1) translateX(0); }
.device-photo-leave-to { opacity: 0; transform: scale(1.01); }
@media (max-width: 760px) {
  .device-detail-image { height: 400px; min-height: 0; }
  .device-detail-image img { height: 100%; object-fit: contain; }
  .device-detail-features { justify-self: center; max-width: 100%; }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .has-photo-background :is(.device-feature, .device-detail-hint, .device-spec-link, .device-feature-navigation button) { background: var(--ice-soft); }
}
@media (prefers-reduced-transparency: reduce) {
  .has-photo-background :is(.device-feature, .device-detail-hint, .device-spec-link, .device-feature-navigation button) { background: var(--ice-soft); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@media (prefers-reduced-motion: reduce) {
  .device-photo-enter-active, .device-photo-leave-active { transition: none; }
  .device-photo-enter-from, .device-photo-enter-to, .device-photo-leave-to { transform: none; }
}
</style>
