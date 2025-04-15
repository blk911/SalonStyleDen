#!/bin/bash

# Restore benchmark script for SalonStyleDen
# Created: April 15, 2025

echo "Restoring codebase to benchmark state (April 15, 2025)..."

# Store the current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: You have uncommitted changes that will be stashed."
  git stash save "Auto-stashed before benchmark restoration"
  STASHED=1
else
  STASHED=0
fi

# Checkout the specific commit
git checkout 8290a29

echo "Codebase restored to benchmark state:"
echo "- Fixed VMB Style Options display issue"
echo "- Removed Seasonal Spring Special from style options"
echo "- Optimized image handling and fallbacks"

# Instructions for returning to the previous state
echo ""
echo "To return to your previous branch ($CURRENT_BRANCH), run:"
echo "git checkout $CURRENT_BRANCH"

if [ $STASHED -eq 1 ]; then
  echo ""
  echo "To restore your uncommitted changes, run:"
  echo "git stash pop"
fi

echo ""
echo "Benchmark restoration complete!"