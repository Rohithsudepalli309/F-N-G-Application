@echo off
setlocal enabledelayedexpansion

echo Checking Expo ports: 8081 8082 8083 8084
for %%P in (8081 8082 8083 8084) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    echo Stopping process %%A on port %%P
    taskkill /PID %%A /F >nul 2>&1
  )
)

timeout /t 1 >nul

echo Starting Expo on fixed port 8081 (tunnel + clear cache)
call npx expo start --tunnel --clear --port 8081
