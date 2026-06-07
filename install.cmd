@echo off
cd /d "%~dp0"
echo Installing Peak Paths dependencies...
call npm.cmd install
if errorlevel 1 (
  echo.
  echo Retrying via node/npm-cli.js...
  for /f "delims=" %%N in ('where node 2^>nul') do set "NODE_DIR=%%~dpN"
  node "%NODE_DIR%node_modules\npm\bin\npm-cli.js" install
)
if errorlevel 1 (
  echo.
  echo Install failed. Try upgrading Node.js from https://nodejs.org/
  pause
  exit /b 1
)
echo.
echo Done. Run: npm run dev
pause
