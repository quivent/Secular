#!/bin/bash
# Restart local Secular GUI services

echo "Restarting Secular local services..."

# Restart Node
launchctl stop com.secular.local-node 2>/dev/null
sleep 1
launchctl start com.secular.local-node

# Restart API
launchctl stop com.secular.local-api 2>/dev/null
sleep 1
launchctl start com.secular.local-api

# Restart Vite
launchctl stop com.secular.local-vite 2>/dev/null
sleep 1
launchctl start com.secular.local-vite

sleep 2

# Check status
echo ""
echo "Service Status:"
launchctl list | grep secular

echo ""
echo "Testing API..."
curl -s http://localhost:5288/api/system/status | head -100

echo ""
echo ""
echo "Services restarted. GUI available at: http://localhost:5289"
