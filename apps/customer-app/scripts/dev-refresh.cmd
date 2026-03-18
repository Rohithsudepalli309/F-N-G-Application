@echo off
setlocal
cd /d "%~dp0.."

echo [FNG] Killing stale processes on port 8081...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081"') do (
  taskkill /PID %%p /F >nul 2>&1
)
for /f %%p in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique"') do (
  taskkill /PID %%p /F >nul 2>&1
)

echo [FNG] Ensuring ADB is running...
adb start-server >nul 2>&1

set DEVICE_OK=
for /f %%i in ('adb devices ^| findstr /R "emulator-[0-9][0-9]* .*device"') do set DEVICE_OK=1
if not defined DEVICE_OK (
  echo [FNG] No emulator in device state. Start Android emulator and run again.
  exit /b 1
)

echo [FNG] Starting Metro in a dedicated terminal...
start "FNG Metro" cmd /c "cd /d \"%cd%\" && npx react-native start --port 8081 --reset-cache"

echo [FNG] Waiting for Metro readiness...
set /a METRO_RETRIES=0
:wait_metro
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8081/status' -UseBasicParsing -TimeoutSec 2; if ($r.Content -match 'packager-status:running') { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel%==0 goto metro_ready
set /a METRO_RETRIES+=1
if %METRO_RETRIES% GEQ 40 (
  echo [FNG] Metro did not become ready on 8081.
  exit /b 1
)
timeout /t 1 >nul
goto wait_metro

:metro_ready
echo [FNG] Metro is ready.
echo [FNG] Wiring reverse ports (8081 Metro, 3002 backend)...
adb reverse tcp:8081 tcp:8081 >nul 2>&1
adb reverse tcp:3002 tcp:3002 >nul 2>&1

echo [FNG] Reinstalling app...
cd android
call gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
if errorlevel 1 (
  echo [FNG] Gradle install failed.
  exit /b 1
)
cd ..

echo [FNG] Restarting app process and launching MainActivity...
adb shell am force-stop com.customerapp >nul 2>&1
adb shell am start -n com.customerapp/com.customerapp.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
if errorlevel 1 (
  echo [FNG] App launch command failed.
  exit /b 1
)

echo [FNG] Done. Use Dev Menu -> Reload for instant UI refresh after code edits.
exit /b 0
