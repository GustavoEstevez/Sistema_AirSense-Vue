<script setup>
import { ref } from 'vue'
import QuoteModal from '../components/QuoteModal.vue'

const showQuote = ref(false)

const pillars = [
  {
    icon: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
    title: 'Productividad y Enfoque Cognitivo',
    metric: '+15% de agudeza mental',
    text: 'Estudios demuestran que niveles de CO₂ superiores a 1.000 ppm incrementan la somnolencia y reducen la velocidad de toma de decisiones. AirSense alerta a tiempo para mantener el foco del equipo.',
  },
  {
    icon: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z M9 12l2 2 4-4',
    title: 'Salud Ocupacional y Menor Absentismo',
    metric: '-21% en bajas laborales',
    text: 'El control estricto de humedad relativa (40–60%) y ventilación continua reduce significativamente la persistencia de patógenos aerotransportados y la fatiga física en oficinas cerradas.',
  },
  {
    icon: 'M20 4C10 4 5 8 5 14a5 5 0 0 0 5 5c6 0 10-5 10-15z M5 19c2-5 5-8 10-10',
    title: 'Eficiencia Energética en Climatización',
    metric: 'Hasta 22% ahorro HVAC',
    text: 'Evitá sobreexigir los equipos de aire acondicionado y calefacción. La telemetría continua permite programar la ventilación sólo cuando el espacio realmente lo requiere.',
  },
  {
    icon: 'M7 3h7l4 4v14H7z M14 3v5h5 M10 12h6 M10 16h6',
    title: 'Cumplimiento Legal y Certificaciones',
    metric: 'WELL, LEED y OSHA',
    text: 'Generá registros auditables de calidad ambiental para comités de Higiene y Seguridad Laboral. Documentación lista para auditorías internas y normativas internacionales.',
  },
]

const pricingPlans = [
  {
    name: 'Pack Oficina',
    tag: 'PyMEs y Coworkings',
    price: 'A Medida',
    period: 'por espacio monitoreado',
    desc: 'Ideal para empresas que buscan certificar salas de reuniones clave y áreas comunes.',
    features: [
      '1 a 3 Dispositivos AirSense Pro',
      'Dashboard en tiempo real con Supabase Cloud',
      'Métricas en vivo: Temp, Humedad, CO₂ y Ruido',
      'Alertas por correo electrónico automáticas',
      'Garantía de hardware 12 meses',
      'Soporte técnico estándar',
    ],
    highlight: false,
    cta: 'Cotizar Pack Oficina',
  },
  {
    name: 'Pack Corporativo',
    tag: 'Sedes y Edificios',
    price: 'Recomendado',
    period: 'flota de 4 a 15 sensores',
    desc: 'La solución estándar para corporaciones que gestionan pisos completos y múltiples departamentos.',
    features: [
      '4 a 15 Dispositivos AirSense Pro calibrados',
      'Dashboard multi-sala centralizado en la nube',
      'Reportes ejecutivos semanales y mensuales',
      'Umbrales de alerta personalizados por sector',
      'Acceso multi-usuario con roles diferenciados',
      'SLA 99.9% de disponibilidad en tiempo real',
      'Capacitación inicial a Facilities y RRHH',
    ],
    highlight: true,
    cta: 'Solicitar Propuesta Corporativa',
  },
  {
    name: 'Pack Enterprise',
    tag: 'Grandes Empresas e Industrias',
    price: 'Consultoría',
    period: 'despliegue a gran escala',
    desc: 'Para proyectos multi-sede, plantas industriales o integración directa con BMS y sistemas existentes.',
    features: [
      '+16 Dispositivos con despliegue llave en mano',
      'Integración API REST y Webhooks a medida',
      'Exportación masiva para auditorías HSE y ESG',
      'Soporte 24/7 y reemplazo express de hardware',
      'Instalación y calibración on-site certificada',
      'Personalización de marca corporativa (White-label)',
    ],
    highlight: false,
    cta: 'Contactar a Ventas Enterprise',
  },
]

