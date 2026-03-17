@echo off
setlocal
cd /d "%~dp0.."

echo [FNG] Releasing port 8081 if occupied...
for /f %%p in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue ^| Where-Object { $_.LocalPort -eq 8081 } ^| Select-Object -ExpandProperty OwningProcess -Unique"') do (
	taskkill /PID %%p /F >nul 2>&1
)

echo [FNG] Wiring reverse port for Android (8081 and 3002)...
adb reverse tcp:8081 tcp:8081 >nul 2>&1
adb reverse tcp:3002 tcp:3002 >nul 2>&1

echo [FNG] Starting Metro on port 8081...
call npx react-native start --port 8081 --reset-cache
