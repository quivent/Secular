#!/bin/bash
# One-command setup for Secular GUI (macOS/Linux)

set -e  # Exit on error

echo "🚀 Secular GUI - Automated Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "📥 Please install from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies (this may take 2-3 minutes)..."
npm install --silent

echo ""
echo "🔨 Building frontend..."
npm run build --silent

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Starting server..."
echo "   → GUI will be available at: http://localhost:5288"
echo "   → Press Ctrl+C to stop"
echo ""

# Check if Radicle is installed and show Node ID
if command -v rad &> /dev/null; then
    echo "🔑 Your Node ID (share this with your friend):"
    echo "   $(rad node status --only nid 2>/dev/null || rad self --nid 2>/dev/null || echo 'Run: rad auth')"
    echo ""
fi

# Try to open browser
sleep 2
if command -v open &> /dev/null; then
    open http://localhost:5288
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5288
fi

# Start server
node server.js
