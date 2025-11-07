# Secular GUI - Windows Setup Guide

Elite P2P code collaboration GUI for Radicle/Secular.

## Prerequisites

1. **Node.js** (v18 or later)
   - Download from: https://nodejs.org/
   - Choose "Windows Installer (.msi)"
   - Install and restart your terminal

2. **Git for Windows**
   - Download from: https://git-scm.com/download/win
   - Use default installation options

3. **Radicle CLI** (currently requires WSL on Windows)
   - Option A: Install WSL2 (recommended)
   - Option B: Use Docker Desktop with Radicle

### Installing WSL2 (Recommended for Radicle)

Open PowerShell as Administrator and run:
```powershell
wsl --install
```

Restart your computer, then install Radicle in WSL:
```bash
# In WSL terminal:
curl -sSf https://radicle.xyz/install | sh
rad auth
```

## Quick Start

### Extract the Package

```powershell
# Using PowerShell
Expand-Archive -Path secular-gui-share.tar.gz -DestinationPath .

# OR using Git Bash (if installed)
tar -xzf secular-gui-share.tar.gz
```

### Install and Run

```powershell
# 1. Navigate to the directory
cd secular-gui-share

# 2. Install dependencies
npm install

# 3. Build the frontend
npm run build

# 4. Start the server
node server.js

# 5. Open in your browser
# Visit: http://localhost:5288
```

## What You Can Do

### Friends Tab (P2P Collaboration)
- **Add Friends**: Add peers by their Radicle Node ID
- **Push/Pull**: Share code directly with friends peer-to-peer
- **Sync**: Announce changes to the network

### Other Features
- **Dashboard**: System overview and metrics
- **Scanner**: Secret scanning and security checks
- **Monitor**: Cost tracking and analytics
- **Deploy**: Cloud deployment wizard

## Adding a Friend

### Get Your Node ID

**Using WSL:**
```bash
# In WSL terminal
rad self --nid
```

**Using Git Bash:**
```bash
rad self --nid
```

### Share Your Node ID
Your Node ID looks like: `did:key:z6Mk...` (long string)

### Add Friend in GUI

1. Click "Friends" in sidebar
2. Click "Add Friend"
3. Enter their name and Node ID
4. Click "Add Friend"

Now you can push/pull repos directly!

## Sharing Repositories

### From the GUI:
- Go to Friends tab
- Click "Push" to send changes to a friend
- Click "Pull" to get their changes
- Click "Sync" to announce to the network

### From CLI:
```bash
# Add friend as remote (in WSL or Git Bash)
rad remote add did:key:z6Mk... --name alice

# Push to friend
git push alice main

# Pull from friend
git pull alice main
```

## Troubleshooting

### "rad: command not found"

**If using WSL:**
```bash
# Make sure Radicle is in PATH
echo 'export PATH="$HOME/.radicle/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Port 5288 already in use

```powershell
# Use a different port
$env:PORT=8888; node server.js
```

### Can't extract .tar.gz

Install 7-Zip:
- Download from: https://www.7-zip.org/
- Right-click file → 7-Zip → Extract Here

### Node not running

**In WSL:**
```bash
rad node start
```

## Windows-Specific Notes

### Running Radicle Commands

Most `rad` commands need to run in WSL or Git Bash, not PowerShell:

```powershell
# Option 1: Use WSL
wsl rad self --nid

# Option 2: Use Git Bash
# Open Git Bash and run commands there
```

### File Paths

If you need to access files from both Windows and WSL:
- Windows files in WSL: `/mnt/c/Users/YourName/...`
- WSL files in Windows: `\\wsl$\Ubuntu\home\username\...`

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js API server
- **Design**: Ethereal Glass glassmorphism theme
- **Port**: 5288 (customizable via PORT env var)

## Firewall Settings (For P2P)

To accept incoming connections from friends:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. TCP, Specific port: 5288
6. Allow the connection
7. Name it "Secular GUI"

## Support

For issues or questions about:
- **Secular GUI**: Check the GitHub repo
- **Radicle on Windows**: https://radicle.xyz/docs
- **WSL**: https://docs.microsoft.com/en-us/windows/wsl/
