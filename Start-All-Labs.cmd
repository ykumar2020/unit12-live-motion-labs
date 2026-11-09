@echo off
cd /d "%~dp0"
node --version
if errorlevel 1 (
  echo Install Node.js 22.12 or newer and open this file again.
  pause
  exit /b 1
)
if not exist node_modules\vite\bin\vite.js (
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open http://127.0.0.1:5280 after all eight Vite servers are ready.
call npm.cmd run dev
pause
