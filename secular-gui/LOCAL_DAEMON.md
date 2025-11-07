# Local Daemon Setup for Secular GUI

Run the GUI and API as background daemons on macOS using launchd.

## Why Use Daemons vs Background Jobs?

**Background jobs (`&`) problems:**
- ❌ Die when terminal closes
- ❌ Killed by system cleanup or sleep
- ❌ No automatic restart on failure
- ❌ Hard to manage multiple shells

**Daemon benefits:**
- ✅ Survive terminal/shell closures
- ✅ Auto-restart on crashes (with `KeepAlive`)
- ✅ Start automatically on login (with `RunAtLoad`)
- ✅ Single command to manage
- ✅ Centralized logging
- ✅ Standardized macOS service management

**Trade-off:** API server needs manual restart after code changes. Frontend (Vite) still has hot-reload.

## Setup (One Time)

```bash
# Copy plists to LaunchAgents
cp secular-local-node.plist ~/Library/LaunchAgents/
cp secular-local-api.plist ~/Library/LaunchAgents/
cp secular-local-vite.plist ~/Library/LaunchAgents/

# Load the services
launchctl load ~/Library/LaunchAgents/secular-local-node.plist
launchctl load ~/Library/LaunchAgents/secular-local-api.plist
launchctl load ~/Library/LaunchAgents/secular-local-vite.plist
```

## Daily Commands

```bash
# Start services
launchctl start com.secular.local-node
launchctl start com.secular.local-api
launchctl start com.secular.local-vite

# Stop services
launchctl stop com.secular.local-node
launchctl stop com.secular.local-api
launchctl stop com.secular.local-vite

# Restart services (after code changes)
launchctl stop com.secular.local-node && launchctl start com.secular.local-node
launchctl stop com.secular.local-api && launchctl start com.secular.local-api
launchctl stop com.secular.local-vite && launchctl start com.secular.local-vite

# Check status
launchctl list | grep secular

# View logs
tail -f /tmp/secular-local-node.log
tail -f /tmp/secular-local-api.log
tail -f /tmp/secular-local-vite.log
```

## Restart from GUI (How to Get Back Online)

**Option 1: Run the restart script**
```bash
cd secular-gui
./restart-local.sh
```

**Option 2: Add a restart button to Settings page**
```typescript
// In your Settings component
const restartServices = async () => {
  try {
    // Use Tauri command if available, or make API call
    await fetch('/api/system/restart', { method: 'POST' });

    // Wait and check status
    setTimeout(async () => {
      const status = await fetch('/api/system/status');
      console.log('Status:', await status.json());
    }, 3000);
  } catch (error) {
    console.error('Restart failed:', error);
  }
};
```

**Option 3: Terminal commands**
```bash
# Restart just the API
launchctl stop com.secular.local-api && launchctl start com.secular.local-api

# Restart both services
launchctl stop com.secular.local-api && launchctl start com.secular.local-api && \
launchctl stop com.secular.local-vite && launchctl start com.secular.local-vite

# Or use the script
cd secular-gui && ./restart-local.sh
```

## Quick Start Script

Create `start-secular-local.sh`:
```bash
#!/bin/bash
launchctl start com.secular.local-api
launchctl start com.secular.local-vite
sleep 2
open http://localhost:5289
echo "Secular GUI running at http://localhost:5289"
```

## Uninstall

```bash
launchctl unload ~/Library/LaunchAgents/secular-local-api.plist
launchctl unload ~/Library/LaunchAgents/secular-local-vite.plist
rm ~/Library/LaunchAgents/secular-local-api.plist
rm ~/Library/LaunchAgents/secular-local-vite.plist
```

---

## Benefits

- ✅ Auto-start on login
- ✅ Auto-restart on crash
- ✅ Survive terminal closures
- ✅ Standardized macOS service management
- ✅ Centralized logging

## Logs

- API: `/tmp/secular-local-api.log`
- Vite: `/tmp/secular-local-vite.log`
- Errors: `/tmp/secular-local-api-error.log` and `/tmp/secular-local-vite-error.log`
