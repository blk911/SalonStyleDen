#!/bin/bash

# Purge Database Script
# This script runs the purge-testing-data.js script followed by verify-purge-state.js
# to provide a complete database reset and verification process.

echo "===================================================="
echo "  PURGE DATABASE - RESET ALL CLIENT DATA"
echo "===================================================="
echo "This will DELETE ALL clients, invitations, and related data!"
echo "Only the essential salon data will be preserved."
echo ""
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Run the purge script
echo ""
echo "Running purge operation..."
node purge-data.js

# Run verification
echo ""
echo "Running verification..."
node verify-data.js

echo ""
echo "===================================================="
echo "  PURGE OPERATION COMPLETE"
echo "===================================================="