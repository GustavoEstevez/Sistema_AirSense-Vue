import {
  adminClient,
  HttpError,
  json,
  preflight,
  rateLimit,
  readJsonBody,
  recordSecurityEvent,
  requestAddress,
  sendMail,
  sha256,
} from '../_shared/airsense.ts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type QuoteRequest = {
  name: string
  company: string
  email: string
  phone: string
  spaces: string
  notes: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function clean(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max)
}

function parseQuote(payload: Record<string, unknown>): QuoteRequest {
  const quote = {
    name: clean(payload.name, 120),
    company: clean(payload.company, 160),
    email: clean(payload.email, 254).toLowerCase(),
    phone: clean(payload.phone, 40),
    spaces: clean(payload.spaces, 120) || 'Sin especificar',
    notes: clean(payload.notes, 2000),
  }
  if (quote.name.length < 2) throw new HttpError(400, 'El nombre es obligatorio.')
  if (quote.company.length < 2) throw new HttpError(400, 'La empresa es obligatoria.')
  if (!EMAIL.test(quote.email)) throw new HttpError(400, 'El correo electrónico no es válido.')
  return quote
}

async function verifyTurnstile(token: string, request: Request) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')?.trim()
  if (!secret) return
  if (!token) throw new HttpError(400, 'Completá la verificación anti-bot.')
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: requestAddress(request),
  })
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(8000),
  })
  const result = await response.json() as { success?: boolean }
  if (!response.ok || !result.success) throw new HttpError(400, 'La verificación anti-bot no fue válida.')
}

function summaryRows(quote: QuoteRequest) {
  const rows = [
    ['Contacto', quote.name],
    ['Empresa', quote.company],
    ['Correo', quote.email],
    ['Teléfono', quote.phone || 'No informado'],
    ['Alcance estimado', quote.spaces],
  ]
  if (quote.notes) rows.push(['Requerimientos', quote.notes])
  return rows
    .map(([label, value]) => `<tr><td style="padding:9px 0;color:#52727b;vertical-align:top;width:38%">${escapeHtml(label)}</td><td style="padding:9px 0;color:#082f3a;font-weight:700;text-align:right;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`)
    .join('')
}

function confirmationHtml(quote: QuoteRequest) {
  return `<!doctype html><html><body style="margin:0;background:#eef8f8;font-family:Arial,sans-serif;color:#082f3a"><div style="max-width:560px;margin:30px auto;padding:28px;background:#fff;border:1px solid #cfe5e6;border-radius:18px"><p style="margin:0 0 8px;color:#088395;font-size:12px;font-weight:700;letter-spacing:1.5px">AIRSENSE ENTERPRISE</p><h1 style="margin:0 0 12px;font-size:26px">Recibimos tu solicitud</h1><p style="margin:0 0 18px;color:#52727b;line-height:1.65">Hola ${escapeHtml(quote.name)}, gracias por contactar a AirSense. Confirmamos que tu solicitud de cotización para <strong style="color:#082f3a">${escapeHtml(quote.company)}</strong> llegó correctamente. Un especialista comercial se comunicará con vos en menos de 24 horas hábiles.</p><table style="width:100%;border-collapse:collapse;border-top:1px solid #dcebec;border-bottom:1px solid #dcebec">${summaryRows(quote)}</table><p style="margin:20px 0 0;color:#52727b;line-height:1.65;font-size:14px">Si necesitás agregar información, respondé directamente a este correo.</p><p style="margin:24px 0 0;color:#78949b;font-size:12px">AirSense — Monitoreo Ambiental Corporativo</p></div></body></html>`
}

function salesHtml(quote: QuoteRequest) {
  return `<!doctype html><html><body style="margin:0;background:#eef8f8;font-family:Arial,sans-serif;color:#082f3a"><div style="max-width:560px;margin:30px auto;padding:28px;background:#fff;border:1px solid #cfe5e6;border-radius:18px"><p style="margin:0 0 8px;color:#088395;font-size:12px;font-weight:700;letter-spacing:1.5px">NUEVA OPORTUNIDAD</p><h1 style="margin:0 0 12px;font-size:24px">Solicitud de cotización</h1><table style="width:100%;border-collapse:collapse;border-top:1px solid #dcebec;border-bottom:1px solid #dcebec">${summaryRows(quote)}</table><p style="margin:20px 0 0;color:#78949b;font-size:12px">Enviado automáticamente desde el sitio de AirSense.</p></div></body></html>`
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  return sendMail({ to, subject, html, replyTo })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return preflight(request)
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  try {
    const source = requestAddress(request)
    if (!await rateLimit('quote:source', source, 5, 600)
      || !await rateLimit('quote:global', 'all', 100, 3600)) {
      await recordSecurityEvent('quote.rate_limited', request)
      throw new HttpError(429, 'Demasiadas solicitudes. Intentá nuevamente más tarde.')
    }
    const payload = await readJsonBody<Record<string, unknown>>(request, 8192)
    if (String(payload.website || '').trim()) {
      await recordSecurityEvent('quote.honeypot', request)
      throw new HttpError(400, 'No se pudo validar la solicitud.')
    }
    await verifyTurnstile(String(payload.turnstileToken || ''), request)
    const quote = parseQuote(payload)
    const supabase = adminClient()
    const recipientHash = await sha256(quote.email)
    const { data: claimId, error: claimError } = await supabase.rpc('claim_email_dispatch', {
      p_kind: 'quote_confirmation',
      p_recipient_hash: recipientHash,
      p_reading_id: null,
      p_cooldown_seconds: 60,
    })
    if (claimError) throw claimError
    if (!claimId) return json(request, { error: 'Esperá un minuto antes de volver a enviar.' }, 429)

    try {
      const providerId = await sendEmail(
        quote.email,
        'Recibimos tu solicitud de cotización — AirSense Enterprise',
        confirmationHtml(quote),
      )
      await supabase.from('email_dispatches').update({ status: 'sent', provider_id: providerId }).eq('id', claimId)
    } catch (mailError) {
      await supabase.from('email_dispatches').update({ status: 'failed' }).eq('id', claimId)
      throw mailError
    }

    const salesEmail = Deno.env.get('AIRSENSE_SALES_EMAIL') || Deno.env.get('AIRSENSE_ALERT_EMAIL')
    if (salesEmail && EMAIL.test(salesEmail)) {
      try {
        await sendEmail(
          salesEmail,
          `Nueva solicitud de cotización: ${quote.company}`,
          salesHtml(quote),
          quote.email,
        )
      } catch (salesError) {
        console.error('No se pudo notificar al equipo comercial.', salesError)
      }
    }

    return json(request, { ok: true })
  } catch (error) {
    console.error(error)
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof HttpError ? error.message : 'No se pudo enviar la confirmación.'
    return json(request, { error: message }, status)
  }
})
