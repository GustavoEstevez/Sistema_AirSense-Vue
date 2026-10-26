<template>
  <footer class="site-footer">
    <div class="footer-grid page-width">
      <div class="footer-company-info">
        <RouterLink to="/" class="footer-brand">Air<span>Sense</span>™ <sub>Enterprise</sub></RouterLink>
        <p>
          Líderes en telemetría y monitoreo de calidad del aire interior (IAQ) para corporaciones, edificios sustentables y centros industriales.
          Tecnología IoT de alta precisión con arquitectura en la nube de nivel empresarial (Vue, Node.js y Supabase).
        </p>
        <div class="footer-cert-tags">
          <span>ASHRAE 62.1</span>
          <span>WELL Ready</span>
          <span>LEED v4.1</span>
          <span>ISO 14001 Compliant</span>
        </div>
      </div>

      <div class="footer-nav-col">
        <h4>Cotización Personalizada</h4>
        <RouterLink to="/">Visión General</RouterLink>
        <RouterLink to="/hardware/">Tecnología</RouterLink>
        <RouterLink to="/instalaciones/">Casos de Despliegue</RouterLink>
      </div>

      <div class="footer-nav-col">
        <h4>Técnica & IT</h4>
        <RouterLink to="/documentacion/">Funcionamiento</RouterLink>
        <RouterLink to="/documentacion/#arquitectura">Arquitectura Cloud</RouterLink>
        <RouterLink to="/documentacion/#rangos">Estándares Ambientales</RouterLink>
        <RouterLink to="/documentacion/#informes">Datasheets en PDF</RouterLink>
      </div>

      <div class="footer-nav-col">
        <h4>Atención Comercial</h4>
        <p class="contact-line">ventas@airsense.com</p>
        <p class="contact-line">Soporte SLA 99.9%</p>
        <p class="contact-line">Buenos Aires · LATAM</p>
        <a href="https://www.instagram.com/airsensearg/" target="_blank" rel="noopener" class="social-link">Instagram Corporativo ↗</a>
      </div>
    </div>

    <div class="footer-bottom page-width">
      <div>© {{ new Date().getFullYear() }} AirSense Technologies Inc. Todos los derechos reservados. Solución registrada para telemetría ambiental empresarial.</div>
      <div class="footer-legal">
        <span>Términos del Servicio</span>
        <span>Privacidad Empresarial</span>
        <span>Acuerdo de Nivel de Servicio (SLA)</span>
      </div>
    </div>
  </footer>
</template>
