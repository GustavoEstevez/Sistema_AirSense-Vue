$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolsRoot = Join-Path $projectRoot '.android-tools'
$jdkRoot = Join-Path $toolsRoot 'jdk'
$jdkHome = Get-ChildItem -LiteralPath $jdkRoot -Directory | Select-Object -First 1
if (-not $jdkHome) { throw 'No se encontró el JDK local en .android-tools/jdk.' }

$signingRoot = Join-Path $projectRoot '.android-signing'
$keystorePath = Join-Path $signingRoot 'airsense-release.jks'
$credentialsPath = Join-Path $signingRoot 'credentials.dpapi'
$keyAlias = 'airsense-release'
New-Item -ItemType Directory -Path $signingRoot -Force | Out-Null

if (Test-Path -LiteralPath $credentialsPath) {
  $protected = [System.IO.File]::ReadAllBytes($credentialsPath)
  $plain = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $protected,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  $password = [System.Text.Encoding]::UTF8.GetString($plain)
} else {
  $random = New-Object byte[] 32
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($random) } finally { $generator.Dispose() }
  $password = [Convert]::ToBase64String($random).Replace('+', 'A').Replace('/', 'B').TrimEnd('=')
  $plain = [System.Text.Encoding]::UTF8.GetBytes($password)
  $protected = [System.Security.Cryptography.ProtectedData]::Protect(
    $plain,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  [System.IO.File]::WriteAllBytes($credentialsPath, $protected)
}

$keytool = Join-Path $jdkHome.FullName 'bin\keytool.exe'
if (-not (Test-Path -LiteralPath $keystorePath)) {
  & $keytool -genkeypair -v -keystore $keystorePath -storepass $password -keypass $password `
    -alias $keyAlias -keyalg RSA -keysize 3072 -validity 10000 `
    -dname 'CN=AirSense, OU=Mobile, O=AirSense, L=Buenos Aires, ST=Buenos Aires, C=AR'
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar la clave de firma Android.' }
}

$env:JAVA_HOME = $jdkHome.FullName
$env:ANDROID_HOME = Join-Path $toolsRoot 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = Join-Path $toolsRoot 'gradle'
$env:AIRSENSE_RELEASE_STORE_FILE = $keystorePath
$env:AIRSENSE_RELEASE_STORE_PASSWORD = $password
$env:AIRSENSE_RELEASE_KEY_ALIAS = $keyAlias
$env:AIRSENSE_RELEASE_KEY_PASSWORD = $password

Push-Location $projectRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación web.' }
  npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw 'Falló la sincronización de Capacitor.' }
  & (Join-Path $projectRoot 'android\gradlew.bat') -p (Join-Path $projectRoot 'android') clean assembleRelease
  if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación Android release.' }
} finally {
  Pop-Location
  Remove-Item Env:AIRSENSE_RELEASE_STORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:AIRSENSE_RELEASE_KEY_PASSWORD -ErrorAction SilentlyContinue
  $password = $null
  $plain = $null
}

$apk = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path -LiteralPath $apk)) { throw 'Gradle finalizó sin generar el APK release esperado.' }
Write-Output "APK release generado: $apk"
