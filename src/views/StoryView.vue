<script setup>
const milestones = [
  ['01', 'Observar', 'Notamos cansancio, calor, ruido y aire cargado en espacios de estudio.'],
  ['02', 'Investigar', 'Contrastamos percepciones con encuestas y referencias ambientales.'],
  ['03', 'Construir', 'Creamos una estación capaz de registrar cuatro variables esenciales.'],
  ['04', 'Aprender', 'Los datos mostraron patrones que a simple vista no se percibían.'],
]
</script>

<template>
  <div class="story-page">
    <section class="story-hero page-width"><span>PROYECTO AIRSENSE</span><h1>Mejorar empieza<br />por <em>comprender.</em></h1><p>Esta es la historia de cómo una pregunta del aula se convirtió en un sistema ambiental conectado.</p></section>
    <section class="story-photo"><img src="/assets/Fotos/AirSenseHero.png" alt="AirSense en desarrollo" /></section>
    <section class="section page-width"><div class="story-list"><article v-for="item in milestones" :key="item[0]"><b>{{ item[0] }}</b><div><h2>{{ item[1] }}</h2><p>{{ item[2] }}</p></div></article></div></section>
    <section class="quote-section"><blockquote>“Cuando los datos se vuelven visibles, también se vuelven accionables.”</blockquote><RouterLink to="/dashboard/" class="button light">Ver los datos →</RouterLink></section>
  </div>
</template>
