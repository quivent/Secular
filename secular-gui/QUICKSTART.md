# Quick Start - Friend-to-Friend Setup

Complete guide to get you and your Windows friend sharing code peer-to-peer in under 10 minutes.

---

## 📦 Part 1: Share the Package

### You (macOS/Linux):

```bash
# The package is ready at:
/Users/joshkornreich/Documents/Projects/Secular/secular-gui/secular-gui-share.tar.gz

# Size: 20KB (tiny because dependencies download separately)
```

**Send this file to your friend via:**
- Email attachment
- Dropbox/Google Drive
- USB drive
- Chat app (Discord, Slack, etc.)

---

## 💻 Part 2: Your Friend Sets Up (Windows)

### Step 1: Install Prerequisites

**Node.js:**
- Download: https://nodejs.org/
- Choose "Windows Installer (.msi)"
- Use all default options
- Restart terminal after install

**Git for Windows:**
- Download: https://git-scm.com/download/win
- Use all default options
- Restart terminal after install

**7-Zip (for extracting .tar.gz):**
- Download: https://www.7-zip.org/
- Install normally

### Step 2: Extract the Package

**Option A: Using 7-Zip (easiest)**
1. Right-click `secular-gui-share.tar.gz`
2. Click "7-Zip" → "Extract Here"
3. Right-click the resulting `.tar` file
4. Click "7-Zip" → "Extract Here" again
5. You now have `secular-gui-share/` folder

**Option B: Using Git Bash**
```bash
tar -xzf secular-gui-share.tar.gz
```

**Option C: Using PowerShell**
```powershell
# First extract .gz to .tar (7-Zip needed), then:
tar -xf secular-gui-share.tar
```

### Step 3: Install and Run

Open **PowerShell** or **Git Bash** and run:

```bash
cd secular-gui-share

# Install dependencies (downloads 162MB - takes 2-5 min)
npm install

# Build the frontend (takes ~30 seconds)
npm run build

# Start the server
node server.js
```

You should see:
```
Secular GUI API running on http://0.0.0.0:5288
```

### Step 4: Open in Browser

Visit: **http://localhost:5288**

You should see the Secular GUI with:
- Dashboard
- Scanner
- Monitor
- Deploy
- **Friends** ← Click here!
- Settings

---

## 🔑 Part 3: Exchange Node IDs

### Your Friend (Windows):

**Install Radicle in WSL (recommended):**

1. **Install WSL2:**
   ```powershell
   # In PowerShell as Administrator:
   wsl --install
   ```
   Restart computer after this.

2. **Install Radicle in WSL:**
   ```bash
   # In WSL (Ubuntu) terminal:
   curl -sSf https://radicle.xyz/install | sh

   # Add to PATH
   echo 'export PATH="$HOME/.radicle/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   # Create identity
   rad auth
   ```

3. **Get their Node ID:**
   ```bash
   rad node status --only nid
   ```

   Example output:
   ```
   did:key:z6MkxYz...ABC123
   ```

4. **Send you this Node ID** via text/email/chat

### You (macOS):

**Get your Node ID:**
```bash
rad node status --only nid
```

Your Node ID:
```
did:key:z6MkmVEDLxM3R58Aj4bnUpRUt8xP2WFgqtZUPseHDKcmT2tt
```

**Send this to your friend** via text/email/chat

---

## 👥 Part 4: Add Each Other as Friends

### In the Secular GUI (Both of you):

1. Click **"Friends"** in the left sidebar
2. Click **"Add Friend"** button (blue, top right)
3. **Friend Name:** Enter their name (e.g., "josh" or "alex")
4. **Node ID:** Paste their full Node ID (the `did:key:z6Mk...` string)
5. Click **"Add Friend"**

You should now see them in your friends list!

---

## 🚀 Part 5: Share a Repository

### Option A: Using the GUI (Easiest)

**To push changes to your friend:**
1. Go to **Friends** tab
2. Find your friend in the list
3. Click **"Push"** button
4. Changes are sent!

**To get their changes:**
1. Go to **Friends** tab
2. Find your friend in the list
3. Click **"Pull"** button
4. Changes downloaded!

**To announce to the network:**
1. Click **"Sync"** button
2. Other Radicle users can discover your changes

### Option B: Using Command Line

**Add friend as git remote:**
```bash
# In your repository
cd /path/to/your/repo

# Add friend (use their name and Node ID)
rad remote add did:key:THEIR_NODE_ID --name friendname

# Push to them
git push friendname main

# Pull from them
git pull friendname main
```

---

## 🔒 Security Notes

**✅ This setup is SAFE because:**
- GUI runs on localhost only (not exposed to internet)
- Command injection protection active
- Uses Radicle's public seed nodes (no ports to open)
- No configuration needed

**Default behavior:**
- You push/pull through Radicle's public seed network
- No need to open firewall ports
- Works immediately
- Slightly slower than direct connection (but easier and safer)

**For faster direct connections (optional, advanced):**
See `ENABLE-P2P-CONNECTIONS.md` for:
- Opening port 8776
- Using Tailscale VPN
- Firewall configuration

---

## 📝 Common Issues

### "rad: command not found" (Windows)

**In PowerShell:**
```powershell
# Run rad commands in WSL instead:
wsl rad node status --only nid
```

**Or open WSL terminal:**
```powershell
wsl
# Now you're in Linux, rad commands work
rad node status --only nid
```

### "Node not running"

```bash
# Start the Radicle node
rad node start

# Check status
rad node status
```

### "Port 5288 already in use"

```bash
# Use a different port
PORT=8888 node server.js
# Then visit http://localhost:8888
```

### "Can't extract .tar.gz on Windows"

Download 7-Zip: https://www.7-zip.org/
Then right-click → 7-Zip → Extract

### "npm install fails"

```bash
# Clear cache and retry
npm cache clean --force
npm install
```

---

## 📊 What Just Happened?

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   You       │◄───────►│  Radicle Seed    │◄───────►│ Your Friend │
│  (macOS)    │         │  Network (P2P)   │         │  (Windows)  │
│             │         │                  │         │             │
│ localhost   │         │  Public relays   │         │ localhost   │
│ :5288       │         │  (secure)        │         │ :5288       │
└─────────────┘         └──────────────────┘         └─────────────┘
```

**No ports opened!** Everything goes through Radicle's public infrastructure.

---

## 🎯 Next Steps

1. **Create/clone a repo:**
   ```bash
   cd my-project
   git init
   rad init --name "My Project" --description "Shared with friend"
   ```

2. **Push to friend:**
   ```bash
   git push friendname main
   ```

3. **Friend clones:**
   ```bash
   rad clone rad:YOUR_REPO_ID
   ```

4. **Collaborate!**
   - Push/pull changes
   - Review in GUI's Friends tab
   - Track sync status

---

## 📚 Full Documentation

- **SETUP.md** - Detailed setup instructions
- **SETUP-WINDOWS.md** - Windows-specific guide
- **SECURITY.md** - Complete security assessment
- **ENABLE-P2P-CONNECTIONS.md** - Advanced direct connection setup

---

## 🆘 Need Help?

**Radicle Documentation:** https://radicle.xyz/docs
**Node ID issues:** Make sure both ran `rad auth` to create identities
**GUI issues:** Check browser console (F12) for errors
**Connection issues:** Both run `rad node status` to verify nodes are running

---

**Total Setup Time:**
- Installing prerequisites: 5-10 minutes
- Extracting + building: 3-5 minutes
- Adding each other: 1 minute
- **Total: ~10-15 minutes** 🚀
