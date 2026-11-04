$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolsRoot = Join-Path $projectRoot '.android-tools'
$jdkRoot = Join-Path $toolsRoot 'jdk'
$jdkHome = Get-ChildItem -LiteralPath $jdkRoot -Directory | Select-Object -First 1

if (-not $jdkHome) {
  throw 'No se encontró el JDK local en .android-tools/jdk.'
}

$env:JAVA_HOME = $jdkHome.FullName
$env:ANDROID_HOME = Join-Path $toolsRoot 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = Join-Path $toolsRoot 'gradle'

Push-Location $projectRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación web.' }

  npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw 'Falló la sincronización de Capacitor.' }

  & (Join-Path $projectRoot 'android\gradlew.bat') -p (Join-Path $projectRoot 'android') assembleDebug
  if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación Android.' }
} finally {
  Pop-Location
}

$apk = Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path -LiteralPath $apk)) { throw 'Gradle finalizó sin generar el APK esperado.' }
Write-Output "APK generado: $apk"
