@echo off
title DataVault Launcher
echo ========================================================
echo               DataVault One-Click Launcher
echo ========================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%data-vault-frontend"
set "BACKEND_DIR=%PROJECT_ROOT%knowledge-vault-backend"

:: 1. Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in your system PATH.
    echo Please install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in your system PATH.
    echo Please reinstall Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Setup Backend
echo [1/4] Checking Backend...
if not exist "%BACKEND_DIR%" (
    echo [ERROR] Missing backend folder: %BACKEND_DIR%
    pause
    exit /b 1
)
cd /d "%BACKEND_DIR%"
if not exist "node_modules" (
    echo Installing backend dependencies... (This might take a minute)
    call npm install
)

:: 4. Setup Frontend
echo.
echo [2/4] Checking Frontend...
if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Missing frontend folder: %FRONTEND_DIR%
    pause
    exit /b 1
)
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo Installing frontend dependencies... (This might take a minute)
    call npm install
)

:: 5. Launch Servers
echo.
echo [3/4] Starting Servers...
echo Starting Backend Server on Port 4000...
start "DataVault Backend" /D "%BACKEND_DIR%" cmd /k "title DataVault Backend && npm run start"

echo Starting Frontend Server on Port 3000...
start "DataVault Frontend" /D "%FRONTEND_DIR%" cmd /k "title DataVault Frontend && npm run dev"

:: 6. Launch Browser
echo.
echo [4/4] Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo Opening DataVault in your default browser...
start http://localhost:3000

echo.
echo ========================================================
echo DataVault launched successfully! 
echo Keep the two black command windows open while using the app.
echo You can close this launcher window now.
echo ========================================================
pause
