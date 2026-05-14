@echo off
setlocal
cd /d "%~dp0"
echo.
echo ================================================
echo  Repos Excel Timeline Viewer
echo ================================================
echo.
where python >nul 2>nul
if errorlevel 1 (
    echo Python nao encontrado no PATH.
    echo Instale o Python 3 ou adicione python.exe ao PATH.
    echo.
    pause
    exit /b 1
)
start "" "http://localhost:9999"
python server.py
echo.
pause
