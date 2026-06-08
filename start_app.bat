@echo off
echo Starting Smart AI Study Assistant...

echo Checking for .env file...
if not exist "backend\.env" (
    echo Error: backend\.env file not found.
    echo Please create backend\.env and add your GOOGLE_API_KEY.
    pause
    exit /b
)

echo Starting FastAPI Backend...
start cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload"

echo Starting Vite Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting! The frontend will be available at http://localhost:5173
echo You can view the backend API docs at http://localhost:8000/docs
