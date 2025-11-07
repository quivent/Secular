@echo off
REM One-command setup for Secular GUI (Windows)

echo.
echo 🚀 Secular GUI - Automated Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo 📥 Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version
echo.

REM Install dependencies
echo 📦 Installing dependencies (this may take 2-3 minutes)...
call npm install --silent

echo.
echo 🔨 Building frontend...
call npm run build --silent

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Starting server...
echo    → GUI will be available at: http://localhost:5288
echo    → Press Ctrl+C to stop
echo.

REM Try to get Node ID from WSL
echo 🔑 Your Node ID (share this with your friend):
wsl rad node status --only nid 2>nul
if %errorlevel% neq 0 (
    echo    Run in WSL: rad auth
)
echo.

REM Open browser
timeout /t 2 /nobreak >nul
start http://localhost:5288

REM Start server
node server.js
