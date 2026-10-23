<script setup>
const features = [
  { icon: '⌁', title: 'Medición continua', text: 'Temperatura, humedad, ruido y CO₂ registrados cada pocos segundos.' },
  { icon: '◎', title: 'Datos en tiempo real', text: 'Supabase sincroniza el dispositivo y el dashboard sin recargar la página.' },
  { icon: '✦', title: 'Recomendaciones claras', text: 'Convertimos números en acciones simples para cuidar el ambiente.' },
]
const hardware = [
  ['ESP32.png', 'ESP32', 'Conectividad Wi-Fi y procesamiento'],
  ['SHT30.png', 'SHT30', 'Temperatura y humedad'],
  ['MQ135.png', 'MQ-135', 'Calidad del aire'],
  ['MAX4466.png', 'MAX4466', 'Nivel sonoro'],
  ['OLED.png', 'Pantalla OLED', 'Lectura local inmediata'],
  ['Carcasa3D.png', 'Carcasa 3D', 'Diseño portátil y protegido'],
]
</script>

<template>
  <div class="home-page">
    <section class="hero page-width">
      <div class="hero-copy">
        <span class="eyebrow"><i></i> AirSense AI · nueva generación</span>
        <h1>El ambiente habla.<br /><em>Ahora podés escucharlo.</em></h1>
        <p>Una estación inteligente que mide la calidad del espacio, interpreta los datos y te ayuda a tomar mejores decisiones.</p>
        <div class="hero-actions">
          <RouterLink to="/dashboard/" class="button primary"><span class="pulse"></span> Ver dashboard en vivo</RouterLink>
          <RouterLink to="/documentacion/" class="button secondary">Cómo funciona →</RouterLink>
        </div>
        <div class="hero-facts">
          <div><strong>4</strong><span>variables ambientales</span></div>
          <div><strong>24/7</strong><span>monitoreo continuo</span></div>
          <div><strong>100%</strong><span>código sin Python</span></div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <img src="/assets/Fotos/HeroAI.png" alt="Dispositivo AirSense AI" />
        <div class="float-chip chip-air"><small>CO₂</small><strong>742 ppm</strong><span>● Aire fresco</span></div>
        <div class="float-chip chip-temp"><small>Temperatura</small><strong>22.4 °C</strong><span>● Óptima</span></div>
      </div>
    </section>

    <section class="section page-width">
      <div class="section-heading"><span>DEL SENSOR A LA ACCIÓN</span><h2>Entender el espacio cambia<br />cómo lo habitamos.</h2></div>
      <div class="feature-grid">
        <article v-for="feature in features" :key="feature.title" class="feature-card panel">
          <b>{{ feature.icon }}</b><h3>{{ feature.title }}</h3><p>{{ feature.text }}</p>
        </article>
      </div>
    </section>

    <section class="showcase">
      <div class="page-width showcase-grid">
        <div><span class="eyebrow dark">VISIBILIDAD INMEDIATA</span><h2>De una señal invisible<br />a una decisión concreta.</h2><p>El nuevo sistema envía las mediciones a Supabase, conserva el historial y actualiza la pantalla por Realtime. Si detecta un valor crítico, puede enviar una alerta sin mantener un servidor propio.</p><RouterLink to="/dashboard/" class="text-link">Explorar las mediciones →</RouterLink></div>
        <img src="/assets/Fotos/DashboardLive.jpg" alt="Dashboard de AirSense" />
      </div>
    </section>

    <section class="section page-width">
      <div class="section-heading"><span>EL SISTEMA</span><h2>Hardware simple.<br />Información valiosa.</h2></div>
      <div class="hardware-grid">
        <article v-for="part in hardware" :key="part[1]" class="hardware-card panel">
          <img :src="`/assets/Fotos/${part[0]}`" :alt="part[1]" loading="lazy" /><div><h3>{{ part[1] }}</h3><p>{{ part[2] }}</p></div>
        </article>
      </div>
    </section>

    <section class="cta-section page-width">
      <span>¿CÓMO ESTÁ TU AMBIENTE?</span><h2>Los datos ya están listos.<br />Sólo falta mirarlos.</h2><RouterLink to="/dashboard/" class="button light">Abrir dashboard →</RouterLink>
    </section>
  </div>
</template>
