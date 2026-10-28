@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\desplegar-supabase.ps1"
if errorlevel 1 (
  echo.
  echo El despliegue no se completo. Revisa el mensaje anterior.
  pause
  exit /b 1
)
echo.
echo Backend de Supabase desplegado correctamente.
pause
