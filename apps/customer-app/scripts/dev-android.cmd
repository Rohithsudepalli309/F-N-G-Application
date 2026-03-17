@echo off
setlocal
cd /d "%~dp0.."

echo [FNG] Checking connected devices...
adb devices

for /f %%i in ('adb devices ^| findstr /R "emulator-[0-9][0-9]* .*device"') do set DEVICE_OK=1
if not defined DEVICE_OK (
	echo [FNG] No emulator/device in 'device' state. Start one and try again.
	exit /b 1
)

echo [FNG] Building and installing Android debug app...
call cd android
call gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
if errorlevel 1 (
	echo [FNG] Gradle install failed.
	exit /b 1
)

call cd ..

echo [FNG] Wiring reverse port to Metro (8081)...
adb reverse tcp:8081 tcp:8081 >nul

echo [FNG] Wiring reverse port to Backend (3002)...
adb reverse tcp:3002 tcp:3002 >nul

echo [FNG] Launching app...
adb shell am start -n com.customerapp/com.customerapp.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
if errorlevel 1 (
	echo [FNG] App launch command failed.
	exit /b 1
)

echo [FNG] Android app installed and launched.
exit /b 0
