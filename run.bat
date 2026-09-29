@echo off
title BloodChain 2.O - Local Development
color 0A

echo ============================================
echo   BloodChain 2.O - Starting Local Servers
echo ============================================
echo.

:: Check if backend venv exists
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend venv not found! Run: cd backend ^&^& python -m venv venv
    pause
    exit /b 1
)

:: Install backend dependencies if pandas is missing (ML stack)
echo [1/4] Checking backend dependencies...
backend\venv\Scripts\python.exe -c "import pandas" 2>nul
if errorlevel 1 (
    echo [INFO] Installing backend dependencies...
    backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
)

:: Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

:: Run Django migrations
echo [2/4] Running database migrations...
backend\venv\Scripts\python.exe backend\manage.py migrate --no-input

:: Start Backend Server
echo [3/4] Starting Django Backend on http://localhost:8000 ...
start "BloodChain Backend" cmd /k "title BloodChain Backend && color 0B && backend\venv\Scripts\python.exe backend\manage.py runserver 8000"

:: Wait for backend to boot
timeout /t 3 /nobreak >nul

:: Start Frontend Server
echo [4/4] Starting Vite Frontend on http://localhost:5173 ...
start "BloodChain Frontend" cmd /k "title BloodChain Frontend && color 0D && cd frontend && npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://localhost:5173
