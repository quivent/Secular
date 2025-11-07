#!/bin/bash
# Build Tauri desktop app (native Windows/macOS/Linux app)

set -e

echo "🚀 Secular GUI - Tauri Desktop App Build"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Install from: https://nodejs.org/"
    exit 1
fi

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust not found!"
    echo ""
    echo "📥 Install Rust:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo ""
    exit 1
fi

echo "✓ Node.js: $(node --version)"
echo "✓ Rust: $(cargo --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building Tauri desktop app (this takes 5-10 minutes first time)..."
npm run tauri build

echo ""
echo "✅ Build complete!"
echo ""
echo "📱 Your app is at:"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "   src-tauri/target/release/secular-gui.exe"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   src-tauri/target/release/bundle/macos/Secular GUI.app"
else
    echo "   src-tauri/target/release/secular-gui"
fi
echo ""
echo "🚀 Double-click to run!"
