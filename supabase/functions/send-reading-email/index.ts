import { adminClient, corsHeaders, json, sendReadingEmail, sha256 } from '../_shared/airsense.ts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  try {
    const { email, readingId } = await request.json()
    const recipient = String(email || '').trim().toLowerCase()
    if (!EMAIL.test(recipient) || recipient.length > 254) return json(request, { error: 'Correo inválido.' }, 400)

    const supabase = adminClient()
    let query = supabase.from('sensor_readings').select('*')
    query = readingId ? query.eq('id', readingId).limit(1) : query.order('recorded_at', { ascending: false }).limit(1)
    const { data, error } = await query
    if (error) throw error
    const reading = data?.[0]
    if (!reading) return json(request, { error: 'No hay lecturas para enviar.' }, 404)

    const recipientHash = await sha256(recipient)
    const { data: claimId, error: claimError } = await supabase.rpc('claim_email_dispatch', {
      p_kind: 'manual_reading',
      p_recipient_hash: recipientHash,
      p_reading_id: reading.id,
      p_cooldown_seconds: 60,
    })
    if (claimError) throw claimError
    if (!claimId) return json(request, { error: 'Esperá un minuto antes de volver a enviar.' }, 429)

    try {
      const providerId = await sendReadingEmail(recipient, reading, false)
      await supabase.from('email_dispatches').update({ status: 'sent', provider_id: providerId }).eq('id', claimId)
      return json(request, { ok: true })
    } catch (mailError) {
      await supabase.from('email_dispatches').update({ status: 'failed' }).eq('id', claimId)
      throw mailError
    }
  } catch (error) {
    console.error(error)
    return json(request, { error: error instanceof Error ? error.message : 'No se pudo enviar el correo.' }, 500)
  }
})
