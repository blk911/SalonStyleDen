#!/bin/bash

# Tracking script for client invitation flow
echo "=========================================="
echo "TRACKING CLIENT INVITATION FLOW - $(date)"
echo "=========================================="

# Set up a temporary directory for storing logs
mkdir -p ./logs/invitation-flow

# Start time tracking
START_TIME=$(date +%s)

# Log API requests
echo "Monitoring API requests for invitation flow..."
echo "Watch this terminal for live updates as actions are performed."
echo ""
echo "INSTRUCTIONS:"
echo "1. Open the salon dashboard"
echo "2. Send an invitation to a client"
echo "3. Check that the invitation appears in the salon dashboard"
echo "4. Check if style selections work for this client"
echo ""
echo "Press Ctrl+C to stop tracking"
echo "=========================================="

# Get initial state of invitations
echo "[$(date +"%T")] Getting initial state of invitations for salon 1..."
curl -s -X GET "http://localhost:5000/api/salons/1/invitations" | jq . > ./logs/invitation-flow/initial_invitations.json
echo "Initial invitations state saved to ./logs/invitation-flow/initial_invitations.json"

# Watch for API requests related to invitations
tail -f ./logs/*.log | grep -E "(POST /api/invitations|GET /api/invitations|/api/clients|style-selections)" &
TAIL_PID=$!

# Trap to clean up background process on exit
trap "kill $TAIL_PID; echo -e '\nTracking stopped - $(date)'; exit" INT TERM EXIT

# Keep script running
while true; do
  sleep 1
done
