<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const section = ref(null)
const animated = ref(false)
const carousel = ref(null)
const activeSlide = ref(0)
const isPlaying = ref(true)
const slideDuration = 5500
const transitionDuration = 800
const playbackProgress = ref(0)
let autoplayTimer
let elapsedPlayback = 0
let playbackStarted = null
let visibilityObserver
let carouselVisible = false
let observer
let motionQuery
let resizeObserver
let scrollFrame = 0
let travelFrame = 0
let transitioning = false
let settleTimer

function stopClock() {
  cancelAnimationFrame(autoplayTimer)
  if (playbackStarted !== null) elapsedPlayback += performance.now() - playbackStarted
  playbackStarted = null
  playbackProgress.value = Math.min(elapsedPlayback / slideDuration, 1)
}

function scheduleAdvance(reset = false) {
  stopClock()
  if (reset === true) {
    elapsedPlayback = 0
    playbackProgress.value = 0
  }
  if (!isPlaying.value || !carouselVisible || document.hidden || transitioning) return
  playbackStarted = performance.now()
  function tick(now) {
    const elapsed = elapsedPlayback + now - playbackStarted
    playbackProgress.value = Math.min(elapsed / slideDuration, 1)
    if (elapsed >= slideDuration) {
      goToSlide((activeSlide.value + 1) % problems.length)
      return
    }
    autoplayTimer = requestAnimationFrame(tick)
  }
  autoplayTimer = requestAnimationFrame(tick)
}

function pausePlayback() {
  isPlaying.value = false
  stopClock()
  cancelAnimationFrame(travelFrame)
  transitioning = false
  if (carousel.value) carousel.value.style.scrollSnapType = ''
}

function togglePlayback() {
  isPlaying.value = !isPlaying.value
  scheduleAdvance()
}

function onCarouselFocus(event) {
  if (!event.target.closest('[data-playback]')) pausePlayback()
}

function slidePosition(index) {
  const track = carousel.value
  const card = track?.children[index]
  return card ? card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2 : 0
}

function goToSlide(index, immediate = false) {
  const track = carousel.value
  if (!track) return
  const target = Math.max(0, Math.min(index, problems.length - 1))
  cancelAnimationFrame(travelFrame)
  clearTimeout(settleTimer)
  stopClock()
  const start = track.scrollLeft
  const end = slidePosition(target)
  if (immediate || motionQuery?.matches || Math.abs(end - start) < 1) {
    transitioning = false
    track.style.scrollSnapType = ''
    track.scrollTo({ left: end, behavior: 'instant' })
    activeSlide.value = target
    scheduleAdvance(true)
    return
  }
  transitioning = true
  track.style.scrollSnapType = 'none'
  playbackProgress.value = 0
  const started = performance.now()
  function move(now) {
    const progress = Math.min((now - started) / transitionDuration, 1)
    const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
    track.scrollTo({ left: start + (end - start) * eased, behavior: 'instant' })
    if (progress < 1) {
      travelFrame = requestAnimationFrame(move)
    } else {
      transitioning = false
      track.style.scrollSnapType = ''
      activeSlide.value = target
      scheduleAdvance(true)
    }
  }
  travelFrame = requestAnimationFrame(move)
}

function syncSlide() {
  if (!transitioning) {
    stopClock()
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => scheduleAdvance(true), 160)
  }
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    const track = carousel.value
    if (!track) return
    let nearest = 0
    let distance = Infinity
    problems.forEach((_, index) => {
      const delta = Math.abs(track.scrollLeft - slidePosition(index))
      if (delta < distance) { distance = delta; nearest = index }
    })
    activeSlide.value = nearest
  })
}

function onCarouselKeydown(event) {
  if (event.target !== event.currentTarget) return
  const target = { ArrowLeft: activeSlide.value - 1, ArrowRight: activeSlide.value + 1, Home: 0, End: problems.length - 1 }[event.key]
  if (target === undefined) return
  event.preventDefault()
  goToSlide(target)
}

