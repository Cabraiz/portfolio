@echo off
setlocal
cd /d "%~dp0"

echo.
echo ================================================
echo  Repos Excel Timeline Viewer
echo ================================================
echo.

where py >nul 2>nul
if errorlevel 1 (
    echo Python Launcher "py" nao encontrado.
    echo Instale o Python 3 ou ajuste o PATH.
    echo.
    pause
    exit /b 1
)

echo Usando Python via: py -3
echo Abrindo http://localhost:9999
echo.

start "" "http://localhost:9999"
py -3 server.py

echo.
pause
