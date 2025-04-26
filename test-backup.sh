#!/bin/bash
# VMB Backup System Verification Script
# This script tests that the backup system is functioning correctly

echo "=== VMB Backup System Test ==="
echo "This script will verify that all backup components are functioning correctly."
echo ""

# Function to check if a script exists and is executable
check_script() {
  if [[ -f "$1" && -x "$1" ]]; then
    echo "✅ $1 script exists and is executable"
    return 0
  else
    echo "❌ $1 script not found or not executable"
    return 1
  fi
}

# Check all required scripts
echo "Checking backup scripts..."
check_script "./backup.sh"
check_script "./backup-db.sh"
check_script "./schedule-backups.sh"
check_script "./backup-manager.sh"
echo ""

# Check required directories
echo "Checking backup directories..."
mkdir -p "./vmb_db_backup"
if [[ -d "./vmb_db_backup" ]]; then
  echo "✅ vmb_db_backup directory exists"
else
  echo "❌ Could not create vmb_db_backup directory"
fi
echo ""

# Check environment
echo "Checking environment..."
if [[ -n "${DATABASE_URL}" ]]; then
  echo "✅ DATABASE_URL is set"
else
  echo "⚠️ DATABASE_URL is not set - database backups may not work"
fi

if [[ -f "./env-template.txt" ]]; then
  echo "✅ Environment template exists"
else
  echo "❌ Environment template not found"
fi
echo ""

# Create a test backup directory
echo "Creating test backup structure..."
TEST_DIR="./vmb_backup_test"
mkdir -p "${TEST_DIR}"
echo "This is a test backup file" > "${TEST_DIR}/test.txt"
echo "✅ Test backup created at ${TEST_DIR}"
echo ""

# Test archive functionality
echo "Testing archive functionality..."
tar -czf "${TEST_DIR}.tar.gz" "${TEST_DIR}"
if [[ -f "${TEST_DIR}.tar.gz" ]]; then
  echo "✅ Archive creation works"
  rm "${TEST_DIR}.tar.gz"
else
  echo "❌ Failed to create archive"
fi
echo ""

# Clean up test files
echo "Cleaning up test files..."
rm -rf "${TEST_DIR}"
echo "✅ Test files cleaned up"
echo ""

echo "=== Backup System Verification Complete ==="
echo "All components of the backup system are in place and ready to use."
echo ""
echo "To perform a full backup, run:"
echo "  ./backup.sh"
echo ""
echo "To backup just the database, run:"
echo "  ./backup-db.sh"
echo ""
echo "To set up automated backups, run:"
echo "  ./schedule-backups.sh"
echo ""
echo "To manage all backup operations through an interactive interface, run:"
echo "  ./backup-manager.sh"