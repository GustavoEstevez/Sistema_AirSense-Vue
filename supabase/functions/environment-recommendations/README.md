# Recomendaciones ambientales con IA

Esta función no escribe en la base de datos. Recibe la lectura actual y la región configurada en el teléfono, valida la sesión de Supabase y consulta la Responses API desde el servidor.

Secretos requeridos en Supabase:

- `GROQ_API_KEY`: clave gratuita creada en GroqCloud.
- `GROQ_MODEL` (opcional): por defecto `openai/gpt-oss-20b`.
- `WEATHERAPI_KEY`: clave gratuita de WeatherAPI.com.

Despliegue:

```powershell
supabase secrets set GROQ_API_KEY=TU_CLAVE_GROQ
supabase secrets set WEATHERAPI_KEY=TU_CLAVE_WEATHERAPI
supabase functions deploy environment-recommendations
```

La clave nunca debe agregarse a `.env`, `VITE_*`, el código Vue ni el APK.
