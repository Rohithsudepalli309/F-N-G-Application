@echo off
setlocal

echo [FNG] Streaming React Native Android logs (Ctrl+C to stop)...
adb logcat *:S ReactNative:V ReactNativeJS:V
