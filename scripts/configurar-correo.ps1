$ErrorActionPreference = 'Stop'

function Read-SecretText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

Write-Host ''
Write-Host 'Configurador seguro de correo AirSense' -ForegroundColor Cyan
Write-Host 'No uses la contrasena normal de Gmail. Usa una contrasena de aplicacion de 16 caracteres.' -ForegroundColor Yellow
Write-Host 'Necesitas un token personal de Supabase con permisos de Auth y Edge Function Secrets.'
Write-Host ''

$projectRef = (Read-Host 'Project Ref de Supabase').Trim()
$accessToken = Read-SecretText 'Token personal de Supabase'
$gmail = (Read-Host 'Cuenta Gmail/Google Workspace remitente').Trim().ToLowerInvariant()
$appPassword = (Read-SecretText 'Contrasena de aplicacion de Google').Replace(' ', '')
$senderName = (Read-Host 'Nombre visible del remitente [AirSense]').Trim()
if (-not $senderName) { $senderName = 'AirSense' }

if ($projectRef -notmatch '^[a-z0-9]{15,30}$') { throw 'El Project Ref no tiene un formato valido.' }
if ($gmail -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw 'El correo no tiene un formato valido.' }
if ($appPassword.Length -ne 16) { throw 'La contrasena de aplicacion debe tener 16 caracteres (sin espacios).' }

$headers = @{ Authorization = "Bearer $accessToken"; 'Content-Type' = 'application/json' }
$authConfig = @{
  external_email_enabled = $true
  mailer_secure_email_change_enabled = $true
  mailer_autoconfirm = $false
  smtp_admin_email = $gmail
  smtp_host = 'smtp.gmail.com'
  smtp_port = 465
  smtp_user = $gmail
  smtp_pass = $appPassword
  smtp_sender_name = $senderName
} | ConvertTo-Json -Compress

Write-Host 'Configurando el SMTP de Supabase Auth...'
Invoke-RestMethod -Method Patch -Uri "https://api.supabase.com/v1/projects/$projectRef/config/auth" -Headers $headers -Body $authConfig | Out-Null

$edgeSecrets = @(
  @{ name = 'SMTP_HOST'; value = 'smtp.gmail.com' },
  @{ name = 'SMTP_PORT'; value = '465' },
  @{ name = 'SMTP_USER'; value = $gmail },
  @{ name = 'SMTP_PASS'; value = $appPassword },
  @{ name = 'SMTP_FROM'; value = $gmail },
  @{ name = 'SMTP_SENDER_NAME'; value = $senderName },
  @{ name = 'AIRSENSE_SALES_EMAIL'; value = $gmail },
  @{ name = 'AIRSENSE_ALERT_EMAIL'; value = $gmail }
) | ConvertTo-Json -Compress

Write-Host 'Configurando los secretos SMTP de las Edge Functions...'
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$projectRef/secrets" -Headers $headers -Body $edgeSecrets | Out-Null

$accessToken = $null
$appPassword = $null
Write-Host ''
Write-Host 'SMTP configurado con smtp.gmail.com:465 (SSL).' -ForegroundColor Green
Write-Host 'La confirmacion de cuentas, recuperacion, cotizaciones e informes usaran Gmail.' -ForegroundColor Green
