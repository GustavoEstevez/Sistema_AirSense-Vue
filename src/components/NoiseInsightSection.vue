<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const section = ref(null)
const animated = ref(false)
const percentage = ref('72,7')
const bars = Array.from({ length: 65 }, (_, i) => {
  const envelope = Math.sin((i / 64) * Math.PI) ** 1.5
  return 4 + envelope * (18 + 66 * Math.abs(Math.sin(i * 1.73)))
})
let observer
let motionQuery
let frame = 0
let counted = false
const format = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function count() {
  if (counted) return
  counted = true
  const start = performance.now()
  function tick(now) {
    const progress = Math.min((now - start) / 1100, 1)
    percentage.value = format.format(72.7 * (1 - (1 - progress) ** 3))
    if (progress < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

function revealAll() {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  animated.value = false
  percentage.value = '72,7'
}

function onMotionChange(event) { if (event.matches) revealAll() }

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionQuery.addEventListener('change', onMotionChange)
  if (motionQuery.matches || !('IntersectionObserver' in window)) return
  animated.value = true
  percentage.value = '0,0'
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-visible')
      if (entry.target.hasAttribute('data-count')) count()
      observer.unobserve(entry.target)
    }
  }, { threshold: .2 })
  section.value.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  motionQuery?.removeEventListener('change', onMotionChange)
})
</script>

<template>
  <section ref="section" class="noise-insight" :class="{ 'has-motion': animated }" aria-labelledby="noise-insight-title">
    <div class="noise-content">
      <div class="noise-intro" data-reveal>
        <p class="noise-eyebrow">UNA REALIDAD QUE NO SIEMPRE PERCIBIMOS</p>
        <h2 id="noise-insight-title">Lo que no medimos también nos afecta.</h2>
      </div>

      <div class="noise-result" data-reveal data-count>
        <div class="noise-wave" aria-hidden="true">
          <span v-for="(height, i) in bars" :key="i" :style="{ '--bar-height': `${height}%` }"></span>
        </div>
        <p class="noise-percentage" aria-label="72,7 por ciento">
          <span aria-hidden="true">{{ percentage }}<span class="noise-percent-sign">%</span></span>
        </p>
        <p class="noise-description">de las mediciones de ruido realizadas superaron el rango establecido.</p>
      </div>

      <p class="noise-explanation" data-reveal>El ruido forma parte de nuestra vida cotidiana. Sin embargo, cuando alcanza niveles elevados, puede afectar nuestra concentración, descanso y bienestar.</p>

      <div class="noise-ending" data-reveal>
        <p class="noise-closing">Comprender nuestro entorno es el primer paso para mejorarlo.</p>
        <p class="noise-methodology">Dato obtenido durante las pruebas del proyecto AirSense. Corresponde a las mediciones realizadas, no a una estadística general de la población.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.noise-insight {
  background: #071d29;
  color: #fff;
  padding: clamp(80px, 10vw, 160px) 24px;
  overflow: clip;
}
.noise-content { max-width: 1120px; margin-inline: auto; text-align: center; }
.noise-eyebrow { margin: 0 0 28px; color: #7ab2b2; font-size: clamp(.65rem, 1vw, .8rem); font-weight: 600; line-height: 1.6; letter-spacing: .18em; }
.noise-intro h2 { max-width: 19ch; margin: 0 auto; font-family: var(--font-display); font-size: clamp(2.25rem, 5.2vw, 5rem); font-weight: 600; line-height: 1.08; letter-spacing: -.045em; text-wrap: balance; }
.noise-result { position: relative; isolation: isolate; margin-top: clamp(56px, 7vw, 100px); }
.noise-percentage { position: relative; margin: 0; font-family: var(--font-display); font-size: clamp(5.5rem, 19vw, 15rem); font-weight: 600; line-height: 1.1; letter-spacing: -.065em; font-variant-numeric: tabular-nums; }
.noise-percent-sign { margin-left: .04em; color: #7ab2b2; font-size: .55em; letter-spacing: -.04em; }
.noise-description { max-width: 33ch; margin: 20px auto 0; font-size: clamp(1.15rem, 2.3vw, 1.8rem); line-height: 1.4; letter-spacing: -.02em; text-wrap: balance; }
.noise-wave { position: absolute; z-index: -1; top: 0; left: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: space-between; width: min(100%, 1000px); height: clamp(100px, 21vw, 260px); opacity: .18; pointer-events: none; mask-image: linear-gradient(90deg, #000, transparent 38%, transparent 62%, #000); }
.noise-wave span { width: 2px; height: var(--bar-height); flex-shrink: 0; border-radius: 2px; background: #7ab2b2; }
.noise-explanation { max-width: 57ch; margin: clamp(48px, 6vw, 80px) auto 0; color: #b7c8d1; font-size: clamp(1rem, 1.6vw, 1.3rem); line-height: 1.8; text-wrap: pretty; }
.noise-ending { margin-top: clamp(64px, 8vw, 120px); }
.noise-closing { max-width: 34ch; margin: 0 auto; font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 500; line-height: 1.3; letter-spacing: -.025em; text-wrap: balance; }
.noise-methodology { max-width: 80ch; margin: 40px auto 0; color: #b7c8d1; font-size: .75rem; line-height: 1.7; }
.has-motion [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity .9s ease, transform .9s cubic-bezier(.22, 1, .36, 1); }
.has-motion [data-reveal].is-visible { opacity: 1; transform: translateY(0); }
.has-motion .noise-wave { opacity: 0; transition: opacity 1.6s ease .25s; }
.has-motion .is-visible .noise-wave { opacity: .18; }
.has-motion .noise-description { opacity: 0; transform: translateY(12px); transition: opacity .8s ease .7s, transform .8s ease .7s; }
.has-motion .is-visible .noise-description { opacity: 1; transform: translateY(0); }
.has-motion .noise-ending { transition-delay: .2s; }
@media (max-width: 560px) {
  .noise-insight { padding-inline: 20px; }
  .noise-eyebrow { max-width: 30ch; margin-inline: auto; }
  .noise-wave { width: 120%; }
  .noise-wave span:nth-child(even) { display: none; }
  .noise-methodology { font-size: .72rem; }
}
@media (prefers-reduced-motion: reduce) {
  .has-motion [data-reveal], .has-motion .noise-description { opacity: 1; transform: none; transition: none; }
  .has-motion .noise-wave { opacity: .18; transition: none; }
}
</style>