const sectors = [
  { title: 'Oficinas Corporativas', desc: 'Ambientes ventilados que potencian la concentración, el bienestar y previenen el letargo vespertino.' },
  { title: 'Salas de Reuniones', desc: 'Espacios de alta densidad donde el CO₂ se dispara en minutos si no hay renovación activa de aire.' },
  { title: 'Clínicas y Laboratorios', desc: 'Control estricto de humedad y temperatura para conservación ambiental y seguridad biológica.' },
  { title: 'Centros Educativos', desc: 'Aulas y auditorios con aire limpio que garantizan una experiencia pedagógica saludable.' },
]
</script>

<template>
  <div class="product-page">
    <!-- Corporate Hero Section -->
    <section class="hero page-width">
      <div class="hero-copy">
        <span class="eyebrow"><i></i> TECNOLOGÍA IOT CORPORATIVA · AIRSENSE™ PRO</span>
        <h1>Telemetría ambiental inteligente para <em>empresas exigentes.</em></h1>
        <p>
          Monitoreá en tiempo real la calidad del aire, temperatura, humedad y niveles de ruido en tus oficinas.
          Protegé la salud de tu equipo, optimizá costos de climatización y cumplí normativas internacionales con nuestra solución comercial llave en mano.
        </p>

        <div class="hero-actions">
          <button type="button" class="button primary" @click="showQuote = true">
            Solicitar Cotización Personalizada →
          </button>
        </div>

        <div class="hero-facts">
          <div><strong>4 en 1</strong><span>Sensores de precisión</span></div>
          <div><strong>24/7</strong><span>Telemetría en tiempo real</span></div>
          <div><strong>99.9%</strong><span>SLA Cloud Supabase</span></div>

        </div>
      </div>

      <div class="hero-visual">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <img src="/assets/Fotos/HeroAI.png" alt="Estación IoT AirSense Pro para Empresas" />
        <div class="float-chip chip-air">
          <small>Calidad del Aire</small>
          <strong>742 ppm CO₂</strong>
          <span>● Rango Óptimo de Trabajo</span>
        </div>
        <div class="float-chip chip-temp">
          <small>Confort Térmico</small>
          <strong>22.4 °C · 48% RH</strong>
          <span>● Clima Confortable</span>
        </div>
      </div>
    </section>

    <!-- Commercial Pricing Packs -->
    <section class="section page-width">
      <div class="section-heading">
        <span>MODELOS DE ADQUISICIÓN</span>
        <h2>Elegí el plan adecuado para el tamaño de tu empresa</h2>
      </div>

      <div class="pricing-grid">
        <div
          v-for="plan in pricingPlans"
          :key="plan.name"
          class="pricing-card panel"
          :class="{ highlighted: plan.highlight }"
        >
          <span v-if="plan.highlight" class="popular-badge">MÁS ELEGIDO</span>
          <div class="pricing-head">
            <span class="plan-tag">{{ plan.tag }}</span>
            <h3>{{ plan.name }}</h3>
            <p class="plan-desc">{{ plan.desc }}</p>
          </div>

          <div class="pricing-val">
            <strong>{{ plan.price }}</strong>
            <small>{{ plan.period }}</small>
          </div>

          <ul class="pricing-features">
            <li v-for="feat in plan.features" :key="feat">
              <span class="check">✓</span> {{ feat }}
            </li>
          </ul>

          <button
            type="button"
            class="button"
            :class="plan.highlight ? 'primary' : 'secondary'"
            style="width: 100%; margin-top: auto;"
            @click="showQuote = true"
          >
            {{ plan.cta }}
          </button>
        </div>
      </div>
    </section>

    <!-- International Standards Section -->
    <section class="section page-width standards-section">
      <div class="section-heading">
        <span>ESTÁNDARES INTERNACIONALES</span>
        <h2>Diseñado según estándares internacionales</h2>
        <p>Cada estación y cada informe de AirSense se alinean con las principales normas de calidad ambiental, eficiencia edilicia y seguridad ocupacional.</p>
      </div>

      <div class="standards-grid">
        <article class="standard-card panel">
          <strong>ASHRAE 62.1</strong>
          <span>Ventilación para calidad de aire interior</span>
        </article>
        <article class="standard-card panel">
          <strong>WELL v2</strong>
          <span>Confort térmico, acústico y bienestar</span>
        </article>
        <article class="standard-card panel">
          <strong>LEED v4.1</strong>
          <span>Criterios de eficiencia y calidad ambiental</span>
        </article>
        <article class="standard-card panel">
          <strong>OSHA / SRT</strong>
          <span>Seguridad e higiene en el trabajo</span>
        </article>
        <article class="standard-card panel">
          <strong>TLS 1.2+</strong>
          <span>Cifrado de datos en tránsito</span>
        </article>
      </div>
    </section>

    <!-- Business Value Pillars -->
    <section class="section page-width">
      <div class="section-heading">
        <span>RETORNO DE INVERSIÓN Y BIENESTAR</span>
        <h2>¿Por qué las empresas líderes<br />invierten en calidad ambiental?</h2>
      </div>

      <div class="pillars-grid">
        <article v-for="pillar in pillars" :key="pillar.title" class="pillar-card panel">
          <div class="pillar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path :d="pillar.icon" />
            </svg>
          </div>
          <span class="pillar-metric">{{ pillar.metric }}</span>
          <h3>{{ pillar.title }}</h3>
          <p>{{ pillar.text }}</p>
        </article>
      </div>
    </section>

    <!-- Interactive Live Telemetry Showcase -->
    <section class="showcase">
      <div class="page-width showcase-grid">
        <div>
          <span class="eyebrow dark">PLATAFORMA CLOUD CENTRALIZADA</span>
          <h2>Visibilidad inmediata de cada metro cuadrado de tu empresa.</h2>
          <p>
            Nuestra consola web conectada a Supabase Cloud y arquitectura Node.js procesa lecturas cada pocos segundos.
            Visualizá tendencias históricas, configurá umbrales de alerta y enviá informes de auditoría a la gerencia con un solo clic.
          </p>
          <ul class="showcase-list">
            <li>✓ Sincronización instantánea mediante WebSockets y Supabase Realtime.</li>
            <li>✓ Envío automatizado de resúmenes por correo electrónico a RRHH y Facilities.</li>
            <li>✓ Sin necesidad de instalar servidores locales ni configurar VPNs complejas.</li>
          </ul>
          <div style="margin-top: 30px; display: flex; gap: 14px; flex-wrap: wrap;">
            <RouterLink to="/documentacion/" class="button secondary" style="color: white; border-color: rgba(255,255,255,0.2);">
              Ver Funcionamiento
            </RouterLink>
          </div>
        </div>
        <div class="showcase-img-wrap">
          <img src="/assets/Fotos/DashboardLive.jpg" alt="Consola de Monitoreo Centralizado AirSense" />
        </div>
      </div>
    </section>

    <!-- Sectors / Use Cases -->
    <section class="section page-width">
      <div class="section-heading">
        <span>APLICACIONES CORPORATIVAS</span>
        <h2>Adaptado a las exigencias de tu industria</h2>
      </div>

      <div class="sectors-grid">
        <div v-for="sector in sectors" :key="sector.title" class="sector-card panel">
          <div class="sector-badge">Solución Personalizada</div>
          <h3>{{ sector.title }}</h3>
          <p>{{ sector.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Bottom Corporate CTA -->
    <section class="page-width" style="padding-bottom: 110px;">
      <div class="cta-section">
        <span>IMPLEMENTACIÓN RÁPIDA · SOPORTE TÉCNICO DEDICADO</span>
        <h2>Transformá el ambiente de tu empresa en una ventaja competitiva.</h2>
        <p style="max-width: 620px; margin: 15px auto 35px; color: #d4f8f2; font-size: 1.1rem; line-height: 1.6;">
          Agendá una reunión con nuestros asesores comerciales para dimensionar la cantidad de dispositivos óptima para tus instalaciones.
        </p>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          <button type="button" class="button light" style="font-weight: 800;" @click="showQuote = true">
            Solicitar Presupuesto Formal
          </button>
          <RouterLink to="/documentacion/" class="button" style="border: 1px solid rgba(255,255,255,.4); color: white;">
            Ver Funcionamiento
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Quote Modal -->
    <QuoteModal :show="showQuote" @close="showQuote = false" />
  </div>
</template>
