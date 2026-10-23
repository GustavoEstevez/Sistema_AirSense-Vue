<script setup>
const variables = [
  ['Temperatura', '18–26 °C', 'SHT30', 'Fuera de 15–30 °C se considera crítica.'],
  ['Humedad', '40–60 %', 'SHT30', 'Fuera de 30–70 % se considera crítica.'],
  ['Ruido', '≤ 50 dB', 'MAX4466', 'Por encima de 70 dB se considera crítico.'],
  ['CO₂', '≤ 800 ppm', 'MQ-135', 'Por encima de 1200 ppm se recomienda ventilar de inmediato.'],
]
</script>

<template>
  <div class="docs-page page-grid-bg">
    <section class="docs-hero page-width"><span class="eyebrow">DOCUMENTACIÓN</span><h1>Cómo funciona<br />AirSense.</h1><p>Arquitectura, rangos de referencia y guías para desplegar el sistema Vue + Supabase.</p></section>
    <section class="docs-content page-width">
      <aside><a href="#arquitectura">Arquitectura</a><a href="#rangos">Rangos</a><a href="#instalacion">Instalación</a><a href="#dispositivo">ESP32</a><a href="#informes">Informes</a></aside>
      <div class="docs-main">
        <section id="arquitectura" class="doc-section"><span>01</span><h2>Arquitectura sin servidor Python</h2><p>Vue se compila como archivos estáticos. El ESP32 envía cada lectura a una Supabase Edge Function, que valida la clave del dispositivo y guarda el dato con permisos de servidor. Supabase Realtime notifica al navegador inmediatamente.</p><div class="architecture"><b>ESP32</b><i>→</i><b>Edge Function</b><i>→</i><b>Postgres</b><i>→</i><b>Vue Realtime</b></div><p>Los correos también salen desde Edge Functions mediante Resend. Las claves privadas nunca se incluyen en la aplicación web.</p></section>
        <section id="rangos" class="doc-section"><span>02</span><h2>Rangos de referencia</h2><div class="table-wrap"><table><thead><tr><th>Variable</th><th>Óptimo</th><th>Sensor</th><th>Alerta</th></tr></thead><tbody><tr v-for="row in variables" :key="row[0]"><td><strong>{{ row[0] }}</strong></td><td>{{ row[1] }}</td><td>{{ row[2] }}</td><td>{{ row[3] }}</td></tr></tbody></table></div></section>
        <section id="instalacion" class="doc-section"><span>03</span><h2>Instalación local</h2><ol class="code-steps"><li><b>1</b><div><p>Instalá dependencias</p><code>npm install</code></div></li><li><b>2</b><div><p>Creá el archivo de entorno</p><code>Copy-Item .env.example .env</code></div></li><li><b>3</b><div><p>Aplicá la migración y publicá las funciones</p><code>supabase db push<br />supabase functions deploy ingest-reading --no-verify-jwt<br />supabase functions deploy send-reading-email</code></div></li><li><b>4</b><div><p>Iniciá Vue</p><code>npm run dev</code></div></li></ol><p>La configuración completa de secretos está en el <code>README.md</code> del repositorio.</p></section>
        <section id="dispositivo" class="doc-section"><span>04</span><h2>Conectar el ESP32</h2><p>En el sketch configurá la URL de la función <code>ingest-reading</code> y la misma clave guardada como secreto <code>AIRSENSE_DEVICE_KEY</code>. El dispositivo envía JSON con cuatro campos:</p><pre><code>{
  "temperatura": 22.4,
  "humedad": 51.2,
  "ruido": 44,
  "co2": 742
}</code></pre></section>
        <section id="informes" class="doc-section"><span>05</span><h2>Informes del proyecto</h2><div class="download-grid"><a href="/assets/InformeAirSense.pdf" target="_blank"><b>PDF</b><span>Informe AirSense</span></a><a href="/assets/Airsense_informe_tecnico.pdf" target="_blank"><b>PDF</b><span>Informe técnico</span></a><a href="/assets/CarpetaDeCampo.pdf" target="_blank"><b>PDF</b><span>Carpeta de campo</span></a></div></section>
      </div>
    </section>
  </div>
</template>
