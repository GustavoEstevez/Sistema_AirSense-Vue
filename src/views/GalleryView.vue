<script setup>
import { ref } from 'vue'

const photos = [
  ['galeria general/20260820_101650.jpg', 'Prototipo y componentes'],
  ['galeria general/20260820_101648.jpg', 'Trabajo en el laboratorio'],
  ['galeria general/20260820_101644.jpg', 'Pruebas del sistema'],
  ['galeria general/20260820_101248.jpg', 'Construcción de AirSense'],
  ['galeria general/20260820_101245.jpg', 'Equipo en acción'],
  ['galeria general/20260820_101148.jpg', 'Mediciones ambientales'],
  ['galeria general/20260820_100856.jpg', 'Calibración de sensores'],
  ['galeria general/20260820_100410.jpg', 'Proceso de desarrollo'],
  ['galeria general/20260820_100336.jpg', 'Electrónica del prototipo'],
  ['galeria general/20260820_100333.jpg', 'Primera integración'],
  ['primera instancia/IMG-20260609-WA0047.jpg', 'Primera instancia'],
  ['primera instancia/IMG-20260609-WA0025.jpg', 'Presentación inicial'],
]
const selected = ref(null)
</script>

<template>
  <div class="gallery-page">
    <section class="gallery-hero page-width"><span>REGISTRO DEL PROCESO</span><h1>Ideas, pruebas<br />y aprendizaje.</h1><p>Una mirada al recorrido detrás de AirSense, desde los primeros componentes hasta la estación conectada.</p></section>
    <section class="gallery-grid page-width"><button v-for="(photo, index) in photos" :key="photo[0]" type="button" :class="{ wide: index === 0 || index === 7 }" @click="selected = photo"><img :src="`/assets/Fotos/${photo[0]}`" :alt="photo[1]" loading="lazy" /><span>{{ photo[1] }}</span></button></section>
    <Teleport to="body"><div v-if="selected" class="lightbox" role="dialog" aria-modal="true" :aria-label="selected[1]" @click.self="selected = null"><button type="button" aria-label="Cerrar" @click="selected = null">×</button><img :src="`/assets/Fotos/${selected[0]}`" :alt="selected[1]" /><p>{{ selected[1] }}</p></div></Teleport>
  </div>
</template>
