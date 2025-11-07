#!/bin/bash
# Package just the web version (no Tauri) - smaller & simpler

echo "📦 Packaging Secular GUI (Web Only)..."

cd "$(dirname "$0")"

# Create temp directory
TEMP_DIR="secular-gui-web"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy web essentials only
echo "📋 Copying web files..."
cp -r src "$TEMP_DIR/"
cp -r public "$TEMP_DIR/" 2>/dev/null || true
cp package.json "$TEMP_DIR/"
cp server.js "$TEMP_DIR/"
cp server.cjs "$TEMP_DIR/"
cp vite.config.ts "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp tsconfig.node.json "$TEMP_DIR/"
cp tailwind.config.js "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"

# Copy setup scripts (web only)
cp setup.sh "$TEMP_DIR/"
cp setup.bat "$TEMP_DIR/"
cp start.sh "$TEMP_DIR/"
cp start.bat "$TEMP_DIR/"
chmod +x "$TEMP_DIR/setup.sh" "$TEMP_DIR/start.sh"

# Copy docs
cp README.md "$TEMP_DIR/" 2>/dev/null || true
cp QUICKSTART.md "$TEMP_DIR/" 2>/dev/null || true
cp SECURITY.md "$TEMP_DIR/" 2>/dev/null || true

# Create tarball (no macOS metadata)
echo "🗜️  Creating archive..."
COPYFILE_DISABLE=1 tar --no-xattrs -czf secular-gui-web.tar.gz "$TEMP_DIR" 2>/dev/null || tar -czf secular-gui-web.tar.gz "$TEMP_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Package created: secular-gui-web.tar.gz"
echo ""
ls -lh secular-gui-web.tar.gz
echo ""
echo "📤 Web-only package (lightweight, no Tauri)"
echo ""
echo "🚀 Your friend runs:"
echo "   tar -xzf secular-gui-web.tar.gz && cd secular-gui-web"
echo "   ./setup.sh"
echo "   Open: http://localhost:5288"
