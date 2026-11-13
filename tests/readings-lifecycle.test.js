import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRenderer, reactive, ref } from 'vue'
import { READING_FRESHNESS_MS } from '../src/lib/dashboardPresentation.js'

// Exercise the real composable with a controlled Supabase transport and Vue lifecycle.
test('station changes, late snapshots, realtime overlap and reconnect stay isolated', async () => {
  const pending = []
  const channels = []
  const removed = []
  const transport = {
    from() {
      const query = { device: '', select() { return this }, eq(key, value) { this.device = value; return this }, order() { return this },
        limit() { return new Promise(resolve => pending.push({ device: this.device, resolve })) } }
      return query
    },
    channel() {
      const channel = { on(type, filter, callback) { this.insert = callback; return this }, subscribe(callback) { this.status = callback; return this } }
      channels.push(channel)
      return channel
    },
    removeChannel(channel) { removed.push(channel); return Promise.resolve() },
  }
  const previousWindow = globalThis.window
  const events = new EventTarget()
  globalThis.window = Object.assign(events, { setInterval: () => undefined })
  globalThis.__readingsTransport = transport
  let app
  try {
    let source = await readFile(new URL('../src/composables/useReadings.js', import.meta.url), 'utf8')
    source = source.replace("from 'vue'", `from '${import.meta.resolve('vue')}'`)
      .replace("import { supabase, supabaseConfigured } from '../lib/supabase'", 'const supabase = globalThis.__readingsTransport; const supabaseConfigured = true')
      .replace("from '../lib/dashboardPresentation'", `from '${new URL('../src/lib/dashboardPresentation.js', import.meta.url).href}'`)
      .replace("import { realtimeChannelName } from '../lib/realtimeChannel'", "const realtimeChannelName = prefix => prefix + '-test'")
      .replace("import.meta.env.VITE_ENABLE_DEMO === 'true'", 'false')
    const { useReadings } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
    const selected = ref('A')
    let state
    const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} })
    app = renderer.createApp({ setup() { state = useReadings(selected); return () => null } })
    app.mount({})
    const row = (id, device_id, time) => ({ id, device_id, recorded_at: new Date(time).toISOString() })
    const settle = async () => { await Promise.resolve(); await Promise.resolve() }
    assert.equal(pending[0].device, 'A')
    selected.value = 'B'
    assert.equal(channels.length, 2)
    assert.ok(removed.includes(channels[0]))
    channels[0].insert({ new: row('late-event', 'A', 1000) })
    pending[1].resolve({ data: [row('b1', 'B', 1000)] })
    await settle()
    pending[0].resolve({ data: [row('a1', 'A', 1000)] })
    await settle()
    assert.deepEqual(state.readings.value.map(item => item.id), ['b1'])
    assert.equal(state.loading.value, false)
    channels[1].status('SUBSCRIBED')
    assert.equal(pending.length, 3)
    channels[1].insert({ new: row('b2', 'B', 2000) })
    pending[2].resolve({ data: [row('b2', 'B', 2000), row('b1', 'B', 1000)] })
    await settle()
    assert.deepEqual(state.readings.value.map(item => item.id), ['b1', 'b2'])
    channels[1].status('CHANNEL_ERROR')
    assert.equal(state.realtimeConnected.value, false)
    channels[1].status('SUBSCRIBED')
    pending[3].resolve({ data: [row('b3', 'B', 3000)] })
    await settle()
    assert.equal(state.latest.value.id, 'b3')
    events.dispatchEvent(new Event('online'))
    assert.equal(pending.length, 5)
    selected.value = ''
    pending[4].resolve({ data: [row('late', 'B', 4000)] })
    await settle()
    assert.deepEqual(state.readings.value, [])
    assert.equal(channels.length, 2)
    app.unmount()
    app = null
    channels[1].insert({ new: row('after-unmount', 'B', 5000) })
    assert.deepEqual(state.readings.value, [])
  } finally {
    app?.unmount()
    globalThis.window = previousWindow
    delete globalThis.__readingsTransport
  }
})

