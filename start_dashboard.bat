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
echo Frontend: http://localhost:5173 (or 5174 if port busy)
echo Backend: http://localhost:8000/docs
pause
