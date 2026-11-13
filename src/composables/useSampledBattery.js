import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

export const BATTERY_REFRESH_MS = 60_000

export function useSampledBattery(device, refreshMs = BATTERY_REFRESH_MS) {
  const sampledPercent = ref(null)
  let timer

  function sample() {
    sampledPercent.value = unref(device)?.battery_percent ?? null
  }

  // A different station must be shown immediately. Updates from the same
  // station are intentionally sampled so voltage noise does not make the UI
  // percentage jump with every realtime telemetry event.
  watch(() => unref(device)?.id, sample, { immediate: true })

  onMounted(() => {
    sample()
    timer = window.setInterval(sample, refreshMs)
  })

  onBeforeUnmount(() => clearInterval(timer))

  return computed(() => sampledPercent.value)
}
