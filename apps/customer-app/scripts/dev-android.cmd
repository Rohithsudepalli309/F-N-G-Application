@echo off
setlocal
cd /d "%~dp0.."

echo [FNG] Checking connected devices...
adb devices

echo [FNG] Building and installing Android debug app...
call npx react-native run-android --active-arch-only
