#!/bin/bash

echo "========================================"
echo "   DATABASE CLEANUP TOOL"
echo "========================================"
echo "WARNING: This will delete all data EXCEPT for Tiffany's profile and VMB, LTD."
echo "All clients, invitations, and other salons will be PERMANENTLY deleted."
echo "========================================"
echo "Press Ctrl+C to cancel or Enter to continue..."
read -r

# Run the cleanup script
node cleanup-db.js

echo "Cleanup complete."