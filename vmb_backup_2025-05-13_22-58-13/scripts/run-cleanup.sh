#!/bin/bash
# VMB Database Cleanup Runner
# This script runs the TypeScript database cleanup script

echo "=== VMB System Cleanup ==="
echo "This script will purge the system except for Tiffany's salon data"
echo "All clients, invitations, and artifacts will be removed for a clean database state"
echo ""
echo "WARNING: This is a destructive operation and cannot be undone!"
echo "Make sure you have a backup before proceeding."
echo ""
read -p "Are you sure you want to proceed? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Cleanup aborted."
  exit 0
fi

echo ""
echo "Starting cleanup process..."
echo ""

# Make sure dependencies are installed
npx tsx scripts/db-cleanup.ts

echo ""
echo "Cleanup script completed."
echo "You may need to restart the application for changes to take effect."