# How to Upload Private Repositories to Your GCP Server

## Quick Reference

**Server**: 35.222.36.165:8776
**Node ID**: z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3

## Step-by-Step: Upload a Private Repository

### 1. Initialize Your Local Repository as Private

```bash
cd /path/to/your/repo

# Initialize as PRIVATE Radicle repository
rad init --private --name "My Project" --description "Private project"
```

### 2. Add Your GCP Server as a Seed

```bash
# Add your server to seed this repo
rad seed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 --address 35.222.36.165:8776
```

### 3. Push to Your Server

```bash
# Sync the repository to your server
rad sync --announce
```

### 4. Verify Upload

```bash
# Check that your repo is seeded
rad seed
```

Or visit: http://35.222.36.165:5288

---

## Using Secular CLI (Alternative)

```bash
cd /path/to/your/repo

# Initialize as private
rad init --private

# Add server as friend
secular friend add z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 --address 35.222.36.165:8776

# Publish to server
secular repos publish
```

---

## Important Privacy Notes

### Private Repository Behavior

When you use `--private`:
- ✅ Only seeded on nodes you explicitly add
- ✅ Not announced to public network
- ✅ Only accessible to people you grant access to
- ✅ Your server won't share it with other peers

### Public Repository Behavior

Without `--private`:
- ❌ Announced to entire Radicle network
- ❌ Any peer can discover and clone it
- ❌ Your server may share it with other nodes

---

## Managing Repository Privacy

### Check if a repo is private

```bash
rad inspect
```

### Make an existing repo private

```bash
# Set repository visibility
rad edit --private
```

### Make an existing repo public

```bash
rad edit --public
```

---

## Full Example Workflow

```bash
# 1. Go to your project
cd ~/my-secret-project

# 2. Make it a private Radicle repo
rad init --private \
  --name "Secret Project" \
  --description "My private code"

# 3. Add your GCP server
rad seed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 \
  --address 35.222.36.165:8776

# 4. Sync to server
rad sync --announce

# 5. Verify it's there
rad seed

# 6. Check the web GUI
open http://35.222.36.165:5288
```

---

## Granting Access to Others

To let someone else access your private repo:

```bash
# They need to:
# 1. Get the Repository ID (RID) from you
# 2. Add your server as a seed
# 3. Clone

# Example:
rad clone <YOUR_RID> --seed 35.222.36.165:8776
```

---

## Troubleshooting

### Repo not showing on server?

```bash
# Check connection
rad node status

# Verify seeds
rad seed

# Force re-sync
rad sync --force
```

### Want to remove from server?

```bash
# Unseed from your server
rad unseed z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3
```

---

## Summary Commands

| Action | Command |
|--------|---------|
| Init private repo | `rad init --private` |
| Add GCP server | `rad seed <node-id> --address <ip:port>` |
| Upload to server | `rad sync --announce` |
| Check seeds | `rad seed` |
| Make repo private | `rad edit --private` |
| Grant access | Share RID + server address |
