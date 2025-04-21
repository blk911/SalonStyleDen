#!/bin/bash

# Full Purge Execution Script
# April 18, 2025
# This script executes the full-purge.js operation to clean all test data

echo "=================================================="
echo "  Ven Me, Baby! Full Purge Tool"
echo "  Version: 1.0 (April 18, 2025)"
echo "=================================================="
echo ""
echo "This script will purge ALL clients, invitations, and related data"
echo "while preserving salon information."
echo ""
echo "WARNING: This operation cannot be undone!"
echo "=================================================="
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Operation cancelled."
  exit 0
fi

echo ""
echo "Starting purge operation..."

# Run the purge script with Node.js
node full-purge.js

echo ""
echo "Purge operation completed."
echo ""
echo "To restart the application with a clean state, use the workflow restart."
echo "=================================================="