$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$jdkHome = Get-ChildItem -LiteralPath (Join-Path $projectRoot '.android-tools\jdk') -Directory | Select-Object -First 1
$signingRoot = Join-Path $projectRoot '.android-signing'
$keystorePath = Join-Path $signingRoot 'airsense-release.jks'
$credentialsPath = Join-Path $signingRoot 'credentials.dpapi'
if (-not $jdkHome -or -not (Test-Path $keystorePath) -or -not (Test-Path $credentialsPath)) {
  throw 'No se encontró la identidad de firma local de AirSense.'
}

$destination = Read-Host 'Ruta completa del backup PKCS12 (ejemplo D:\Backups\airsense-signing.p12)'
$backupSecret = Read-Host 'Contraseña nueva para el backup (mínimo 16 caracteres)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($backupSecret)
try {
  $backupPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ($backupPassword.Length -lt 16) { throw 'La contraseña del backup debe tener al menos 16 caracteres.' }
  $protected = [IO.File]::ReadAllBytes($credentialsPath)
  $plain = [Security.Cryptography.ProtectedData]::Unprotect($protected, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  $sourcePassword = [Text.Encoding]::UTF8.GetString($plain)
  $keytool = Join-Path $jdkHome.FullName 'bin\keytool.exe'
  & $keytool -importkeystore -noprompt `
    -srckeystore $keystorePath -srcstoretype JKS -srcstorepass $sourcePassword -srcalias 'airsense-release' `
    -destkeystore $destination -deststoretype PKCS12 -deststorepass $backupPassword -destkeypass $backupPassword
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo exportar el backup de firma.' }
  Write-Output "Backup cifrado creado en: $destination"
} finally {
  if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
  $backupPassword = $null
  $sourcePassword = $null
  $plain = $null
}
