<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const spaces = [
  { label: 'Hogar', image: 'Living Demo', title: 'Bienestar que empieza en casa.', description: 'Conocé las condiciones ambientales de los espacios donde compartís tus días.', alt: 'Dos personas en un living luminoso, con AirSense sobre la mesa lateral y una tablet con el dashboard.', position: '65% center' },
  { label: 'Dormitorio', image: 'Bedroom Demo', title: 'Un ambiente para descansar mejor.', description: 'Observá la temperatura, la humedad y el ruido del entorno donde descansás.', alt: 'Una persona consulta una tablet sentada en la cama, junto al dispositivo AirSense en la mesa de luz.', position: '65% center' },
  { label: 'Oficina', image: 'Office Demo', title: 'Espacios que acompañan tu concentración.', description: 'Monitoreá las condiciones de tu lugar de trabajo y reconocé cambios que pueden afectar el confort.', alt: 'Un equipo trabaja en una oficina luminosa con AirSense junto a un monitor que muestra las condiciones ambientales.', position: '55% center' },
  { label: 'Educación', image: 'School Demo', title: 'Entornos de aprendizaje más conscientes.', description: 'Acercá información ambiental a los espacios donde enseñamos y aprendemos.', alt: 'Una docente consulta el dashboard en su computadora, con AirSense sobre el escritorio y estudiantes en el aula.', position: '65% center' },
  { label: 'Escritorio', image: 'Desk Demo', title: 'Tu espacio. Tus condiciones.', description: 'Tené una visión más clara del entorno donde estudiás, trabajás o creás.', alt: 'Una persona trabaja en su escritorio con el dashboard en un monitor y AirSense a su lado.', position: '60% center' },
]

const activeIndex = ref(0)
const active = computed(() => spaces[activeIndex.value])
const section = ref(null)
const buttons = ref([])
const loadError = ref('')
const sizes = '(max-width: 767px) calc(100vw - 32px), (max-width: 1248px) calc(100vw - 64px), 1180px'
let selectionRequest = 0
let observer
let disposed = false
const imageLoads = new Map()

function source(space, width) {
  return `/assets/spaces/${encodeURIComponent(space.image)}-${width}.webp`
}
function sources(space) {
  return `${source(space, 768)} 768w, ${source(space, 1440)} 1440w`
}
function prepareImage(index) {
  if (!imageLoads.has(index)) {
    const space = spaces[index]
    const photo = new Image()
    const loaded = new Promise((resolve, reject) => {
      photo.onload = () => resolve(photo)
      photo.onerror = () => { imageLoads.delete(index); reject(new Error('image-load')) }
    })
    imageLoads.set(index, loaded)
    photo.sizes = sizes
    photo.srcset = sources(space)
    photo.src = source(space, 1440)
  }
  return imageLoads.get(index)
}
function preloadNext() {
  if (!navigator.connection?.saveData) {
    prepareImage((activeIndex.value + 1) % spaces.length).catch(() => {})
  }
}
async function selectSpace(index) {
  const request = ++selectionRequest
  loadError.value = ''
  if (index === activeIndex.value) return
  try {
    const photo = await prepareImage(index)
    await photo.decode?.().catch(() => {})
    if (disposed || request !== selectionRequest) return
    activeIndex.value = index
    preloadNext()
  } catch {
    if (!disposed && request === selectionRequest) loadError.value = 'La fotografía no pudo cargarse. Volvé a seleccionar el espacio para reintentar.'
  }
}
async function onKeydown(event, index) {
  const next = { ArrowRight: (index + 1) % spaces.length, ArrowLeft: (index + spaces.length - 1) % spaces.length, Home: 0, End: spaces.length - 1 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  await nextTick()
  buttons.value[next]?.focus({ preventScroll: true })
  buttons.value[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
onMounted(() => {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      preloadNext()
      observer.disconnect()
    }, { rootMargin: '200px' })
    observer.observe(section.value)
  } else preloadNext()
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
})
</script>

