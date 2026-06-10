@echo off
echo ==========================================
echo Starting Smart AI Study Assistant
echo ==========================================

echo [1/3] Checking Backend Setup...
if not exist "backend\.env" (
    echo ==========================================
    echo ERROR: backend\.env file not found!
    echo ==========================================
    echo Please create a .env file inside the 'backend' folder.
    echo It must contain at least:
    echo GOOGLE_API_KEY=your_google_api_key_here
    echo JWT_SECRET_KEY=your_generated_secret_key_here
    echo.
    pause
    exit /b
)

echo [2/3] Starting FastAPI Backend...
:: This will activate the virtual environment, install missing dependencies, and start uvicorn
start cmd /k "cd backend && call venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload"

echo [3/3] Starting Vite Frontend...
:: This will install missing node_modules and start the frontend
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ==========================================
echo Both servers are starting up in separate windows!
echo - Frontend will be available at: http://localhost:5173
echo - Backend API will be available at: http://localhost:8000/docs
echo ==========================================
