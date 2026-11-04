import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-types="npm:@types/nodemailer@6.4.17"
import nodemailer from 'npm:nodemailer@6.9.16'

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://localhost',
  'capacitor://localhost',
])

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function configuredOrigins() {
  const configured = Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('ALLOWED_ORIGIN') || ''
  return new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...configured.split(',').map((item) => item.trim()).filter(Boolean),
  ])
}

export function isOriginAllowed(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || configuredOrigins().has(origin)
}

export type Reading = {
  id?: string
  temperature: number
  humidity: number
  noise: number
  co2: number
  device_id?: string
  recorded_at?: string
}

export type DeviceStatus = {
  wifi_rssi?: number
  uptime_seconds?: number
  firmware_version?: string
  battery_percent?: number
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || ''
  const allowed = isOriginAllowed(request)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Vary': 'Origin',
  }
  if (origin && allowed) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

export function preflight(request: Request) {
  if (!isOriginAllowed(request)) return json(request, { error: 'Origen no permitido.' }, 403)
  return new Response(null, { status: 204, headers: corsHeaders(request) })
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

export function userClient(token: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  )
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new HttpError(401, 'Iniciá sesión para continuar.')
  const admin = adminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) throw new HttpError(401, 'La sesión no es válida o venció.')
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role_slug, status')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError || !profile || profile.status !== 'active') {
    throw new HttpError(403, 'La cuenta no está habilitada.')
  }
  return { admin, user, profile, token }
}

function decodeJwtPayload(token: string) {
  try {
    const encoded = token.split('.')[1]
    if (!encoded) return {} as Record<string, unknown>
    const normalized = encoded.replaceAll('-', '+').replaceAll('_', '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return {} as Record<string, unknown>
  }
}

export function requireAal2(token: string) {
  if (decodeJwtPayload(token).aal !== 'aal2') {
    throw new HttpError(403, 'Esta operación requiere autenticación de doble factor.')
  }
}

export async function readJsonBody<T = Record<string, unknown>>(request: Request, maxBytes: number): Promise<T> {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'El contenido debe enviarse como JSON.')
  }
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > maxBytes) throw new HttpError(413, 'La solicitud es demasiado grande.')
  if (!request.body) throw new HttpError(400, 'La solicitud no contiene datos.')

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel()
      throw new HttpError(413, 'La solicitud es demasiado grande.')
    }
    chunks.push(value)
  }
  const combined = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(combined)) as T
  } catch {
    throw new HttpError(400, 'El JSON enviado no es válido.')
  }
}

export function requestAddress(request: Request) {
  return (request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]
    || 'unknown').trim().slice(0, 80)
}

export async function rateLimit(bucket: string, key: string, maxHits: number, windowSeconds: number) {
  const keyHash = await sha256(key)
  const { data, error } = await adminClient().rpc('claim_api_rate_limit', {
    p_bucket: bucket,
    p_key_hash: keyHash,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  })
  if (error) throw error
  return Boolean(data)
}

export async function recordSecurityEvent(
  eventType: string,
  request: Request,
  options: { actorId?: string | null; severity?: 'info' | 'warning' | 'critical'; metadata?: Record<string, unknown> } = {},
) {
  try {
    await adminClient().from('security_events').insert({
      event_type: eventType.slice(0, 80),
      severity: options.severity || 'warning',
      actor_id: options.actorId || null,
      source_hash: await sha256(requestAddress(request)),
      metadata: options.metadata || {},
    })
  } catch (error) {
    console.error('No se pudo registrar el evento de seguridad.', error)
  }
}

export async function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder()
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ])
  const a = new Uint8Array(leftHash)
  const b = new Uint8Array(rightHash)
  let difference = a.length ^ b.length
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index % a.length] || 0) ^ (b[index % b.length] || 0)
  }
  return difference === 0
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

export function parseDeviceStatus(payload: Record<string, unknown>): DeviceStatus {
  const status: DeviceStatus = {}
  const wifiRssi = Number(payload.wifi_rssi)
  const uptimeSeconds = Number(payload.uptime_seconds)
  const firmwareVersion = typeof payload.firmware_version === 'string'
    ? payload.firmware_version.trim()
    : ''
  const batteryPercent = Number(payload.battery_percent)

  if (payload.wifi_rssi != null) {
    if (!Number.isFinite(wifiRssi) || wifiRssi < -120 || wifiRssi > 0) {
      throw new Error('La señal Wi-Fi informada no es válida.')
    }
    status.wifi_rssi = Math.round(wifiRssi)
  }
  if (payload.uptime_seconds != null) {
    if (!Number.isFinite(uptimeSeconds) || uptimeSeconds < 0 || uptimeSeconds > 315_576_000) {
      throw new Error('El tiempo encendido informado no es válido.')
    }
    status.uptime_seconds = Math.floor(uptimeSeconds)
  }
  if (payload.firmware_version != null) {
    if (!firmwareVersion || firmwareVersion.length > 40 || !/^[a-zA-Z0-9._+-]+$/.test(firmwareVersion)) {
      throw new Error('La versión de firmware informada no es válida.')
    }
    status.firmware_version = firmwareVersion
  }
  if (payload.battery_percent != null) {
    if (!Number.isFinite(batteryPercent) || batteryPercent < 0 || batteryPercent > 100) {
      throw new Error('El porcentaje de batería informado no es válido.')
    }
    status.battery_percent = Math.round(batteryPercent * 100) / 100
  }

  return status
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
  return `<!doctype html><html><body style="margin:0;background:#eef8f8;font-family:Arial,sans-serif;color:#082f3a"><div style="max-width:560px;margin:30px auto;padding:28px;background:#fff;border:1px solid #cfe5e6;border-radius:18px"><p style="margin:0 0 8px;color:#088395;font-size:12px;font-weight:700;letter-spacing:1.5px">AIRSENSE</p><h1 style="margin:0;font-size:26px">${title}</h1><p style="color:#52727b;line-height:1.6">${lead}</p><table style="width:100%;border-collapse:collapse;border-top:1px solid #dcebec;border-bottom:1px solid #dcebec">${metricRow('Temperatura', reading.temperature, '°C')}${metricRow('Humedad relativa', reading.humidity, '%')}${metricRow('Nivel sonoro', reading.noise, 'dB')}${metricRow('Calidad del aire estimada', reading.co2, 'ppm')}</table><p style="margin-top:20px;color:#78949b;font-size:12px">Medición: ${new Date(reading.recorded_at || Date.now()).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p></div></body></html>`
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
