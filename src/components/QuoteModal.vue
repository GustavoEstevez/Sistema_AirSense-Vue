<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const form = ref({
  name: '',
  company: '',
  email: '',
  phone: '',
  spaces: '1 a 3 espacios (Oficina)',
  notes: '',
})

const submitted = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function errorDetail(error) {
  const context = error?.context
  if (context && typeof context.clone === 'function') {
    try {
      const text = await context.clone().text()
      try {
        const body = JSON.parse(text)
        return body?.error || body?.message || ''
      } catch {
        return text.replace(/<[^>]*>/g, ' ').trim().slice(0, 180)
      }
    } catch {
      return ''
    }
  }
  return error instanceof Error ? error.message : ''
}

async function submitQuote() {
  if (!form.value.name || !form.value.email || !form.value.company) return
  errorMessage.value = ''
  loading.value = true
  try {
    const { supabase, supabaseConfigured } = await import('../lib/supabase')
    if (!supabaseConfigured || !supabase) {
      throw new Error('El servicio de correo no está configurado. Escribinos a ventas@airsense.com.')
    }
    const { data, error } = await supabase.functions.invoke('send-quote-email', {
      body: { ...form.value },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    submitted.value = true
  } catch (error) {
    const detail = await errorDetail(error)
    console.error('[send-quote-email]', detail || error)
    errorMessage.value = detail
      ? `No pudimos enviar la confirmación: ${detail}`
      : 'No pudimos enviar la confirmación por correo. Revisá tu conexión e intentá nuevamente.'
  } finally {
    loading.value = false
  }
}

function resetAndClose() {
  submitted.value = false
  errorMessage.value = ''
  emit('close')
}

watch(() => props.show, (visible) => {
  if (visible) errorMessage.value = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="quote-modal-overlay" role="dialog" aria-modal="true" @click.self="resetAndClose">
      <div class="quote-modal panel">
        <button type="button" class="close-btn" aria-label="Cerrar modal" @click="resetAndClose">×</button>

        <div v-if="submitted" class="quote-success">
          <div class="success-icon">✓</div>
          <h3>¡Solicitud recibida con éxito!</h3>
          <p>
            Gracias por tu interés en <strong>AirSense™ Enterprise</strong>. Enviamos una confirmación a
            <code>{{ form.email }}</code> y nuestro equipo de ventas corporativas se comunicará con
            <strong>{{ form.company }}</strong> en menos de 24 horas hábiles.
          </p>
          <div class="quote-summary">
            <div><span>Contacto:</span> <strong>{{ form.name }}</strong></div>
            <div><span>Alcance estimado:</span> <strong>{{ form.spaces }}</strong></div>
          </div>
          <button type="button" class="button primary" style="width: 100%; margin-top: 20px;" @click="resetAndClose">
            Volver a la plataforma
          </button>
        </div>

        <div v-else>
          <span class="eyebrow dark" style="margin-bottom: 12px;">COTIZACIÓN PERSONALIZADA</span>
          <h2>Solicitar Cotización Corporativa</h2>
          <p class="modal-sub">
            Equipá tus oficinas, salas de reuniones o plantas industriales con telemetría ambiental en tiempo real.
          </p>

          <form class="quote-form" @submit.prevent="submitQuote">
            <div class="form-row">
              <div class="form-group">
                <label for="q-name">Nombre y Apellido *</label>
                <input id="q-name" v-model.trim="form.name" type="text" required placeholder="Ej: Lic. Martín Gómez" />
              </div>
              <div class="form-group">
                <label for="q-company">Empresa / Organización *</label>
                <input id="q-company" v-model.trim="form.company" type="text" required placeholder="Ej: TechCorp S.A." />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="q-email">Correo Electrónico Corporativo *</label>
                <input id="q-email" v-model.trim="form.email" type="email" required placeholder="m.gomez@techcorp.com" />
              </div>
              <div class="form-group">
                <label for="q-phone">Teléfono de Contacto</label>
                <input id="q-phone" v-model.trim="form.phone" type="tel" placeholder="+54 9 11 5555-0123" />
              </div>
            </div>

            <div class="form-group">
              <label for="q-spaces">Cantidad estimada de espacios / sensores</label>
              <select id="q-spaces" v-model="form.spaces">
                <option value="1 a 3 espacios (Oficina)">1 a 3 espacios (Oficina / Coworking)</option>
                <option value="4 a 10 espacios (Sede Corporativa)">4 a 10 espacios (Sede Corporativa)</option>
                <option value="11 a 25 espacios (Edificio / Campus)">11 a 25 espacios (Edificio / Campus)</option>
                <option value="+25 espacios (Proyecto Industrial / Multi-sede)">+25 espacios (Proyecto Industrial / Multi-sede)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="q-notes">Requerimientos especiales o comentarios</label>
              <textarea id="q-notes" v-model.trim="form.notes" rows="2" placeholder="Ej: Integración con sistemas HVAC existentes, reporte semanal para RRHH..."></textarea>
            </div>

            <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

            <div class="form-footer">
              <small class="guarantee-note">Recibirás un correo de confirmación. Datos confidenciales para emisión de propuesta formal. Sin compromiso de compra.</small>
              <button type="submit" class="button primary" :disabled="loading" style="min-width: 190px;">
                {{ loading ? 'Enviando solicitud…' : 'Enviar Solicitud de Cotización →' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
