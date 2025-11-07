@echo off
REM Quick start script (after setup is done)

echo 🚀 Starting Secular GUI...

if not exist "dist" (
    echo ❌ Please run setup.bat first!
    pause
    exit /b 1
)

echo 🔑 Your Node ID:
wsl rad node status --only nid 2>nul

echo 🌐 Opening http://localhost:5288
start http://localhost:5288

timeout /t 1 /nobreak >nul
node server.js
