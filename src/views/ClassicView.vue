<script setup>
const steps = [
  ['1', 'Medir', 'Sensores capturan temperatura, humedad, sonido y gases.'],
  ['2', 'Procesar', 'El ESP32 calibra y agrupa las mediciones del ambiente.'],
  ['3', 'Comprender', 'El dashboard traduce cada valor a un estado fácil de interpretar.'],
]
</script>

<template>
  <div class="simple-page">
    <section class="split-hero page-width">
      <div><span class="eyebrow classic">PRIMERA GENERACIÓN</span><h1>AirSense<br /><em>Classic.</em></h1><p>El prototipo con el que aprendimos que medir el ambiente era el primer paso para poder mejorarlo.</p><div class="hero-actions"><RouterLink to="/dashboard/" class="button primary">Ver evolución en vivo</RouterLink><RouterLink to="/" class="button secondary">Conocer AirSense AI</RouterLink></div></div>
      <img src="/assets/Fotos/AirSenseClassic.png" alt="Prototipo AirSense Classic" />
    </section>
    <section class="dark-band"><div class="page-width"><span>EL ORIGEN</span><h2>No podemos mejorar<br />lo que no medimos.</h2><p>AirSense Classic nació como una herramienta para investigar las condiciones reales de aulas y espacios compartidos. Con componentes accesibles y una interfaz directa, convirtió sensaciones en evidencia.</p></div></section>
    <section class="section page-width"><div class="section-heading"><span>PROCESO</span><h2>Del sensor a una decisión.</h2></div><div class="steps-grid"><article v-for="step in steps" :key="step[0]" class="panel"><b>{{ step[0] }}</b><h3>{{ step[1] }}</h3><p>{{ step[2] }}</p></article></div></section>
    <section class="comparison page-width"><img src="/assets/Fotos/Dispositivo.png" alt="Dispositivo AirSense Classic" /><div><span class="eyebrow">LO QUE SIGUIÓ</span><h2>Una idea que aprendió a crecer.</h2><p>La nueva versión reemplaza el servidor Django por una arquitectura Vue + Supabase: conserva historial, transmite cambios en tiempo real y puede enviar alertas desde funciones serverless.</p><RouterLink to="/" class="text-link">Ver la nueva generación →</RouterLink></div></section>
  </div>
</template>
