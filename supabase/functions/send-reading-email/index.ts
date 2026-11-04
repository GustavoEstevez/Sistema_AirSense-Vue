import {
  HttpError,
  json,
  preflight,
  rateLimit,
  readJsonBody,
  recordSecurityEvent,
  requireUser,
  sendReadingEmail,
  sha256,
  userClient,
} from '../_shared/airsense.ts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return preflight(request)
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  try {
    const { admin, user, token } = await requireUser(request)
    if (!await rateLimit('manual-reading:user', user.id, 10, 600)) {
      await recordSecurityEvent('manual_reading.rate_limited', request, { actorId: user.id })
      throw new HttpError(429, 'Demasiados envíos. Esperá unos minutos antes de volver a intentar.')
    }

    const payload = await readJsonBody<{ email?: unknown; readingId?: unknown }>(request, 2048)
    const recipient = String(payload.email || '').trim().toLowerCase()
    const readingId = String(payload.readingId || '').trim()
    if (!EMAIL.test(recipient) || recipient.length > 254) throw new HttpError(400, 'Correo inválido.')
    if (readingId && !UUID.test(readingId)) throw new HttpError(400, 'Lectura inválida.')
    if (!await rateLimit('manual-reading:recipient', `${user.id}:${recipient}`, 3, 3600)) {
      throw new HttpError(429, 'Alcanzaste el límite de envíos para ese destinatario.')
    }

    // Use the caller's JWT so row-level security remains the authorization boundary.
    const scoped = userClient(token)
    let query = scoped
      .from('sensor_readings')
      .select('id, device_id, temperature, humidity, noise, co2, recorded_at')
    query = readingId ? query.eq('id', readingId).limit(1) : query.order('recorded_at', { ascending: false }).limit(1)
    const { data, error } = await query
    if (error) throw error
    const reading = data?.[0]
    if (!reading) throw new HttpError(404, 'No hay una lectura autorizada para enviar.')

    const recipientHash = await sha256(recipient)
    const { data: claimId, error: claimError } = await admin.rpc('claim_email_dispatch', {
      p_kind: 'manual_reading',
      p_recipient_hash: recipientHash,
      p_reading_id: reading.id,
      p_cooldown_seconds: 60,
    })
    if (claimError) throw claimError
    if (!claimId) throw new HttpError(429, 'Esperá un minuto antes de volver a enviar.')

    try {
      const providerId = await sendReadingEmail(recipient, reading, false)
      await admin.from('email_dispatches').update({ status: 'sent', provider_id: providerId }).eq('id', claimId)
      return json(request, { ok: true })
    } catch (mailError) {
      await admin.from('email_dispatches').update({ status: 'failed' }).eq('id', claimId)
      throw mailError
    }
  } catch (error) {
    console.error(error)
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof HttpError ? error.message : 'No se pudo enviar el correo.'
    return json(request, { error: message }, status)
  }
})
