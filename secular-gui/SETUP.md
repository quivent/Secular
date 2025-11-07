# Secular GUI - Setup Guide

Elite P2P code collaboration GUI for Radicle/Secular.

## Prerequisites

1. **Node.js** (v18 or later)
2. **Radicle CLI** installed and configured
   - Install from: https://radicle.xyz/downloads
   - Run `rad auth` to set up your identity

## Quick Start

```bash
# 1. Navigate to the GUI directory
cd secular-gui

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

1. Get your friend's Node ID:
   ```bash
   rad self --nid
   ```

2. Share your Node ID with them (starts with `did:key:...`)

3. In the GUI:
   - Click "Friends" in sidebar
   - Click "Add Friend"
   - Enter their name and Node ID
   - Click "Add Friend"

4. Now you can push/pull repos directly!

## Sharing Repositories

### From the GUI:
- Go to Friends tab
- Click "Push" to send changes to a friend
- Click "Pull" to get their changes
- Click "Sync" to announce to the network

### From CLI:
```bash
# Add friend as remote
rad remote add did:key:z6Mk... --name alice

# Push to friend
git push alice main

# Pull from friend
git pull alice main
```

## Troubleshooting

### "Node not running"
Start the Radicle node:
```bash
rad node start
```

### Port 5288 already in use
Change the port by setting an environment variable:
```bash
PORT=8888 node server.js
```

### Can't find `rad` command
Make sure Radicle CLI is installed and in your PATH:
```bash
which rad
rad --version
```

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js API server
- **Design**: Ethereal Glass glassmorphism theme
- **Port**: 5288 (customizable via PORT env var)

## Support

For issues or questions about:
- **Secular GUI**: Check the GitHub repo
- **Radicle**: Visit https://radicle.xyz/docs
