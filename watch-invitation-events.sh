#!/bin/bash

# Create a directory for logs if it doesn't exist
mkdir -p ./logs

echo "=========================================="
echo "WATCHING FOR INVITATION & STYLE SELECTION EVENTS"
echo "=========================================="
echo "This script will show invitation-related events as they happen."
echo ""
echo "Events being tracked:"
echo "- Client invitations (create/update)"
echo "- Style selections"
echo "- Client registrations"
echo ""
echo "Press Ctrl+C to stop watching"
echo "=========================================="

# Use workflow logs directly (more reliable than API logs)
echo "Setting up event watchers..."

# Run the workflow watch in the background
(while true; do
  sleep 5
  workflow_output=$(curl -s http://localhost:5000/api/health | grep -i -E "invitation|selection|client" || true)
  if [ ! -z "$workflow_output" ]; then
    echo "[$(date +"%T")] $workflow_output"
  fi
done) &

WATCH_PID=$!

# Trap to clean up background process on exit
trap "kill $WATCH_PID; echo -e '\nWatching stopped - $(date)'; exit" INT TERM EXIT

# Main event monitor - watch workflow logs for invitation related events
tail -f ../workflow_logs.txt | grep -i --color=auto -E "invitation|createInvitation|style_selection|createClient" 

