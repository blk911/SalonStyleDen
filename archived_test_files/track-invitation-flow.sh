#!/bin/bash

# Create a directory for logs if it doesn't exist
mkdir -p ./logs

LOGFILE="./logs/invitation_flow_$(date +"%Y%m%d_%H%M%S").log"

echo "=========================================="
echo "INVITATION FLOW TRACKING"
echo "=========================================="
echo "Tracking development bypass usage for invitation flow"
echo "Output will be logged to: $LOGFILE"
echo ""
echo "Events being tracked:"
echo "- Promo code validation attempts"
echo "- Development bypasses"
echo "- Client dashboard redirects"
echo ""
echo "Press Ctrl+C to stop tracking"
echo "=========================================="

# Watch server logs for specific patterns related to invitation flow
(grep -E "DEVELOPMENT BYPASS|Validating promo code|phone.*5127715877" <(tail -f ../workflow_logs.txt) | tee -a "$LOGFILE") &

PID=$!

# Trap to clean up background process on exit
trap "kill $PID; echo -e '\nTracking stopped - $(date)'; exit" INT TERM EXIT

# Keep script running
while true; do
  sleep 1
done