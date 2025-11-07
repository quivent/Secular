# Safe Repository Sync Test

Test syncing a single private repository to your GCP server.

## Pre-Flight Check

**Your GCP Server:**
- Node ID: `z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3`
- Address: `35.222.36.165:8776`
- Web UI: http://source.oceanica.network

**What this test will do:**
1. ✅ Add GCP server as a seed for ONE repository
2. ✅ Sync that repository to the server
3. ✅ Verify it appears on the remote server
4. ✅ Confirm it remains private
5. ✅ Show you how to unseed if needed

---

## Step 1: Choose a Test Repository

**Recommended:** Pick a small, non-critical repository for your first test.

```bash
# List your repositories
rad ls

# Choose one that is:
# - Private (visibility: private)
# - Small size (for faster sync)
# - Not your most critical work (for safety)
```

**Good choices from your repos:**
- `TaoBot-Trader` - Trading bot project
- `projects-portfolio` - Portfolio project
- `League-Of-Sages` - Smaller project

**Avoid for first test:**
- `Secular` - The current project (can test later)
- `ClaudesRedemption` - Main project (test after confirming it works)

---

## Step 2: Navigate to Repository

```bash
# Example using TaoBot-Trader:
cd ~/path/to/TaoBot-Trader

# Or if you're already in a git repo, make sure it's radicle-initialized:
rad .
```

---

## Step 3: Check Current Seeds (Before)

```bash
# See what seeds this repo currently has
rad seed

# You should see something like:
# ╭─────────────────────────────────────────╮
# │ No seeds configured                     │
# ╰─────────────────────────────────────────╯
# Or a list of current seeds
```

---

## Step 4: Add GCP Server as Seed

```bash
# Add your GCP server
rad seed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 \
  --address 35.222.36.165:8776

# You should see:
# ✓ Seed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 added
```

**What this does:**
- Tells your local node to replicate this repo to the GCP server
- Does NOT send data yet (that's the next step)
- Only affects THIS repository

---

## Step 5: Verify Seed Was Added

```bash
# Check seeds again
rad seed

# You should now see:
# ╭──────────────────────────────────────────────────╮
# │ Node ID            Address                       │
# ├──────────────────────────────────────────────────┤
# │ z6MksRcAyP...      35.222.36.165:8776            │
# ╰──────────────────────────────────────────────────╯
```

---

## Step 6: Sync to Server (The Actual Upload)

```bash
# Sync with announcement (makes it discoverable on the server)
rad sync --announce

# You should see:
# ✓ Syncing with 1 seed(s)...
# ✓ Synced with z6MksRcAyP... (35.222.36.165:8776)

# Or for more verbose output:
rad sync --announce --verbose
```

**What `--announce` does:**
- Announces to the seed that this repo is available
- For PRIVATE repos: Only announced to seeds you explicitly added
- For PUBLIC repos: Would be announced to the entire network

**Important:** Since your repo is `--private`, only the GCP server will know about it.

---

## Step 7: Verify on Remote Server

**Option A: Check via Web UI**
1. Visit http://source.oceanica.network
2. Look for your repository in the list
3. It should appear with visibility: "private"

**Option B: Check via SSH**
```bash
# SSH into GCP server
gcloud compute ssh secular-node --zone=us-central1-a

# On the server, list repos:
rad ls

# Look for your repository by name or RID
# You should see it listed
```

---

## Step 8: Verify Privacy

**Your repository remains private because:**

1. **Not on public network:**
   ```bash
   # Check your repo's visibility
   rad inspect
   # Should show: visibility: private
   ```

2. **Only on seeds you added:**
   - Only your GCP server has it
   - Not announced to other nodes
   - Not discoverable by random peers

3. **Access control:**
   - Only you can clone (you have the private key)
   - Others would need your explicit permission (you'd have to share RID + seed info)

---

## Step 9: Test Bidirectional Sync (Optional)

**Make a change locally and push:**
```bash
# In your repository:
echo "Test sync" >> test-sync.txt
git add test-sync.txt
git commit -m "Test sync to remote"

# Push to radicle
git push rad

# Sync to server again
rad sync
```

**Check on server:**
```bash
# Via web UI: http://source.oceanica.network
# Look for the new commit in your repository
```

---

## Step 10: How to Unseed (If Needed)

If you want to remove the repository from the GCP server:

```bash
# Remove the seed
rad unseed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3

# The repo will eventually be removed from the server
# (May take time as the server garbage collects)
```

**Note:** Unseeding doesn't delete your local copy, only stops syncing to that server.

---

## Troubleshooting

**"Seed not reachable":**
```bash
# Check if your local node is running
rad node status

# Try pinging the server
ping 35.222.36.165

# Check seeds
rad seed
```

**"Permission denied":**
```bash
# Make sure the repo is initialized
rad inspect

# Verify you're in the right directory
pwd
```

**"Sync failed":**
```bash
# Try with verbose output
rad sync --announce --verbose

# Check node logs
rad node logs
```

---

## Quick Command Summary

```bash
# 1. Navigate to repository
cd ~/path/to/repo

# 2. Check current seeds
rad seed

# 3. Add GCP server
rad seed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 --address 35.222.36.165:8776

# 4. Sync to server
rad sync --announce

# 5. Verify
rad seed
# Visit: http://source.oceanica.network

# 6. (Optional) Remove seed
rad unseed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3
```

---

## After Successful Test

Once you've verified this works:

1. ✅ Test with one more repository
2. ✅ Test pulling changes FROM the server (clone on another machine)
3. ✅ Bulk sync all repos using the GUI Deploy tab
4. ✅ Set up automated syncing (cron job or daemon)

---

**Ready to proceed?** Choose a test repository and run the commands above!
