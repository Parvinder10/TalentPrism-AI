@echo off
echo ========================================================
echo Starting TalentPrism AI (Backend + Frontend)
echo ========================================================

start "TalentPrism AI Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "TalentPrism AI Frontend (Vite + React)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo TalentPrism AI is starting!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
