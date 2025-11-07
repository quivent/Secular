#!/bin/bash
# Quick start script (after setup is done)

echo "🚀 Starting Secular GUI..."

# Check if built
if [ ! -d "dist" ]; then
    echo "❌ Please run ./setup.sh first!"
    exit 1
fi

# Show Node ID
if command -v rad &> /dev/null; then
    echo "🔑 Your Node ID: $(rad node status --only nid 2>/dev/null || rad self --nid 2>/dev/null)"
fi

echo "🌐 Opening http://localhost:5288"

# Open browser
sleep 1
if command -v open &> /dev/null; then
    open http://localhost:5288
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5288
fi

# Start server
node server.js
