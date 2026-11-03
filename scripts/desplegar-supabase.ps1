$ErrorActionPreference = 'Stop'
$projectRef = 'wzinogxgpizatvtebvgr'

function Read-SecretText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

Write-Host ''
Write-Host 'Despliegue seguro de Supabase para AirSense' -ForegroundColor Cyan
Write-Host 'El token se usa solamente en este proceso y no se guarda en archivos.'
$token = Read-SecretText 'Pega el token personal de Supabase'
if (-not $token.StartsWith('sbp_')) { throw 'El token no parece ser un token personal valido de Supabase.' }

$env:SUPABASE_ACCESS_TOKEN = $token
try {
  Write-Host ''
  Write-Host 'Descargando/verificando Supabase CLI...'
  & npx.cmd --yes supabase@latest --version
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar Supabase CLI.' }

  $deployments = @(
    @{ Name = 'ingest-reading'; Extra = @('--no-verify-jwt') },
    @{ Name = 'send-reading-email'; Extra = @() },
    @{ Name = 'send-quote-email'; Extra = @() },
    @{ Name = 'admin-users'; Extra = @() }
  )

  foreach ($deployment in $deployments) {
    Write-Host "Desplegando $($deployment.Name)..." -ForegroundColor Yellow
    $arguments = @('supabase@latest', 'functions', 'deploy', $deployment.Name, '--project-ref', $projectRef) + $deployment.Extra
    & npx.cmd --yes @arguments
    if ($LASTEXITCODE -ne 0) { throw "Fallo el despliegue de $($deployment.Name)." }
  }

  Write-Host ''
  Write-Host 'Las cuatro Edge Functions quedaron desplegadas.' -ForegroundColor Green
} finally {
  $env:SUPABASE_ACCESS_TOKEN = $null
  $token = $null
}
