@echo off
setlocal
cd /d "%~dp0.."

echo [FNG] Starting Metro on port 8081...
call npx react-native start --port 8081 --reset-cache
