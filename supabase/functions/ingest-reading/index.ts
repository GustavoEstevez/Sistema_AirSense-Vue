import {
  adminClient,
  corsHeaders,
  isDanger,
  json,
  parseReading,
  sendWithResend,
  sha256,
} from '../_shared/airsense.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  const configuredKey = Deno.env.get('AIRSENSE_DEVICE_KEY') || ''
  const suppliedKey = request.headers.get('x-device-key') || ''
  if (!configuredKey || suppliedKey !== configuredKey) return json(request, { error: 'Dispositivo no autorizado.' }, 401)

  try {
    const payload = await request.json()
    const reading = parseReading(payload)
    const supabase = adminClient()
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
          const providerId = await sendWithResend(recipient, saved, true)
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
    return json(request, { error: message }, message.includes('inválida') ? 400 : 500)
  }
})
