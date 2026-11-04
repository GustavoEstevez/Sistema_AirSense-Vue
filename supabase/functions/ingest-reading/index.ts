import {
  adminClient,
  constantTimeEqual,
  HttpError,
  isDanger,
  json,
  parseDeviceStatus,
  parseReading,
  preflight,
  rateLimit,
  readJsonBody,
  recordSecurityEvent,
  requestAddress,
  sendReadingEmail,
  sha256,
} from '../_shared/airsense.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return preflight(request)
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  const configuredKey = Deno.env.get('AIRSENSE_DEVICE_KEY') || ''
  const suppliedKey = request.headers.get('x-device-key') || ''
  if (!configuredKey || !suppliedKey || !await constantTimeEqual(suppliedKey, configuredKey)) {
    await recordSecurityEvent('ingest.authentication_failed', request, { severity: 'critical' })
    return json(request, { error: 'Dispositivo no autorizado.' }, 401)
  }

  try {
    const source = requestAddress(request)
    if (!await rateLimit('ingest:device', suppliedKey, 120, 60)
      || !await rateLimit('ingest:source', source, 240, 60)) {
      await recordSecurityEvent('ingest.rate_limited', request, { severity: 'critical' })
      throw new HttpError(429, 'El dispositivo superó el límite de lecturas.')
    }
    const payload = await readJsonBody<Record<string, unknown>>(request, 4096)
    const reading = parseReading(payload)
    const deviceStatus = parseDeviceStatus(payload)
    const supabase = adminClient()
    const { error: deviceError } = await supabase
      .from('devices')
      .upsert({ id: reading.device_id }, { onConflict: 'id', ignoreDuplicates: true })
    if (deviceError) throw deviceError
    const { error: statusError } = await supabase
      .from('devices')
      .update({
        ...deviceStatus,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reading.device_id)
    if (statusError) throw statusError
    const { data: saved, error } = await supabase
      .from('sensor_readings')
      .insert(reading)
      .select()
      .single()
    if (error) throw error

    let alertSent = false
    const recipient = (Deno.env.get('AIRSENSE_ALERT_EMAIL') || '').trim()
    if (recipient && isDanger(saved)) {
      const recipientHash = await sha256(recipient)
      const { data: claimId, error: claimError } = await supabase.rpc('claim_email_dispatch', {
        p_kind: 'automatic_alert',
        p_recipient_hash: recipientHash,
        p_reading_id: saved.id,
        p_cooldown_seconds: 180,
      })
      if (claimError) throw claimError
      if (claimId) {
        try {
          const providerId = await sendReadingEmail(recipient, saved, true)
          await supabase.from('email_dispatches').update({ status: 'sent', provider_id: providerId }).eq('id', claimId)
          alertSent = true
        } catch (mailError) {
          console.error('No se pudo enviar la alerta:', mailError)
          await supabase.from('email_dispatches').update({ status: 'failed' }).eq('id', claimId)
        }
      }
    }
    return json(request, { ok: true, id: saved.id, alertSent }, 201)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'No se pudo procesar la lectura.'
    const status = error instanceof HttpError ? error.status : message.includes('inválida') ? 400 : 500
    return json(request, { error: message }, status)
  }
})