test('history never queries without a station and rejects old results across station and period changes', async () => {
  const pending = []
  globalThis.__historyTransport = {
    rpc(name, args) {
      const query = { select() { return this }, order() { return this }, range() { return this }, gte() { return this },
        eq(key, value) { this.device = value; return this },
        abortSignal(signal) { this.signal = signal; return this },
        then(resolve) { return new Promise(done => pending.push({ device: this.device, signal: this.signal, resolve: done })).then(resolve) },
      }
      query.device = args.p_device_id
      return query
    },
  }
  let app
  try {
    const file = await readFile(new URL('../src/components/HistoricalDashboard.vue', import.meta.url), 'utf8')
    let script = file.split('<script setup>')[1].split('</script>')[0].replace(/\r\n/g, '\n')
    script = script.replace(/^import .*\n/gm, '').replace(/^const props = defineProps.*\n/m, '')
      .replace("import.meta.env.VITE_ENABLE_DEMO === 'true'", 'false')
    const source = `import { computed, onBeforeUnmount, ref, watch } from '${import.meta.resolve('vue')}';
      import { loadHistorySummary } from '${new URL('../src/lib/historySummary.js', import.meta.url).href}';
      const supabase = globalThis.__historyTransport;
      export function setup(props) { ${script}; return { readings, loading, error, selectPeriod }; }`
    const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
    const props = reactive({ deviceId: '', reconnectKey: false })
    let state
    const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} })
    app = renderer.createApp({ setup() { state = module.setup(props); return () => null } })
    app.mount({})
    const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
    await settle()
    assert.equal(pending.length, 0)
    props.deviceId = 'A'
    await settle()
    props.deviceId = 'B'
    await settle()
    assert.equal(pending[0].signal.aborted, true)
    assert.equal(pending[1].device, 'B')
    pending[1].resolve({ data: { points: [{ id: 'B', device_id: 'B' }], total_count: 5000 } })
    await settle()
    pending[0].resolve({ data: { points: [{ id: 'A', device_id: 'A' }], total_count: 100 } })
    await settle()
    assert.deepEqual(state.readings.value.map(row => row.id), ['B'])
    void state.selectPeriod('week')
    await settle()
    void state.selectPeriod('month')
    await settle()
    pending[2].resolve({ error: new Error('old failure') })
    await settle()
    assert.equal(state.loading.value, true)
    assert.equal(state.error.value, '')
    props.deviceId = ''
    pending[3].resolve({ data: { points: [{ id: 'late', device_id: 'B' }], total_count: 100 } })
    await settle()
    assert.deepEqual(state.readings.value, [])
    assert.equal(state.loading.value, false)
  } finally {
    app?.unmount()
    delete globalThis.__historyTransport
  }
})

test('AI results and loading state cannot leak from an older station or request', async () => {
  const pending = []
  const previousStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: () => null }
  globalThis.__aiTransport = { functions: { invoke: () => new Promise(resolve => pending.push(resolve)) } }
  let app
  try {
    const file = await readFile(new URL('../src/components/SmartRecommendations.vue', import.meta.url), 'utf8')
    const script = file.split('<script setup>')[1].split('</script>')[0].replace(/\r\n/g, '\n')
      .replace(/^import .*\n/gm, '').replace(/^const props = defineProps.*\n/m, '')
    const source = `import { computed, onBeforeUnmount, ref, watch } from '${import.meta.resolve('vue')}';
      import { recommendations } from '${new URL('../src/lib/environment.js', import.meta.url).href}';
      import { isFreshReading } from '${new URL('../src/lib/dashboardPresentation.js', import.meta.url).href}';
      const supabase = globalThis.__aiTransport;
      const useAuth = () => ({ isAuthenticated: ref(true) });
      export function setup(props) { ${script}; return { aiTips, loading, error, refreshWithAi }; }`
    const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
    const row = device_id => ({ id: device_id, device_id, recorded_at: new Date().toISOString(), temperature: 22 })
    const props = reactive({ reading: row('A'), fresh: true, demo: false, now: Date.now() })
    let state
    const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} })
    app = renderer.createApp({ setup() { state = module.setup(props); return () => null } })
    app.mount({})
    const old = state.refreshWithAi()
    props.reading = row('B')
    const current = state.refreshWithAi()
    pending[0]({ data: { recommendations: ['Advice from A'] } })
    await old
    assert.deepEqual(state.aiTips.value, [])
    assert.equal(state.loading.value, true)
    pending[1]({ data: { recommendations: ['Advice from B'] } })
    await current
    assert.deepEqual(state.aiTips.value, ['Advice from B'])
    const next = state.refreshWithAi()
    props.reading = { ...row('B'), id: 'B-next' }
    pending[2]({ data: { recommendations: ['Snapshot from B'] } })
    await next
    assert.deepEqual(state.aiTips.value, ['Snapshot from B'])
    props.now = Date.now() + READING_FRESHNESS_MS + 1000
    await Promise.resolve()
    assert.deepEqual(state.aiTips.value, [])
    props.fresh = false
    assert.deepEqual(state.aiTips.value, [])
    await state.refreshWithAi()
    assert.equal(pending.length, 3)
  } finally {
    app?.unmount()
    globalThis.localStorage = previousStorage
    delete globalThis.__aiTransport
  }
})
