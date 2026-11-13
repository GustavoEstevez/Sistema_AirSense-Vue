import {
  HttpError,
  json,
  preflight,
  rateLimit,
  readJsonBody,
  recordSecurityEvent,
  requireUser,
} from '../_shared/airsense.ts'

type RecommendationRequest = {
  reading?: { temperature?: unknown; humidity?: unknown; noise?: unknown; co2?: unknown; recorded_at?: unknown }
  region?: unknown
  mode?: 'recommendations' | 'thresholds'
  thresholds?: { temperatureMin?: unknown; temperatureMax?: unknown }
}

function finite(value: unknown, min: number, max: number) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('Lectura ambiental inválida.')
  return number
}

function parseRecommendations(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned
  const parsed = JSON.parse(jsonText) as { recommendations?: unknown }
  return Array.isArray(parsed.recommendations)
    ? parsed.recommendations
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, 4)
    : []
}

function roundHalf(value: number) {
  return Math.round(value * 2) / 2
}

async function loadWeather(region: string) {
  const apiKey = Deno.env.get('WEATHERAPI_KEY')?.trim()
  if (!apiKey) throw new Error('El servicio meteorológico todavía no está configurado.')
  const url = new URL('https://api.weatherapi.com/v1/current.json')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', region)
  url.searchParams.set('lang', 'es')
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  const payload = await response.json() as Record<string, any>
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('La clave de WeatherAPI no es válida.')
    if (response.status === 429) throw new HttpError(429, 'Se alcanzó temporalmente el límite del servicio meteorológico.')
    throw new HttpError(400, 'No encontramos información meteorológica para la región configurada.')
  }
  return {
    temperatureC: finite(payload.current?.temp_c, -70, 65),
    feelsLikeC: finite(payload.current?.feelslike_c, -80, 70),
    humidity: finite(payload.current?.humidity, 0, 100),
    condition: String(payload.current?.condition?.text || 'Condición no informada').slice(0, 80),
    location: [payload.location?.name, payload.location?.region, payload.location?.country].filter(Boolean).join(', ').slice(0, 160),
    observedAt: String(payload.current?.last_updated || ''),
    provider: 'WeatherAPI.com',
  }
}

function smartThresholds(outdoorC: number, requested?: RecommendationRequest['thresholds']) {
  const manualMin = Math.min(Math.max(Number(requested?.temperatureMin) || 15, 15), 29)
  const manualMax = Math.max(Math.min(Number(requested?.temperatureMax) || 30, 30), 16)
  const adaptiveCenter = Math.min(Math.max(0.31 * outdoorC + 17.8, 20), 25.5)
  return {
    temperatureMin: roundHalf(Math.max(15, Math.min(manualMin, adaptiveCenter - 5))),
    temperatureMax: roundHalf(Math.min(30, Math.max(manualMax, adaptiveCenter + 5))),
    safetyMin: 15,
    safetyMax: 30,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return preflight(request)
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  try {
    const { user } = await requireUser(request)
    if (!await rateLimit('environment-ai:user', user.id, 12, 3600)) {
      await recordSecurityEvent('environment_ai.rate_limited', request, { actorId: user.id })
      throw new HttpError(429, 'Alcanzaste el límite horario de recomendaciones inteligentes.')
    }

    const body = await readJsonBody<RecommendationRequest>(request, 4096)
    const region = String(body.region || 'Región no indicada').trim().slice(0, 120)
    if (!/^[\p{L}\p{M}\p{N} .,'()\-]{2,120}$/u.test(region)) {
      throw new HttpError(400, 'Ingresá una localidad y provincia válidas.')
    }
    const weather = await loadWeather(region)
    const thresholds = smartThresholds(weather.temperatureC, body.thresholds)
    if (body.mode === 'thresholds') return json(request, { weather, thresholds })

    const apiKey = Deno.env.get('GROQ_API_KEY')?.trim()
    if (!apiKey) return json(request, { error: 'La integración de IA todavía no está configurada.' }, 503)
    const reading = body.reading || {}
    const values = {
      temperature: finite(reading.temperature, -40, 85),
      humidity: finite(reading.humidity, 0, 100),
      noise: finite(reading.noise, 0, 160),
      airQualityPpm: finite(reading.co2, 0, 10_000),
    }

    const prompt = [
      'Sos un asistente de bienestar ambiental para interiores. Respondé en español rioplatense claro.',
      'Generá de 2 a 4 acciones breves, concretas y prudentes basadas solamente en estas mediciones.',
      'En las recomendaciones mencioná solamente las variables ambientales y sus mediciones; no incluyas nombres, marcas ni modelos de sensores o componentes.',
      'No diagnostiques enfermedades, no inventes el clima actual y no afirmes que el MQ-135 mide CO2: describilo como calidad del aire estimada en ppm.',
      'Si la región aporta contexto climático general, usalo con cautela y aclarando cualquier supuesto.',
      `Ubicación resuelta por el proveedor meteorológico: ${weather.location}.`,
      `Exterior actual según WeatherAPI.com: ${weather.temperatureC} °C, sensación ${weather.feelsLikeC} °C, humedad ${weather.humidity} %, ${weather.condition}.`,
      `Temperatura: ${values.temperature} °C; humedad relativa: ${values.humidity} %; nivel sonoro: ${values.noise} dB; calidad del aire estimada: ${values.airQualityPpm} ppm.`,
      'Devolvé exclusivamente un JSON válido con esta forma: {"recommendations":["acción 1","acción 2"]}.',
    ].join('\n')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL')?.trim() || 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        reasoning_effort: 'low',
        reasoning_format: 'hidden',
        max_completion_tokens: 700,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'environment_recommendations',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 4,
                  items: { type: 'string' },
                },
              },
              required: ['recommendations'],
              additionalProperties: false,
            },
          },
        },
      }),
    })
    const payload = await response.json() as Record<string, any>
    if (!response.ok) {
      console.error('Groq request failed', response.status, payload?.error?.message || 'Unknown error')
      if (response.status === 401) throw new Error('La clave configurada para Groq no es válida.')
      if (response.status === 429) throw new HttpError(429, 'Se alcanzó temporalmente el límite gratuito de Groq.')
      throw new Error('Groq no pudo generar las recomendaciones en este momento.')
    }

    const text = String(payload.choices?.[0]?.message?.content || '')
    const recommendations = parseRecommendations(text)
    if (!recommendations.length) throw new Error('La respuesta no contiene recomendaciones válidas.')
    return json(request, { recommendations, weather, thresholds })
  } catch (error) {
    console.error(error)
    const status = error instanceof HttpError ? error.status : 500
    return json(request, { error: error instanceof Error ? error.message : 'No se pudo generar la recomendación.' }, status)
  }
})
