export async function edgeFunctionErrorMessage(error, fallback) {
  try {
    const payload = await error?.context?.json()
    const detail = String(payload?.error || '').trim()
    if (detail) return detail
  } catch { /* La respuesta puede no contener JSON o haber sido consumida. */ }

  const message = String(error?.message || '').trim()
  if (!message || /edge function|failed to send a request/i.test(message)) return fallback
  return message
}
