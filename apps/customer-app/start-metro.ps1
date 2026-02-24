# start-metro.ps1
# Starts the React Native Metro bundler for customer-app using Node 18 via fnm.
# Run this from: apps/customer-app/

$fnm = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "fnm.exe" | Select-Object -First 1 -ExpandProperty FullName)
if (-not $fnm) {
    Write-Error "fnm not found. Install it with: winget install Schniz.fnm"
    exit 1
}

Invoke-Expression (& $fnm env --shell power-shell | Out-String)
fnm use 18
Write-Host "Node $(node --version) via fnm" -ForegroundColor Green
Set-Location $PSScriptRoot
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Gray
pnpm start
