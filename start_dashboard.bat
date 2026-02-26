@echo off
echo Starting Sage200 Dashboard...

:: Start Backend in a new window
echo Starting Backend (FastAPI)...
start "Sage200 Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Wait a few seconds for backend to initialize (optional but good practice)
timeout /t 3

:: Start Frontend in a new window
echo Starting Frontend (React/Vite)...
start "Sage200 Frontend" cmd /k "cd frontend && npm run dev"

echo Both services launched! 
echo Dashboard: http://metricas.cenval.es
echo Backend Docs: http://metricas.cenval.es:8000/docs
pause
