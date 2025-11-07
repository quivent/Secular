#!/bin/bash
# Convert git repositories to radicle
# Usage: ./convert-to-radicle.sh <repo-name> [--private]

REPO_NAME="$1"
VISIBILITY="${2:---public}"

if [ -z "$REPO_NAME" ]; then
    echo "Usage: $0 <repo-name> [--private|--public]"
    echo ""
    echo "Available repos:"
    ls -d ~/Documents/Projects/*/.git 2>/dev/null | sed 's|/.git||' | sed 's|.*/||'
    exit 1
fi

REPO_PATH=~/Documents/Projects/"$REPO_NAME"

if [ ! -d "$REPO_PATH/.git" ]; then
    echo "Error: $REPO_PATH is not a git repository"
    exit 1
fi

echo "Converting $REPO_NAME to radicle..."
echo "Path: $REPO_PATH"
echo "Visibility: $VISIBILITY"
echo ""

cd "$REPO_PATH"

# Check if already a radicle repo
if git remote | grep -q "^rad$"; then
    echo "✓ Already a radicle repository"
    rad inspect
    exit 0
fi

# Initialize radicle
echo "Initializing radicle..."
rad init \
    --name "$REPO_NAME" \
    --description "$(basename $REPO_PATH) repository" \
    $VISIBILITY \
    --no-confirm

# Push to radicle
echo ""
echo "Pushing to radicle network..."
git push rad main || git push rad master

# Show repository info
echo ""
echo "✓ Repository converted successfully!"
rad inspect
echo ""
echo "Share with friend using:"
echo "  RID: $(rad inspect)"
echo "  Your Node ID: z6MkmVEDLxM3R58Aj4bnUpRUt8xP2WFgqtZUPseHDKcmT2tt"
echo ""
echo "Friend can clone with:"
echo "  rad clone $(rad inspect) --seed <your-ip>:8776"
