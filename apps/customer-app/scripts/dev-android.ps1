Set-Location -Path "$PSScriptRoot\.."
cmd /c scripts\dev-android.cmd
exit $LASTEXITCODE
