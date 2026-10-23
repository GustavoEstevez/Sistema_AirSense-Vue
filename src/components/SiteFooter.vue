<template>
  <footer class="site-footer">
    <div class="footer-grid page-width">
      <div>
        <RouterLink to="/" class="footer-brand">Air<span>Sense</span></RouterLink>
        <p>Una estación ambiental creada por estudiantes para entender y mejorar los espacios que habitamos.</p>
      </div>
      <div class="footer-links">
        <RouterLink to="/dashboard/">Dashboard</RouterLink>
        <RouterLink to="/documentacion/">Documentación</RouterLink>
        <RouterLink to="/galeria/">Galería</RouterLink>
        <a href="https://www.instagram.com/airsensearg/" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
    <div class="footer-bottom page-width">© {{ new Date().getFullYear() }} AirSense · Buenos Aires, Argentina</div>
  </footer>
</template>
