@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\configurar-correo.ps1"
if errorlevel 1 (
  echo.
  echo La configuracion no se completo. Revisa el mensaje anterior.
  pause
  exit /b 1
)
echo.
echo Configuracion SMTP completada.
pause
