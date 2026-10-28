# AirSense — Vue + Supabase

AirSense es una aplicación Vue 3 compilada con Vite. Supabase proporciona Postgres, Realtime, autenticación, autorización por roles y Edge Functions. Los correos de cuentas, cotizaciones e informes se envían mediante Gmail SMTP.

## Requisitos

- Node.js 20 o superior
- Una cuenta/proyecto en Supabase
- Supabase CLI para migraciones y Edge Functions
- Una cuenta Gmail o Google Workspace con verificación en dos pasos
- Una contraseña de aplicación de Google; nunca la contraseña normal
- Un token personal de Supabase con permisos de Auth y Edge Function Secrets

## 1. Ejecutar el frontend

```bash
npm install
cp .env.example .env
npm run dev
```

En Windows PowerShell, usá `Copy-Item .env.example .env`. Completá:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

La URL y la anon key son públicas. Nunca pongas `service_role`, la clave del ESP32, credenciales SMTP ni tokens personales en `.env`. Para probar sólo la interfaz, configurá `VITE_ENABLE_DEMO=true`.

## 2. Crear la base de datos

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Las migraciones crean telemetría, perfiles, roles, estados y auditoría administrativa. RLS limita las lecturas a usuarios activos. Las contraseñas y sesiones pertenecen exclusivamente a Supabase Auth; nunca se almacenan en tablas propias.

## 3. Configurar Gmail SMTP

1. Activá la verificación en dos pasos en la cuenta de Google.
2. Creá una contraseña de aplicación de 16 caracteres en la seguridad de la cuenta.
3. Creá un token personal de Supabase con permisos para configuración de Auth y secretos de Edge Functions.
4. Ejecutá `CONFIGURAR_CORREO.cmd` y completá los datos solicitados.

El configurador usa `smtp.gmail.com:465` con SSL, no guarda las credenciales en archivos y configura Supabase Auth y las Edge Functions. El puerto 465 es necesario porque las Edge Functions alojadas bloquean conexiones salientes al puerto 587.

No compartas por chat ni incluyas en Git la contraseña normal, la contraseña de aplicación o el token personal.

## 4. Desplegar funciones

En Windows, ejecutá `DESPLEGAR_SUPABASE.cmd`, pegá el token personal cuando lo solicite y esperá la confirmación. El token sólo vive en la memoria del proceso.

Alternativamente, con Supabase CLI:

```bash
supabase secrets set AIRSENSE_DEVICE_KEY="UNA_CLAVE_LARGA_Y_ALEATORIA"
supabase secrets set ALLOWED_ORIGIN="https://tu-sitio.com"

supabase functions deploy ingest-reading --no-verify-jwt
supabase functions deploy send-reading-email
supabase functions deploy send-quote-email
supabase functions deploy admin-users
```

`ingest-reading` exige el encabezado privado `x-device-key`. Las funciones de usuario conservan verificación JWT. Los envíos de informes y cotizaciones tienen limitación de frecuencia en PostgreSQL.

## 5. Configurar Auth para Vercel

En Supabase > Authentication > URL Configuration:

- Site URL: la URL estable de producción en Vercel.
- Redirect URLs: agregá `http://localhost:5173/**`, la URL de producción y, si usás previews, el patrón permitido de Vercel.

Mantené habilitada la confirmación de correo. Los enlaces de registro y recuperación vuelven a `/cuenta/ingresar/` y `/cuenta/recuperar/`.

## 6. Crear el primer administrador

1. Registrá la primera cuenta desde `/cuenta/registro/` y confirmá el correo.
2. En el SQL Editor de Supabase ejecutá, reemplazando el correo:

```sql
update public.profiles
set role_slug = 'admin'
where email = lower('administrador@ejemplo.com');
```

La promoción inicial se realiza una sola vez desde el panel seguro de Supabase. Después, el administrador gestiona usuarios en `/admin/usuarios/`. El backend impide auto-degradarse, auto-eliminarse o quitar al último administrador activo.

## 7. Conectar el ESP32

Abrí [el sketch](./arduino/Airsense-ESP32-1.1/Airsense-ESP32-1.1.ino) y configurá:

```cpp
const char* DEFAULT_SERVER_URL = "https://TU_PROYECTO.supabase.co/functions/v1/ingest-reading";
const char* AIRSENSE_DEVICE_KEY = "LA_MISMA_CLAVE_DEL_SECRETO";
```

La clave queda en el firmware, no en Vue. Si se filtra, rotala y cargá nuevamente el firmware.

## Scripts y pruebas

- `npm run dev`: servidor local.
- `npm run build`: build de producción en `dist/`.
- `npm run preview`: previsualiza el build.
- `npm test`: validaciones automatizadas de credenciales y perfiles.
- `CONFIGURAR_CORREO.cmd`: configura Gmail SMTP sin persistir secretos localmente.
- `DESPLEGAR_SUPABASE.cmd`: despliega las Edge Functions usando un token temporal que no se guarda.

## Despliegue

En Vercel, agregá las variables `VITE_*` y usá `npm run build`; `vercel.json` resuelve las rutas de Vue Router. Aplicá las migraciones y desplegá las Edge Functions por separado en Supabase.

## Seguridad

- RLS limita las mediciones a usuarios activos.
- Las operaciones administrativas pasan por una Edge Function que valida rol y estado en el backend.
- Supabase Auth gestiona hashing, sesiones, confirmación y recuperación de contraseñas.
- Los secretos existen únicamente en Supabase y las Edge Functions.
- Las acciones administrativas quedan registradas en `admin_audit_log`.
- No se puede eliminar ni desactivar al último administrador activo.
- Los envíos transaccionales tienen cooldown por destinatario.

Si una contraseña de aplicación o token llegó a publicarse, revocalo inmediatamente desde Google o Supabase.
