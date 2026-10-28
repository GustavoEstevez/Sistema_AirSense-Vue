<script setup>
import { ref } from 'vue'
import QuoteModal from '../components/QuoteModal.vue'

const showQuote = ref(false)

const variables = [
  ['Temperatura', '18–26 °C', 'SHT30', 'Fuera de 15–30 °C se considera crítico.'],
  ['Humedad relativa', '40–60 %', 'SHT30', 'Fuera de 30–70 % se considera crítico.'],
  ['Presión sonora', '≤ 50 dB', 'MAX4466', 'Por encima de 70 dB se considera crítico.'],
  ['CO₂ / VOCs', '≤ 800 ppm', 'MQ-135', 'Por encima de 1200 ppm requiere ventilación inmediata.'],
]

const standards = [
  ['ASHRAE 62.1', 'Ventilación para calidad de aire interior', 'Referencia de renovación de aire por ocupante.'],
  ['WELL Building Standard v2', 'Confort térmico y acústico', 'Criterios de bienestar aplicables a oficinas.'],
  ['LEED v4.1', 'Eficiencia y calidad ambiental', 'Soporte documental para certificación edilicia.'],
  ['OSHA / Higiene y Seguridad', 'Condiciones de trabajo saludables', 'Registro trazable de parámetros ambientales.'],
]
</script>

<template>
  <div class="docs-page page-grid-bg">
    <section class="docs-hero page-width">
      <span class="eyebrow"><i></i> FUNCIONAMIENTO & INTEGRACIÓN IT</span>
      <h1>Documentación para equipos<br />de <em>IT y Facilities.</em></h1>
      <p>Arquitectura cloud, estándares ambientales de referencia y guía de despliegue del sistema Vue + Node.js + Supabase.</p>
      <div class="hero-actions">
        <button type="button" class="button primary" @click="showQuote = true">Solicitar documentación completa →</button>
        <RouterLink to="/dashboard/" class="button secondary">Ver consola</RouterLink>
      </div>
    </section>

    <section class="docs-content page-width">
      <aside>
        <a href="#arquitectura">Arquitectura cloud</a>
        <a href="#seguridad">Seguridad y datos</a>
        <a href="#rangos">Rangos y normativas</a>
        <a href="#instalacion">Despliegue</a>
        <a href="#dispositivo">Dispositivo IoT</a>
        <a href="#informes">Documentos</a>
      </aside>

      <div class="docs-main">
        <section id="arquitectura" class="doc-section">
          <span>01</span>
          <h2>Arquitectura cloud sin servidores locales</h2>
          <p>
            AirSense es una plataforma SaaS de telemetría construida con <strong>Vue</strong> en el frontend,
            <strong>Node.js</strong> como entorno de desarrollo y compilación, y <strong>Supabase</strong> como backend gestionado.
            Node.js (con Vite) compila la interfaz como archivos estáticos de alto rendimiento.
          </p>
          <p>
            Cada estación ESP32 envía sus lecturas a una Supabase Edge Function que valida la clave del dispositivo y persiste el dato
            con permisos de servidor. Supabase Realtime notifica al navegador de forma inmediata, sin polling.
          </p>
          <div class="architecture">
            <b>ESP32</b><i>→</i><b>Edge Function</b><i>→</i><b>Postgres</b><i>→</i><b>Realtime</b><i>→</i><b>Vue</b>
          </div>
          <p>Los informes ejecutivos se generan en Edge Functions y se entregan mediante Gmail SMTP con TLS. Ninguna credencial privada se expone en el navegador.</p>
        </section>

        <section id="seguridad" class="doc-section">
          <span>02</span>
          <h2>Seguridad, privacidad y gobierno de datos</h2>
          <div class="security-grid">
            <div class="security-card panel"><strong>TLS 1.2+</strong><span>Cifrado en tránsito entre dispositivos, edge functions y navegador.</span></div>
            <div class="security-card panel"><strong>Row Level Security</strong><span>Políticas de acceso por organización en PostgreSQL.</span></div>
            <div class="security-card panel"><strong>Edge Functions</strong><span>Validación de dispositivo y secretos fuera del cliente.</span></div>
            <div class="security-card panel"><strong>Trazabilidad</strong><span>Historial inmutable de lecturas para auditorías internas.</span></div>
          </div>
        </section>

        <section id="rangos" class="doc-section">
          <span>03</span>
          <h2>Rangos de referencia ambiental</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Variable</th><th>Óptimo</th><th>Sensor</th><th>Alerta</th></tr></thead>
              <tbody>
                <tr v-for="row in variables" :key="row[0]">
                  <td><strong>{{ row[0] }}</strong></td><td>{{ row[1] }}</td><td>{{ row[2] }}</td><td>{{ row[3] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 class="doc-subtitle">Estándares internacionales contemplados</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Norma</th><th>Alcance</th><th>Aplicación corporativa</th></tr></thead>
              <tbody>
                <tr v-for="row in standards" :key="row[0]">
                  <td><strong>{{ row[0] }}</strong></td><td>{{ row[1] }}</td><td>{{ row[2] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="instalacion" class="doc-section">
          <span>04</span>
          <h2>Despliegue e integración</h2>
          <p>Requisitos: Node.js 18 o superior, Supabase CLI y acceso a la red Wi-Fi corporativa.</p>
          <ol class="code-steps">
            <li><b>1</b><div><p>Instalar dependencias del frontend</p><code>npm install</code></div></li>
            <li><b>2</b><div><p>Configurar variables de entorno</p><code>Copy-Item .env.example .env</code></div></li>
            <li><b>3</b><div><p>Aplicar migraciones y publicar funciones</p><code>supabase db push<br />supabase functions deploy ingest-reading --no-verify-jwt<br />supabase functions deploy send-reading-email</code></div></li>
            <li><b>4</b><div><p>Compilar y desplegar la consola</p><code>npm run build</code></div></li>
          </ol>
          <p>La configuración completa de secretos y roles está documentada en el <code>README.md</code> del repositorio.</p>
        </section>

        <section id="dispositivo" class="doc-section">
          <span>05</span>
          <h2>Integración del dispositivo IoT</h2>
          <p>Configurá la URL de la función <code>ingest-reading</code> y la misma clave almacenada como secreto <code>AIRSENSE_DEVICE_KEY</code>. La estación envía un JSON con cuatro campos:</p>
          <pre><code>{
  "temperatura": 22.4,
  "humedad": 51.2,
  "ruido": 44,
  "co2": 742
}</code></pre>
          <p>Para despliegues multi-sede, cada dispositivo incluye un identificador único que permite segmentar la telemetría por edificio, piso o sector.</p>
        </section>

        <section id="informes" class="doc-section">
          <span>06</span>
          <h2>Documentación corporativa</h2>
          <div class="download-grid">
            <a href="/assets/documentacion.pdf" target="_blank" rel="noopener"><b>PDF</b><span>Funcionamiento del sistema</span></a>
            <a href="/assets/hardware.pdf" target="_blank" rel="noopener"><b>PDF</b><span>Hardware y arquitectura</span></a>
            <a href="/assets/instalaciones.pdf" target="_blank" rel="noopener"><b>PDF</b><span>Instalaciones y despliegues</span></a>
          </div>

        </section>
      </div>
    </section>

    <QuoteModal :show="showQuote" @close="showQuote = false" />
  </div>
</template>
