<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'

const route = useRoute()

function updateTitle() {
  document.title = route.meta.title ? `${route.meta.title} · AirSense` : 'AirSense'
}

onMounted(updateTitle)
watch(() => route.fullPath, () => {
  updateTitle()
  window.scrollTo({ top: 0, behavior: 'instant' })
})
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main>
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>
