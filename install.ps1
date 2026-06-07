$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Installing Peak Paths dependencies..." -ForegroundColor Cyan

# PowerShell can break npm.cmd on some Windows setups — use cmd.exe instead.
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/d /s /c `"npm.cmd install`"" -WorkingDirectory $PSScriptRoot -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
  Write-Host "Trying node/npm-cli.js fallback..." -ForegroundColor Yellow
  $node = (Get-Command node -ErrorAction Stop).Source
  $nodeDir = Split-Path $node -Parent
  $npmCli = Join-Path $nodeDir "node_modules\npm\bin\npm-cli.js"
  node $npmCli install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`nDone. Start the app with: npm run dev" -ForegroundColor Green
