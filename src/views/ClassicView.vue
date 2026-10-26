<script setup>
import { ref } from 'vue'
import QuoteModal from '../components/QuoteModal.vue'

const showQuote = ref(false)

const specs = [
  ['Dimensiones', '120 × 85 × 42 mm', 'Gabinete compacto con flujo de aire optimizado'],
  ['Peso', '210 g', 'Montaje en pared, escritorio o cielo raso'],
  ['Alimentación', '5 V DC · USB-C', 'Consumo energético reducido 24/7'],
  ['Conectividad', 'Wi-Fi 2.4 GHz', 'WPA2/WPA3 Enterprise · TLS 1.2+'],
  ['Procesamiento', 'ESP32 dual-core', 'Buffer local y reintento automático'],
  ['Sensores', 'SHT30 · MQ-135 · MAX4466', 'Calibración digital de fábrica'],
  ['Pantalla', 'OLED I2C 128×64', 'Lectura local sin necesidad de app'],
  ['Actualización', 'Cada 5 segundos', 'Configurable desde la consola cloud'],
]

const deployment = [
  ['01', 'Relevamiento técnico', 'Definimos la cantidad de estaciones y los puntos críticos de cada piso o sector.'],
  ['02', 'Instalación y montaje', 'El equipo técnico instala cada dispositivo con alimentación y cobertura Wi-Fi verificadas.'],
  ['03', 'Calibración y alta', 'Cada estación se registra en tu organización de Supabase con su identificador único.'],
  ['04', 'Operación y soporte', 'Acceso al dashboard corporativo, alertas automáticas y soporte con SLA contratado.'],
]

const comparison = [
  ['Frecuencia de medición', 'Visitas puntuales o planillas manuales', 'Telemetría automática cada 5 segundos'],
  ['Trazabilidad', 'Registros dispersos y difíciles de auditar', 'Historial centralizado y exportable'],
  ['Alertas', 'Detección tardía de problemas', 'Notificaciones inmediatas por umbral'],
  ['Cobertura', 'Una o dos salas por relevamiento', 'Todas las sedes en una sola consola'],
  ['Reportes', 'Elaboración manual de informes', 'Informes ejecutivos automáticos por correo'],
]
</script>

<template>
  <div class="hardware-page">
    <section class="split-hero page-width">
      <div>
        <span class="eyebrow"><i></i> TECNOLOGÍA · AIRSENSE™ PRO</span>
        <h1>Una estación diseñada para <em>operar sin supervisión.</em></h1>
        <p>
          AirSense Pro combina sensores de precisión, procesamiento local y conectividad segura en un gabinete discreto
          pensado para oficinas, salas técnicas y espacios de alta concurrencia. Instalación plug & play, sin servidores locales.
        </p>
        <div class="hero-actions">
          <button type="button" class="button primary" @click="showQuote = true">Solicitar Ficha y Cotización →</button>
          <RouterLink to="/documentacion/" class="button secondary">Ver integración IT</RouterLink>
        </div>
        <div class="hero-facts">
          <div><strong>3</strong><span>Sensores calibrados</span></div>
          <div><strong>5 s</strong><span>Intervalo de muestreo</span></div>
          <div><strong>24/7</strong><span>Operación continua</span></div>
        </div>
      </div>
      <img src="/assets/Fotos/Dispositivo.png" alt="Estación de sensores AirSense Pro para empresas" />
    </section>

    <section class="dark-band">
      <div class="page-width">
        <span>INGENIERÍA ORIENTADA A RESULTADOS</span>
        <h2>Precisión de laboratorio,<br />formato corporativo.</h2>
        <p>
          Cada componente fue seleccionado para soportar jornadas laborales completas y entornos con alta densidad de ocupación.
          El gabinete protege la electrónica y garantiza una circulación de aire estable para lecturas consistentes.
        </p>
      </div>
    </section>

    <section class="section page-width">
      <div class="section-heading">
        <span>ESPECIFICACIONES TÉCNICAS</span>
        <h2>Ficha de hardware</h2>
      </div>
      <div class="spec-table-wrap panel">
        <table class="spec-table">
          <thead>
            <tr><th>Parámetro</th><th>Valor</th><th>Detalle</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in specs" :key="row[0]">
              <td><strong>{{ row[0] }}</strong></td>
              <td>{{ row[1] }}</td>
              <td>{{ row[2] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section page-width" style="padding-top: 0;">
      <div class="section-heading">
        <span>IMPLEMENTACIÓN LLAVE EN MANO</span>
        <h2>De la cotización a la operación en cuatro etapas</h2>
      </div>
      <div class="steps-grid">
        <article v-for="step in deployment" :key="step[0]" class="panel">
          <b>{{ step[0] }}</b>
          <h3>{{ step[1] }}</h3>
          <p>{{ step[2] }}</p>
        </article>
      </div>
    </section>

    <section class="section page-width" style="padding-top: 0;">
      <div class="section-heading">
        <span>POR QUÉ REEMPLAZAR LA MEDICIÓN MANUAL</span>
        <h2>AirSense Pro frente a los métodos tradicionales</h2>
      </div>
      <div class="comparison-table-wrap panel">
        <table class="comparison-table">
          <thead>
            <tr><th>Dimensión</th><th>Medición tradicional</th><th>AirSense Pro</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in comparison" :key="row[0]">
              <td>{{ row[0] }}</td>
              <td class="muted-cell">{{ row[1] }}</td>
              <td class="highlight-cell"><span>✓</span> {{ row[2] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="page-width cta-wrap">
      <div class="cta-section">
        <span>DISPONIBLE PARA DESPLIEGUES CORPORATIVOS</span>
        <h2>Conocé el funcionamiento completo y recibí una propuesta a medida.</h2>
        <p>Nuestro equipo comercial puede dimensionar la solución según la superficie y ocupación de cada sede.</p>
        <button type="button" class="button light" style="font-weight: 800;" @click="showQuote = true">
          Solicitar Cotización de Hardware
        </button>
      </div>
    </section>

    <QuoteModal :show="showQuote" @close="showQuote = false" />
  </div>
</template>
