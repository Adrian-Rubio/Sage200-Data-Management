@echo off
echo ======================================================
echo Iniciando Misstipsi Dashboard (Gulah Restaurant)
echo ======================================================

:: Iniciar Backend
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python main.py"

:: Iniciar Frontend
start cmd /k "cd frontend && npm install && npm run dev"

echo Aplicacion iniciada en segundo plano.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
