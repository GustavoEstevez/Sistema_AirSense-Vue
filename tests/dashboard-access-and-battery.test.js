import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRenderer, nextTick, ref } from 'vue'
import { BATTERY_REFRESH_MS, useSampledBattery } from '../src/composables/useSampledBattery.js'
import { edgeFunctionErrorMessage } from '../src/lib/edgeFunctionError.js'

test('dashboard route requires an authenticated session', async () => {
  const router = await readFile(new URL('../src/router.js', import.meta.url), 'utf8')
  assert.match(router, /path: '\/dashboard\/'[^\n]+requiresAuth: true/)
})

test('site header exposes account access on desktop and mobile', async () => {
  const header = await readFile(new URL('../src/components/SiteHeader.vue', import.meta.url), 'utf8')
  assert.match(header, /class="utility-link">Iniciar sesión/)
  assert.match(header, /class="mobile-account-links"/)
  assert.match(header, /to="\/cuenta\/ingresar\/"/)
})

test('edge function failures prefer server detail and localize transport errors', async () => {
  assert.equal(
    await edgeFunctionErrorMessage({ context: { json: async () => ({ error: 'Origen no permitido.' }) } }, 'Servicio no disponible.'),
    'Origen no permitido.',
  )
  assert.equal(
    await edgeFunctionErrorMessage({ message: 'Failed to send a request to the Edge Function' }, 'Servicio no disponible.'),
    'Servicio no disponible.',
  )
})

test('readings keep a polling fallback and local HTTP-safe channel identifiers', async () => {
  const readings = await readFile(new URL('../src/composables/useReadings.js', import.meta.url), 'utf8')
  const channels = await readFile(new URL('../src/lib/realtimeChannel.js', import.meta.url), 'utf8')
  assert.match(readings, /SNAPSHOT_REFRESH_MS = 15_000/)
  assert.match(readings, /setInterval\(\(\) => \{ void load\(\{ silent: true \}\) \}, SNAPSHOT_REFRESH_MS\)/)
  assert.match(channels, /crypto\?\.randomUUID\?\.\(\)/)
  assert.match(channels, /Math\.random\(\)/)
})

test('battery stays stable for one minute and refreshes immediately on station change', async () => {
  const previousWindow = globalThis.window
  const intervals = []
  globalThis.window = {
    setInterval(callback, delay) {
      intervals.push({ callback, delay })
      return intervals.length
    },
  }

  let app
  try {
    const device = ref({ id: 'A', battery_percent: 50 })
    let sampledBattery
    const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} })
    app = renderer.createApp({
      setup() {
        sampledBattery = useSampledBattery(device)
        return () => null
      },
    })
    app.mount({})

    assert.equal(intervals.length, 1)
    assert.equal(intervals[0].delay, BATTERY_REFRESH_MS)
    assert.equal(sampledBattery.value, 50)

    device.value = { ...device.value, battery_percent: 52 }
    assert.equal(sampledBattery.value, 50)

    intervals[0].callback()
    assert.equal(sampledBattery.value, 52)

    device.value = { id: 'B', battery_percent: 81 }
    await nextTick()
    assert.equal(sampledBattery.value, 81)
  } finally {
    app?.unmount()
    globalThis.window = previousWindow
  }
})
