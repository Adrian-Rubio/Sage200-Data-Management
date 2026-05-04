@echo off
echo ======================================================
echo Iniciando Misstipsi Dashboard (MODO PORTABLE - RED LOCAL)
echo ======================================================
echo.
echo Este modo permite acceder al dashboard desde otros ordenadores
echo de la red local usando tu direccion IP.
echo.

:: Obtener la IP local
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr 192.168') do set IP=%%a
echo Tu direccion IP local parece ser: %IP%
echo Podras acceder desde otros PCs en: http://%IP%:8000
echo.

cd backend
if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
)

echo Activando entorno y arrancando servidor...
venv\Scripts\activate && python run_portable.py

pause