const problems = [
  {
    image: 'problema-ruido',
    alt: 'Una persona intenta concentrarse mientras otras conversan en un espacio de trabajo compartido.',
    title: 'El ruido que nos rodea.',
    description: 'No siempre notamos cuánto puede afectar nuestra concentración y bienestar.',
  },
  {
    image: 'problema-temperatura',
    alt: 'Una persona hace una pausa en un interior moderno iluminado por el sol intenso de la tarde.',
    title: 'El confort que perdemos.',
    description: 'La temperatura de un espacio puede cambiar cómo nos sentimos y realizamos nuestras actividades.',
  },
  {
    image: 'problema-humedad',
    alt: 'Gotas de condensación sobre una ventana de un ambiente contemporáneo.',
    title: 'El equilibrio invisible.',
    description: 'La humedad influye en el confort y las condiciones de los espacios que habitamos.',
  },
  {
    image: 'problema-aire',
    alt: 'Un haz de luz natural revela partículas suspendidas en un interior moderno.',
    title: 'El aire que compartimos.',
    description: 'No todos los cambios en las condiciones del aire pueden percibirse a simple vista.',
  },
]

function revealAll() {
  animated.value = false
  observer?.disconnect()
}
function onMotionChange(event) {
  if (event.matches) {
    revealAll()
  }
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionQuery.addEventListener('change', onMotionChange)
  isPlaying.value = true
  document.addEventListener('visibilitychange', scheduleAdvance)
  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      carouselVisible = entry.isIntersecting
      scheduleAdvance()
    }, { threshold: .35 })
    visibilityObserver.observe(carousel.value)
  } else {
    carouselVisible = true
    scheduleAdvance()
  }
  resizeObserver = new ResizeObserver(() => {
    goToSlide(activeSlide.value, true)
  })
  resizeObserver.observe(carousel.value)
  if (motionQuery.matches || !('IntersectionObserver' in window)) return
  animated.value = true
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    }
  }, { threshold: .12 })
  section.value.querySelectorAll('[data-reveal], [data-reveal-controls]').forEach(element => observer.observe(element))
})
onBeforeUnmount(() => {
  observer?.disconnect()
  visibilityObserver?.disconnect()
  cancelAnimationFrame(autoplayTimer)
  document.removeEventListener('visibilitychange', scheduleAdvance)
  resizeObserver?.disconnect()
  cancelAnimationFrame(scrollFrame)
  cancelAnimationFrame(travelFrame)
  clearTimeout(settleTimer)
  motionQuery?.removeEventListener('change', onMotionChange)
})
</script>

