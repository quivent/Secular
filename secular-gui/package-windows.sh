#!/bin/bash
# Create pre-built Windows package (no npm install needed!)

set -e

echo "📦 Creating pre-built Windows package..."

PACKAGE_NAME="secular-gui-windows"
rm -rf "$PACKAGE_NAME" "$PACKAGE_NAME.zip"

# Create package directory
mkdir -p "$PACKAGE_NAME"

# Build if needed
if [ ! -d "dist" ]; then
    echo "🔨 Building frontend..."
    npm run build
fi

echo "📋 Copying files..."

# Copy built frontend
cp -r dist "$PACKAGE_NAME/"

# Copy server files
cp server.cjs "$PACKAGE_NAME/server.js"
cp package.json "$PACKAGE_NAME/"

# Copy only production dependencies (much smaller!)
echo "📦 Installing production dependencies only..."
cd "$PACKAGE_NAME"
npm install --production --silent
cd ..

# Copy startup scripts
cat > "$PACKAGE_NAME/start.bat" << 'EOF'
@echo off
echo.
echo 🚀 Starting Secular GUI...
echo.

REM Get Node ID if available
echo 🔑 Your Node ID (share with friends):
wsl rad node status --only nid 2>nul
if %errorlevel% neq 0 (
    echo    (Install Radicle in WSL to see your Node ID)
)
echo.

echo 🌐 Opening http://localhost:5288
start http://localhost:5288

timeout /t 2 /nobreak >nul
node server.js
EOF

cat > "$PACKAGE_NAME/README.txt" << 'EOF'
SECULAR GUI - Pre-Built for Windows
====================================

QUICK START:
1. Double-click start.bat
2. Browser opens automatically at http://localhost:5288
3. Click "Friends" tab to add your friend!

REQUIREMENTS:
- Node.js (https://nodejs.org/)
- Radicle CLI in WSL (optional, for P2P features)

YOUR NODE ID:
Run in WSL: rad node status --only nid
Share this ID with your friend to connect!

TROUBLESHOOTING:
- If port 5288 is busy: Edit server.js, change "5288" to another port
- Node.js not found: Install from nodejs.org
- For Radicle: Run "wsl --install" then "curl -sSf https://radicle.xyz/install | sh" in WSL

Ready to run - no npm install needed!
EOF

# Create zip
echo "🗜️  Creating Windows zip package..."
zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME" -q

# Cleanup
rm -rf "$PACKAGE_NAME"

SIZE=$(du -h "$PACKAGE_NAME.zip" | cut -f1)
echo ""
echo "✅ Pre-built package created: $PACKAGE_NAME.zip ($SIZE)"
echo ""
echo "📤 Send this to your Windows friend!"
echo ""
echo "🚀 They just need to:"
echo "   1. Extract the .zip (right-click → Extract All)"
echo "   2. Double-click start.bat"
echo "   3. Done! Browser opens automatically"
echo ""
echo "⚡ NO npm install needed!"
echo "⚡ NO build step needed!"
echo "⚡ Just Node.js required!"
