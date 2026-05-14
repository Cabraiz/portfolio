@echo off
setlocal
cd /d "%~dp0"
title Repos Excel Local Viewer - Porta 9999

echo =======================================
echo Repos Excel Local Viewer
echo =======================================
echo Porta: 9999
echo URL: http://localhost:9999
echo.

where py >nul 2>nul
if %errorlevel%==0 (
    py -3 server.py
) else (
    python server.py
)

echo.
echo Servidor encerrado.
pause
