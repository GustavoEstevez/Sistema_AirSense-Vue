import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-types="npm:@types/nodemailer@6.4.17"
import nodemailer from 'npm:nodemailer@6.9.16'

export type Reading = {
  id?: string
  temperature: number
  humidity: number
  noise: number
  co2: number
  device_id?: string
  recorded_at?: string
}

export function corsHeaders(request: Request) {
  const allowed = Deno.env.get('ALLOWED_ORIGIN') || '*'
  const origin = request.headers.get('origin') || ''
  const resolved = allowed === '*' || allowed.split(',').map((item) => item.trim()).includes(origin)
    ? (allowed === '*' ? '*' : origin)
    : allowed.split(',')[0].trim()
  return {
    'Access-Control-Allow-Origin': resolved,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  }
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) })
}

export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export function parseReading(payload: Record<string, unknown>): Omit<Reading, 'id' | 'recorded_at'> {
  const temperature = Number(payload.temperatura ?? payload.temperature)
  const humidity = Number(payload.humedad ?? payload.humidity)
  const noise = Number(payload.ruido ?? payload.noise)
  const co2 = Number(payload.co2)
  const device_id = String(payload.device_id ?? 'airsense-01').trim()
  const valid = Number.isFinite(temperature) && temperature >= -40 && temperature <= 85
    && Number.isFinite(humidity) && humidity >= 0 && humidity <= 100
    && Number.isFinite(noise) && noise >= 0 && noise <= 160
    && Number.isFinite(co2) && co2 >= 0 && co2 <= 10000
    && device_id.length >= 1 && device_id.length <= 80
  if (!valid) throw new Error('Lectura inválida o fuera de rango.')
  return { temperature, humidity, noise, co2, device_id }
}

export function isDanger(reading: Reading) {
  return reading.temperature < 15 || reading.temperature > 30
    || reading.humidity < 30 || reading.humidity > 70
    || reading.noise > 70 || reading.co2 > 1200
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function metricRow(label: string, value: number, unit: string) {
  return `<tr><td style="padding:10px 0;color:#52727b">${label}</td><td style="padding:10px 0;text-align:right;font-weight:700;color:#0a4c60">${value.toFixed(1)} ${unit}</td></tr>`
}

export function emailHtml(reading: Reading, alert: boolean) {
  const title = alert ? 'Alerta ambiental de AirSense' : 'Lectura actual de AirSense'
  const lead = alert
    ? 'Una o más variables superaron el rango recomendado. Ventilá el espacio y revisá las mediciones.'
    : 'Este es el resumen de la última lectura de tu estación.'
  return `<!doctype html><html><body style="margin:0;background:#eef8f8;font-family:Arial,sans-serif;color:#082f3a"><div style="max-width:560px;margin:30px auto;padding:28px;background:#fff;border:1px solid #cfe5e6;border-radius:18px"><p style="margin:0 0 8px;color:#088395;font-size:12px;font-weight:700;letter-spacing:1.5px">AIRSENSE</p><h1 style="margin:0;font-size:26px">${title}</h1><p style="color:#52727b;line-height:1.6">${lead}</p><table style="width:100%;border-collapse:collapse;border-top:1px solid #dcebec;border-bottom:1px solid #dcebec">${metricRow('Temperatura', reading.temperature, '°C')}${metricRow('Humedad', reading.humidity, '%')}${metricRow('Ruido', reading.noise, 'dB')}${metricRow('CO₂', reading.co2, 'ppm')}</table><p style="margin-top:20px;color:#78949b;font-size:12px">Medición: ${new Date(reading.recorded_at || Date.now()).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p></div></body></html>`
}

export async function sendMail(options: { to: string; subject: string; html: string; replyTo?: string }) {
  const host = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
  const port = Number(Deno.env.get('SMTP_PORT') || 465)
  const user = Deno.env.get('SMTP_USER')?.trim()
  const pass = Deno.env.get('SMTP_PASS')?.replaceAll(' ', '')
  const from = Deno.env.get('SMTP_FROM')?.trim() || user
  const senderName = Deno.env.get('SMTP_SENDER_NAME')?.trim() || 'AirSense'
  if (!user || !pass || !from) throw new Error('El servidor SMTP no está configurado.')

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2', servername: host },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })
  const result = await transporter.sendMail({
    from: { name: senderName, address: from },
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  })
  return result.messageId as string
}

export function sendReadingEmail(to: string, reading: Reading, alert: boolean) {
  return sendMail({
    to,
    subject: alert ? '⚠️ AirSense detectó un ambiente no saludable' : 'Tu lectura actual de AirSense',
    html: emailHtml(reading, alert),
  })
}
