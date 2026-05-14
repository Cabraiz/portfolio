@echo off
setlocal
cd /d "%~dp0"

echo.
echo ================================================
echo  Repos Excel Timeline Viewer
echo ================================================
echo.

where python >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=python"
    goto run
)

where py >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
    goto run
)

echo Python nao encontrado.
echo.
echo Tente instalar o Python 3 e marque:
echo   [x] Add python.exe to PATH
echo.
echo Ou instale via winget:
echo   winget install Python.Python.3
echo.
pause
exit /b 1

:run
echo Usando: %PYTHON_CMD%
echo Abrindo http://localhost:9999
echo.

start "" "http://localhost:9999"
%PYTHON_CMD% server.py

echo.
pause
