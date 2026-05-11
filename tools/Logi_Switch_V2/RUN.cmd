@echo off
setlocal
chcp 65001 >nul
title Logi EasySwitch AUTO FAST

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0LogiEasySwitch.ps1"

echo.
pause
