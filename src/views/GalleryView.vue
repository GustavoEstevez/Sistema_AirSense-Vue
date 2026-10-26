<script setup>
import { ref } from 'vue'
import QuoteModal from '../components/QuoteModal.vue'

const showQuote = ref(false)

const photos = [
  ['galeria general/20260820_101650.jpg', 'Ensamblaje de estaciones AirSense Pro'],
  ['galeria general/20260820_101648.jpg', 'Control de calidad en laboratorio'],
  ['galeria general/20260820_101644.jpg', 'Pruebas de integración de sensores'],
  ['galeria general/20260820_101248.jpg', 'Montaje de gabinetes de protección'],
  ['galeria general/20260820_101245.jpg', 'Equipo técnico en proceso de calibración'],
  ['galeria general/20260820_101148.jpg', 'Validación de telemetría ambiental'],
  ['galeria general/20260820_100856.jpg', 'Calibración de precisión SHT30'],
  ['galeria general/20260820_100410.jpg', 'Prototipado y desarrollo de hardware'],
  ['galeria general/20260820_100336.jpg', 'Electrónica de la estación corporate'],
  ['galeria general/20260820_100333.jpg', 'Integración de módulos de medición'],
  ['primera instancia/IMG-20260609-WA0047.jpg', 'Despliegue piloto en sitio'],
  ['primera instancia/IMG-20260609-WA0025.jpg', 'Puesta en marcha y verificación'],
]
const selected = ref(null)
</script>

<template>
  <div class="gallery-page">
    <section class="gallery-hero page-width">
      <span class="eyebrow" style="margin: 0 auto 18px;"><i></i> CASOS DE DESPLIEGUE E INSTALACIÓN</span>
      <h1>Implementaciones reales.<br /><em>Resultados medibles.</em></h1>
      <p>Recorrido por el proceso de fabricación, calibración y puesta en marcha de las estaciones AirSense Pro en entornos corporativos.</p>
      <div class="hero-actions" style="justify-content: center;">
        <button type="button" class="button primary" @click="showQuote = true">Cotizar una instalación →</button>
        <RouterLink to="/hardware/" class="button secondary">Ver hardware</RouterLink>
      </div>
    </section>

    <section class="gallery-grid page-width">
      <button
        v-for="(photo, index) in photos"
        :key="photo[0]"
        type="button"
        :class="{ wide: index === 0 || index === 7 }"
        @click="selected = photo"
      >
        <img :src="`/assets/Fotos/${photo[0]}`" :alt="photo[1]" loading="lazy" />
        <span>{{ photo[1] }}</span>
      </button>
    </section>

    <Teleport to="body">
      <div v-if="selected" class="lightbox" role="dialog" aria-modal="true" :aria-label="selected[1]" @click.self="selected = null">
        <button type="button" aria-label="Cerrar" @click="selected = null">×</button>
        <img :src="`/assets/Fotos/${selected[0]}`" :alt="selected[1]" />
        <p>{{ selected[1] }}</p>
      </div>
    </Teleport>

    <QuoteModal :show="showQuote" @close="showQuote = false" />
  </div>
</template>
