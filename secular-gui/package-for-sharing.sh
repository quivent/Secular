#!/bin/bash
# Package Secular GUI for sharing with friends

echo "📦 Packaging Secular GUI..."

cd "$(dirname "$0")"

# Create a clean temp directory
TEMP_DIR="secular-gui-share"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy essential files
echo "📋 Copying files..."
cp -r src "$TEMP_DIR/"
cp -r public "$TEMP_DIR/" 2>/dev/null || true

# Copy src-tauri but exclude build artifacts
echo "📋 Copying Tauri source (excluding build artifacts)..."
mkdir -p "$TEMP_DIR/src-tauri"
cp -r src-tauri/src "$TEMP_DIR/src-tauri/"
cp -r src-tauri/icons "$TEMP_DIR/src-tauri/"
cp -r src-tauri/gen "$TEMP_DIR/src-tauri/" 2>/dev/null || true
cp src-tauri/Cargo.toml "$TEMP_DIR/src-tauri/"
cp src-tauri/Cargo.lock "$TEMP_DIR/src-tauri/"
cp src-tauri/build.rs "$TEMP_DIR/src-tauri/"
cp src-tauri/tauri.conf.json "$TEMP_DIR/src-tauri/"

# Copy radicle crates (needed for Tauri build)
echo "📋 Copying radicle crates..."
mkdir -p "$TEMP_DIR/crates"
cp -r ../crates/radicle "$TEMP_DIR/crates/" 2>/dev/null || echo "Warning: radicle crate not found"
cp package.json "$TEMP_DIR/"
cp server.js "$TEMP_DIR/"
cp server.cjs "$TEMP_DIR/"
cp vite.config.ts "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp tsconfig.node.json "$TEMP_DIR/"
cp tailwind.config.js "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"
cp SETUP.md "$TEMP_DIR/"
cp SETUP-WINDOWS.md "$TEMP_DIR/"
cp SECURITY.md "$TEMP_DIR/"
cp QUICKSTART.md "$TEMP_DIR/"
cp ENABLE-P2P-CONNECTIONS.md "$TEMP_DIR/"
cp README.md "$TEMP_DIR/" 2>/dev/null || true
cp setup.sh "$TEMP_DIR/"
cp setup.bat "$TEMP_DIR/"
cp start.sh "$TEMP_DIR/"
cp start.bat "$TEMP_DIR/"
cp setup-tauri.sh "$TEMP_DIR/"
cp setup-tauri.bat "$TEMP_DIR/"
chmod +x "$TEMP_DIR/setup.sh" "$TEMP_DIR/start.sh" "$TEMP_DIR/setup-tauri.sh"

# Create tarball (strip macOS metadata for WSL compatibility)
echo "🗜️  Creating archive..."
COPYFILE_DISABLE=1 tar --no-xattrs -czf secular-gui-share.tar.gz "$TEMP_DIR" 2>/dev/null || tar -czf secular-gui-share.tar.gz "$TEMP_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Package created: secular-gui-share.tar.gz"
echo ""
echo "📤 Share this file with your friend!"
echo ""
echo "🚀 SUPER SIMPLE - Your friend does 2 steps:"
echo ""
echo "   Windows:"
echo "   1. Extract with 7-Zip (right-click twice)"
echo "   2. Double-click setup.bat"
echo ""
echo "   macOS/Linux:"
echo "   1. tar -xzf secular-gui-share.tar.gz && cd secular-gui-share"
echo "   2. ./setup.sh"
echo ""
echo "   ✨ Browser opens automatically!"
echo "   ✨ Their Node ID displays on screen!"
echo "   ✨ Total time: ~3 minutes!"
