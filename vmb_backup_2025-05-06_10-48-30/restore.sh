#!/bin/bash

# VMB Simple Restore Script
# Generated automatically

# Get the backup directory path
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_NAME="$(basename "$BACKUP_DIR")"

echo "Preparing to restore from backup: $BACKUP_NAME"
echo "Backup location: $BACKUP_DIR"

# Choose restore target
TARGET_DIR="$(cd "${BACKUP_DIR}/.." && pwd)"
echo "Will restore to: $TARGET_DIR"
read -p "This will overwrite existing files. Continue? (y/n): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Restore aborted"
  exit 1
fi

# Stop any running server
echo "Stopping any running processes..."
pkill -f "node" 2>/dev/null || true
sleep 2

# Restore the files
echo "Restoring client files..."
cp -r "$BACKUP_DIR/client/"* "$TARGET_DIR/client/" 2>/dev/null

echo "Restoring server files..."
cp -r "$BACKUP_DIR/server/"* "$TARGET_DIR/server/" 2>/dev/null

echo "Restoring shared files..."
cp -r "$BACKUP_DIR/shared/"* "$TARGET_DIR/shared/" 2>/dev/null

echo "Restoring scripts..."
cp -r "$BACKUP_DIR/scripts/"* "$TARGET_DIR/scripts/" 2>/dev/null

# Restore configuration files
echo "Restoring configuration files..."
cp "$BACKUP_DIR/package.json" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/tsconfig.json" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/vite.config.ts" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/tailwind.config.ts" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/postcss.config.js" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/drizzle.config.ts" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/.env" "$TARGET_DIR/" 2>/dev/null
cp "$BACKUP_DIR/theme.json" "$TARGET_DIR/" 2>/dev/null

echo "Restore completed!"
echo "You can now restart your application"