<template>
  <section ref="section" class="spaces-experience" aria-labelledby="spaces-heading">
    <div class="spaces-inner">
      <h2 id="spaces-heading">Diseñado para los<br class="desktop-break" /> espacios que importan.</h2>

      <div id="space-experience" class="space-photo" :aria-label="active.label">
        <Transition name="space-fade">
          <img :key="active.image" :src="source(active, 1440)" :srcset="sources(active)" :sizes="sizes" :alt="active.alt" :style="{ objectPosition: active.position }" width="1376" height="768" loading="lazy" decoding="async" />
        </Transition>
      </div>

      <div class="space-selector-scroll">
        <div class="space-selector" role="group" aria-label="Elegí un espacio para descubrir AirSense">
          <button v-for="(space, index) in spaces" :key="space.label" :ref="el => buttons[index] = el" type="button" :aria-pressed="activeIndex === index" aria-controls="space-experience space-description" @click="selectSpace(index)" @keydown="onKeydown($event, index)">{{ space.label }}</button>
        </div>
      </div>

      <div id="space-description" class="space-description" aria-live="polite" aria-atomic="true">
        <h3>{{ active.title }}</h3>
        <p>{{ active.description }}</p>
      </div>
      <p v-if="loadError" class="space-error" role="status">{{ loadError }}</p>
    </div>
  </section>
</template>

<style scoped>
.spaces-experience { background: var(--ice-soft, #f4fafb); color: var(--c-navy); padding-block: clamp(80px, 9vw, 136px); }
.spaces-inner { width: min(1180px, calc(100% - 64px)); margin-inline: auto; }
.spaces-experience h2 { margin: 0 0 clamp(36px, 5vw, 64px); text-align: center; font-family: var(--font-display); font-size: clamp(2.25rem, 4.8vw, 4.25rem); font-weight: 600; line-height: 1.08; letter-spacing: -.045em; color: var(--c-navy); text-wrap: balance; }
.space-photo { position: relative; isolation: isolate; overflow: hidden; aspect-ratio: 1376 / 768; border-radius: 24px; background: var(--mist-soft, #cfe3e4); }
.space-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.space-fade-enter-active, .space-fade-leave-active { transition: opacity 320ms ease; }
.space-fade-enter-active { z-index: 1; }
.space-fade-enter-from, .space-fade-leave-to { opacity: 0; }
.space-selector-scroll { overflow-x: auto; max-width: 100%; padding: 8px 5px; margin-top: clamp(24px, 3vw, 36px); scrollbar-width: thin; scrollbar-color: var(--c-mist) transparent; }
.space-selector { display: flex; width: max-content; margin-inline: auto; gap: 4px; padding: 6px; border-radius: 999px; background: var(--glass-surface); border: 1px solid var(--glass-edge); box-shadow: var(--glass-shadow); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); }
.space-selector button { min-height: 44px; padding: 10px 24px; border: 0; border-radius: 999px; background: transparent; color: var(--muted, #4f7480); font-size: 15px; font-weight: 600; white-space: nowrap; transition: background-color 250ms ease, color 250ms ease; }
.space-selector button[aria-pressed='true'] { background: linear-gradient(145deg, #17677b, var(--c-navy)); color: #fff; box-shadow: inset 0 1px 1px rgba(255,255,255,.35), 0 3px 10px rgba(10,76,96,.18); }
.space-selector button:focus-visible { outline: 3px solid var(--c-teal); outline-offset: 3px; }
.space-description { min-height: 132px; max-width: 650px; margin: 30px auto 0; text-align: center; }
.space-description h3 { margin: 0 0 12px; font-family: var(--font-display); font-size: clamp(1.4rem, 2.4vw, 1.9rem); font-weight: 600; letter-spacing: -.025em; line-height: 1.2; color: var(--c-navy); }
.space-description p { margin: 0; font-size: clamp(1rem, 1.5vw, 1.125rem); line-height: 1.6; color: var(--muted, #4f7480); text-wrap: pretty; }
.space-error { text-align: center; color: var(--c-navy); }
@media (hover: hover) { .space-selector button:not([aria-pressed='true']):hover { color: var(--c-navy); background: var(--glass-hover); } }
@media (max-width: 767px) {
  .spaces-inner { width: calc(100% - 32px); }
  .spaces-experience h2 { font-size: clamp(2rem, 7.4vw, 3rem); padding-inline: 8px; }
  .space-photo { border-radius: 20px; aspect-ratio: 4 / 3; }
  .space-selector button { padding-inline: 20px; }
  .space-description { min-height: 170px; margin-top: 24px; padding-inline: 10px; }
  .desktop-break { display: none; }
}
@media (prefers-reduced-motion: reduce) { .space-fade-enter-active, .space-fade-leave-active, .space-selector button { transition: none; } }
</style>
