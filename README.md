# AirSense — Vue + Supabase

AirSense funciona como una aplicación Vue 3 compilada con Vite. Supabase proporciona Postgres para el historial, Realtime para actualizar el dashboard y Edge Functions para recibir lecturas y enviar correos.

## Requisitos

- Node.js 20 o superior
- Una cuenta/proyecto en Supabase
- Supabase CLI (para migraciones y Edge Functions)
- Una API key de Resend (para correos)

## 1. Ejecutar el frontend

```bash
npm install
cp .env.example .env
npm run dev
```

En Windows PowerShell, usá `Copy-Item .env.example .env`. Completá en `.env`:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

La URL y la anon key son valores públicos. Nunca pongas `service_role`, la clave del ESP32 ni la API key de Resend en `.env`.

Para probar solamente la interfaz sin Supabase, configurá `VITE_ENABLE_DEMO=true`.

## 2. Crear la base de datos

Vinculá el repositorio al proyecto y aplicá la migración:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

La migración crea `sensor_readings`, habilita RLS y permite únicamente lectura pública. Las escrituras del dispositivo pasan por una Edge Function con `service_role`.

## 3. Configurar secretos y funciones

```bash
supabase secrets set AIRSENSE_DEVICE_KEY="UNA_CLAVE_LARGA_Y_ALEATORIA"
supabase secrets set RESEND_API_KEY="re_..."
supabase secrets set AIRSENSE_ALERT_EMAIL="destino@ejemplo.com"
supabase secrets set AIRSENSE_SALES_EMAIL="ventas@tu-dominio.com"
supabase secrets set AIRSENSE_RESEND_FROM="AirSense <alertas@tu-dominio.com>"
supabase secrets set ALLOWED_ORIGIN="https://tu-sitio.com"

supabase functions deploy ingest-reading --no-verify-jwt
supabase functions deploy send-reading-email
supabase functions deploy send-quote-email
```

`ingest-reading` no verifica JWT porque el ESP32 no inicia sesión, pero exige el encabezado privado `x-device-key`. `send-reading-email` y `send-quote-email` sí exigen el token anon que adjunta el cliente de Supabase.

`send-quote-email` envía al solicitante un correo de confirmación cuando completa el formulario de cotización y, si `AIRSENSE_SALES_EMAIL` está configurado, notifica también al equipo comercial. `AIRSENSE_SALES_EMAIL` es opcional: si falta, se usa `AIRSENSE_ALERT_EMAIL`.

Mientras probás Resend sin dominio verificado podés usar `AirSense <onboarding@resend.dev>` como remitente, con las restricciones que imponga Resend.

## 4. Conectar el ESP32

Abrí [el sketch](./arduino/Airsense-ESP32-1.1/Airsense-ESP32-1.1.ino) y configurá:

```cpp
const char* DEFAULT_SERVER_URL = "https://TU_PROYECTO.supabase.co/functions/v1/ingest-reading";
const char* AIRSENSE_DEVICE_KEY = "LA_MISMA_CLAVE_DEL_SECRETO";
```

La clave queda dentro del firmware, no dentro de Vue. Si se filtra, rotala con `supabase secrets set` y volvé a cargar el firmware.

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: build de producción en `dist/`.
- `npm run preview`: previsualiza el build.

## Despliegue

El frontend es estático y puede desplegarse en Vercel, Netlify o Supabase Storage. En Vercel, importá el repositorio, agregá las dos variables `VITE_*` y usá `npm run build`; `vercel.json` ya resuelve las rutas de Vue Router.

Para Railway, `railway.json` usa el `Dockerfile`: compila con Node y sirve el resultado con Nginx.

## Seguridad

- RLS permite a visitantes leer mediciones, pero no insertar, modificar ni borrar.
- `SUPABASE_SERVICE_ROLE_KEY`, `AIRSENSE_DEVICE_KEY` y `RESEND_API_KEY` existen sólo en las Edge Functions.
- Las mediciones se validan por tipo y rango antes de guardarse.
- El envío manual tiene una espera mínima de 60 segundos por destinatario.

Si el repositorio anterior llegó a publicarse, revocá la antigua contraseña de aplicación de Gmail desde la cuenta de Google.
