@echo off
setlocal
cd /d "%~dp0"

echo.
echo ================================================
echo  Team Repo Usage Viewer
echo ================================================
echo.

where py >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
    goto run
)

where python >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=python"
    goto run
)

echo Python nao encontrado.
echo.
echo No seu PC, confirme com:
echo   py --version
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
