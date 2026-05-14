@echo off
setlocal
cd /d "%~dp0"
title GitHub Folder Downloader - localhost:9998

where py >nul 2>nul
if errorlevel 1 (
  echo Python Launcher "py" nao foi encontrado.
  echo Instale Python pelo site oficial ou pela Microsoft Store, depois rode este arquivo novamente.
  pause
  exit /b 1
)

py -3 "%~dp0app.py"
pause
