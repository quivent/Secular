#!/bin/bash
# Safe repository sync test script

set -e

echo "🧪 Secular Repository Sync Test"
echo "================================"
echo ""

# Configuration
GCP_NODE_ID="z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3"
GCP_ADDRESS="35.222.36.165:8776"
WEB_UI="http://source.oceanica.network"

# Ask for repository name
echo "Available repositories:"
rad ls 2>&1 | grep -v "╭\|╰\|│ Name" | grep "│"
echo ""
read -p "Enter repository name to test (e.g., TaoBot-Trader): " REPO_NAME

if [ -z "$REPO_NAME" ]; then
    echo "❌ No repository name provided"
    exit 1
fi

# Find repository path
REPO_PATH=$(find ~/Documents/Projects -maxdepth 2 -type d -name "$REPO_NAME" 2>/dev/null | head -1)

if [ -z "$REPO_PATH" ]; then
    echo "❌ Repository not found in ~/Documents/Projects"
    echo "Please provide the full path:"
    read -p "Path: " REPO_PATH
fi

if [ ! -d "$REPO_PATH" ]; then
    echo "❌ Directory does not exist: $REPO_PATH"
    exit 1
fi

cd "$REPO_PATH"
echo "✓ Changed to: $REPO_PATH"
echo ""

# Step 1: Verify it's a radicle repo
echo "Step 1: Verifying radicle repository..."
if ! rad inspect &>/dev/null; then
    echo "❌ Not a radicle repository"
    echo "Initialize with: rad init --private"
    exit 1
fi

# Get repo info
REPO_RID=$(rad inspect 2>/dev/null | grep -o 'rad:z[a-zA-Z0-9]*' | head -1)
VISIBILITY=$(rad inspect 2>/dev/null | grep -i visibility | awk '{print $2}')

echo "✓ Repository ID: $REPO_RID"
echo "✓ Visibility: $VISIBILITY"

if [ "$VISIBILITY" != "private" ]; then
    echo "⚠️  Warning: Repository is not private!"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi
echo ""

# Step 2: Check current seeds
echo "Step 2: Current seeds..."
rad seed
echo ""

# Step 3: Add GCP server
echo "Step 3: Adding GCP server as seed..."
read -p "Add GCP server (z6MksRcAyP...) as seed? (y/N): " ADD_SEED

if [ "$ADD_SEED" = "y" ] || [ "$ADD_SEED" = "Y" ]; then
    rad seed "$GCP_NODE_ID" --address "$GCP_ADDRESS"
    echo "✓ Seed added"
else
    echo "Skipped adding seed"
fi
echo ""

# Step 4: Verify seed
echo "Step 4: Verifying seeds..."
rad seed
echo ""

# Step 5: Sync to server
echo "Step 5: Sync to GCP server..."
read -p "Sync repository to GCP server? (y/N): " DO_SYNC

if [ "$DO_SYNC" = "y" ] || [ "$DO_SYNC" = "Y" ]; then
    echo "Syncing..."
    rad sync --announce --verbose
    echo "✓ Sync complete"
else
    echo "Skipped sync"
    exit 0
fi
echo ""

# Step 6: Verification instructions
echo "✅ Test Complete!"
echo ""
echo "Verify the sync:"
echo "1. Visit web UI: $WEB_UI"
echo "2. Look for repository: $REPO_NAME"
echo "3. Check RID matches: $REPO_RID"
echo ""
echo "To remove from server later:"
echo "  cd $REPO_PATH"
echo "  rad unseed $GCP_NODE_ID"
echo ""
echo "Full documentation: SAFE_SYNC_TEST.md"
