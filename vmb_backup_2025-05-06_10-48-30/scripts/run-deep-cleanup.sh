#!/bin/bash
# VMB Deep Database Cleanup Runner
# This script runs the TypeScript deep database cleanup script

echo "=== VMB Deep System Cleanup ==="
echo "This script will remove ALL data except Tiffany's basic salon information"
echo "All services, promotions, and other salon data will be removed"
echo ""
echo "WARNING: This is a destructive operation and cannot be undone!"
echo "Make sure you have a backup before proceeding."
echo ""
read -p "Are you sure you want to proceed with this deep cleanup? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Deep cleanup aborted."
  exit 0
fi

echo ""
echo "Starting deep cleanup process..."
echo ""

# Make sure dependencies are installed
npx tsx scripts/deep-cleanup.ts

echo ""
echo "Deep cleanup script completed."
echo "You may need to restart the application for changes to take effect."