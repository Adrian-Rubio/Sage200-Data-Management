@echo off
echo ==========================================
echo Sincronizando datos de Marketing...
echo ==========================================
cd /d "%~dp0"
python ejecutar_todo.py
echo ==========================================
echo Sincronizacion completada.
echo ==========================================
pause