<template>
  <section ref="section" class="environment-stories" :class="{ 'has-motion': animated }" aria-labelledby="environment-stories-title">
    <div class="stories-content">
      <div class="stories-intro" data-reveal>
        <p class="stories-eyebrow">EL ENTORNO IMPORTA</p>
        <h2 id="environment-stories-title">Nuestro entorno influye más de lo que imaginamos.</h2>
        <p class="stories-description">El ruido, la temperatura, la humedad y las condiciones del aire forman parte de nuestra vida cotidiana. Aunque no siempre percibimos sus cambios, pueden influir en nuestro confort, concentración y bienestar.</p>
      </div>

    </div>

      <div ref="carousel" id="environment-carousel" class="stories-carousel" role="region" aria-roledescription="carrusel" aria-label="Problemáticas ambientales" tabindex="0" @scroll.passive="syncSlide" @keydown="onCarouselKeydown" @pointerdown="pausePlayback" @wheel.passive="pausePlayback" @focusin="pausePlayback">
        <article v-for="(problem, index) in problems" :key="problem.image" class="environment-story" data-reveal role="group" aria-roledescription="diapositiva" :aria-label="`${index + 1} de ${problems.length}: ${problem.title}`">
          <img :src="`/assets/environment/${problem.image}.webp`" :srcset="`/assets/environment/${problem.image}-640.webp 640w, /assets/environment/${problem.image}.webp 1200w`" sizes="(max-width: 700px) 86vw, (max-width: 1256px) 78vw, 980px" :alt="problem.alt" width="1200" height="900" loading="lazy" decoding="async" />
          <div class="story-copy">
            <h3 :id="`story-title-${index}`">{{ problem.title }}</h3>
            <p>{{ problem.description }}</p>
          </div>
        </article>
      </div>

    <div class="stories-content">
      <div class="carousel-controls" data-reveal-controls @focusin="onCarouselFocus">
        <div class="carousel-dots" role="group" aria-label="Elegir problemática">
          <button v-for="(problem, index) in problems" :key="problem.image" type="button" :class="{ 'is-active': activeSlide === index }" :aria-label="`Ver ${problem.title}`" :aria-current="activeSlide === index ? 'true' : undefined" aria-controls="environment-carousel" @click="goToSlide(index)"><span class="indicator-track" aria-hidden="true"><span v-if="activeSlide === index" class="indicator-progress" :style="{ transform: `scaleX(${playbackProgress})` }"></span></span></button>
        </div>
        <div class="carousel-arrows">
          <button type="button" class="carousel-playback" data-playback :aria-label="isPlaying ? 'Pausar carrusel' : 'Reproducir carrusel'" :title="isPlaying ? 'Pausar carrusel' : 'Reproducir carrusel'" aria-controls="environment-carousel" @click="togglePlayback">
            <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z" /></svg>
          </button>
          <button type="button" aria-label="Problemática anterior" aria-controls="environment-carousel" :disabled="activeSlide === 0" @click="goToSlide(activeSlide - 1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
          <button type="button" aria-label="Problemática siguiente" aria-controls="environment-carousel" :disabled="activeSlide === problems.length - 1" @click="goToSlide(activeSlide + 1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
        </div>
      </div>
      <div class="stories-closing" data-reveal>
        <h2>No podemos mejorar lo que no comprendemos.</h2>
        <p>AirSense transforma mediciones ambientales en información que nos ayuda a conocer mejor los espacios donde vivimos, estudiamos y trabajamos.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.environment-stories { --card-width: min(78vw, 980px); --carousel-gutter: calc((100% - var(--card-width)) / 2); background: var(--ice-soft, #f4fafb); color: var(--c-navy); padding-block: clamp(80px, 10vw, 152px); }
.stories-content { width: min(1280px, calc(100% - 48px)); margin-inline: auto; }
.stories-intro { max-width: 850px; margin: 0 auto clamp(48px, 6vw, 80px); text-align: center; }
.stories-eyebrow { margin: 0 0 24px; color: var(--teal-deep); font-size: .75rem; line-height: 1.5; font-weight: 600; letter-spacing: .18em; }
.stories-intro h2, .stories-closing h2 { margin: 0 auto; font-family: var(--font-display); font-size: clamp(2.25rem, 4.8vw, 4.5rem); font-weight: 600; line-height: 1.08; letter-spacing: -.045em; text-wrap: balance; }
.stories-description { max-width: 65ch; margin: 28px auto 0; color: var(--muted); font-size: clamp(1rem, 1.5vw, 1.2rem); line-height: 1.75; text-wrap: pretty; }
.stories-carousel { position: relative; display: flex; gap: clamp(20px, 2.5vw, 32px); padding: 6px var(--carousel-gutter) 12px; overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scroll-padding-inline: var(--carousel-gutter); scrollbar-width: none; }
.stories-carousel::-webkit-scrollbar { display: none; }
.stories-carousel:focus-visible { outline: 3px solid var(--c-teal); outline-offset: -3px; }
.environment-story { position: relative; flex: 0 0 var(--card-width); min-width: 0; height: clamp(460px, 52vw, 640px); scroll-snap-align: center; isolation: isolate; overflow: hidden; border-radius: clamp(20px, 2.5vw, 32px); background: #17313c; color: #fff; }
.carousel-controls { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 20px; }
.carousel-dots { display: flex; align-items: center; gap: 2px; padding-inline: 8px; border-radius: 999px; background: var(--glass-surface); border: 1px solid var(--glass-edge); box-shadow: var(--glass-shadow); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); }
.carousel-dots button { display: grid; place-items: center; width: 32px; height: 44px; padding: 0; border: 0; background: transparent; }
.carousel-dots .indicator-track { position: relative; display: block; width: 7px; height: 7px; overflow: hidden; border-radius: 99px; background: #bdcdd1; transition: width .2s ease; }
.carousel-dots button.is-active { width: 64px; }
.carousel-dots .is-active .indicator-track { width: 54px; }
.carousel-dots .indicator-progress { position: absolute; inset: 0; border-radius: inherit; background: var(--c-navy); transform-origin: left center; }
.carousel-arrows { display: flex; gap: 12px; }
.carousel-arrows button { display: grid; place-items: center; width: 44px; height: 44px; padding: 10px; border-radius: 50%; background: var(--glass-surface); border: 1px solid var(--glass-edge); box-shadow: var(--glass-shadow); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); color: var(--c-navy); transition: background-color .2s ease; }
.carousel-arrows button:disabled { opacity: .35; cursor: default; }
.carousel-arrows svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.carousel-playback { margin-right: 4px; }
.carousel-playback svg { width: 20px; height: 20px; }
.environment-story img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .65s cubic-bezier(.22, 1, .36, 1); }
.environment-story::after { content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(180deg, transparent 35%, rgba(3, 15, 23, .45) 62%, rgba(3, 15, 23, .94) 100%); }
.story-copy { position: absolute; bottom: 0; inset-inline: 0; z-index: 2; padding: clamp(24px, 3.2vw, 44px); }
.story-copy h3 { margin: 0 0 14px; font-family: var(--font-display); font-size: clamp(1.6rem, 2.7vw, 2.6rem); font-weight: 600; line-height: 1.12; letter-spacing: -.035em; text-wrap: balance; }
.story-copy p { max-width: 40ch; margin: 0; color: #edf3f5; font-size: clamp(.95rem, 1.3vw, 1.12rem); line-height: 1.6; text-wrap: pretty; }
.stories-closing { max-width: 860px; margin: clamp(80px, 10vw, 152px) auto 0; text-align: center; }
.stories-closing h2 { max-width: 23ch; font-size: clamp(2rem, 4vw, 3.8rem); }
.stories-closing p { max-width: 60ch; margin: 28px auto 0; color: var(--muted); font-size: clamp(1rem, 1.5vw, 1.25rem); line-height: 1.75; text-wrap: pretty; }
.has-motion [data-reveal] { opacity: 0; transform: translateY(22px); transition: opacity .65s ease var(--reveal-delay, 0ms), transform .65s cubic-bezier(.22, 1, .36, 1) var(--reveal-delay, 0ms); }
.has-motion [data-reveal].is-visible { opacity: 1; transform: translateY(0); }
.has-motion .carousel-controls { opacity: 0; transform: translateY(18px) scale(.96); transition: opacity .35s ease, transform .5s cubic-bezier(.22, 1, .36, 1); }
.has-motion .carousel-controls.is-visible,
.has-motion .carousel-controls:focus-within { opacity: 1; transform: none; }
.has-motion .carousel-controls.is-visible .carousel-dots { animation: controls-unfold .65s cubic-bezier(.22, 1, .36, 1) both; }
.has-motion .carousel-controls.is-visible .carousel-arrows button { animation: control-jump .65s cubic-bezier(.22, 1, .36, 1) both; }
.has-motion .carousel-controls.is-visible .carousel-arrows button:nth-child(1) { animation-delay: .1s; }
.has-motion .carousel-controls.is-visible .carousel-arrows button:nth-child(2) { animation-delay: .18s; }
.has-motion .carousel-controls.is-visible .carousel-arrows button:nth-child(3) { animation-delay: .26s; }
.carousel-controls:focus-within .carousel-arrows button { animation: none !important; }
@keyframes controls-unfold {
  from { transform: translateY(12px) scaleX(.75); }
  65% { transform: translateY(-3px) scaleX(1.025); }
  to { transform: none; }
}
@keyframes control-jump {
  from { transform: translateY(18px) scale(.8); }
  45% { transform: translateY(-9px) scale(1.04); }
  72% { transform: translateY(3px) scale(.98); }
  to { transform: none; }
}
@media (hover: hover) and (pointer: fine) { .environment-story:hover img { transform: scale(1.025); } .carousel-arrows button:hover:not(:disabled) { background: var(--glass-hover); } }
@media (max-width: 700px) {
  .environment-stories { --card-width: 86vw; }
  .stories-content { width: calc(100% - 40px); }
  .carousel-controls { gap: 8px; flex-wrap: wrap; }
  .carousel-arrows { gap: 6px; }
  .carousel-dots button { width: 26px; }
  .stories-carousel { gap: 16px; }
  .environment-story { flex-basis: 86vw; height: clamp(460px, 125vw, 580px); }
  .story-copy { padding: 26px; }
  .story-copy h3 { font-size: clamp(1.6rem, 6vw, 2.4rem); }
}
@media (prefers-reduced-motion: reduce) {
  .has-motion .carousel-controls { opacity: 1; transform: none; transition: none; }
  .has-motion .carousel-controls .carousel-dots,
  .has-motion .carousel-controls .carousel-arrows button { animation: none; }
  .has-motion [data-reveal] { opacity: 1; transform: none; transition: none; }
  .environment-story img { transition: none; }
  .environment-story:hover img { transform: none; }
  .carousel-dots span, .carousel-arrows button { transition: none; }
}
</style>
