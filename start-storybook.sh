#!/bin/bash

echo "Starting VMB Platform Storybook..."
echo "This will provide interactive component documentation"

# Kill any existing storybook processes
pkill -f "storybook" 2>/dev/null

# Start Storybook
cd /home/runner/workspace
npx storybook dev -p 6006 --host 0.0.0.0 --no-open --quiet &

# Wait a moment for startup
sleep 5

echo "Storybook should be available at:"
echo "- Port 6006 in your Replit preview"
echo "- https://$(echo $REPL_SLUG).$(echo $REPL_OWNER).replit.dev:6006"
echo ""
echo "Component stories include:"
echo "- UI Components (Button, Card, Forms)"
echo "- VMB Platform Components (Style Options, Client Forms)"
echo "- Dashboard Components (Admin, Gifts Management)"
echo ""
echo "Access via the preview panel and change port to 6006"