@echo off
REM Build Tauri desktop app for Windows

echo.
echo 🚀 Secular GUI - Tauri Desktop App Build
echo ==========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Rust
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Rust not found!
    echo.
    echo 📥 Install Rust from: https://rustup.rs/
    echo    Download and run: rustup-init.exe
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
echo ✓ Rust found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔨 Building Tauri desktop app (this takes 5-10 minutes first time)...
call npm run tauri build

echo.
echo ✅ Build complete!
echo.
echo 📱 Your app is at:
echo    src-tauri\target\release\secular-gui.exe
echo.
echo 🚀 Double-click to run!
echo.
pause
