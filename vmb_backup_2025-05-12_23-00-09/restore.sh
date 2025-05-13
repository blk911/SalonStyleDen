#!/bin/bash

# Restore script for vmb_backup_2025-05-12_23-00-09
# This will restore the VMB project to the state when the invitation template processing fix was implemented

# Get the backup directory path
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BACKUP_DIR/.." && pwd)"

echo "=== VMB Restore: Invitation Template Processing Fix (2025-05-12) ==="
echo "Restoring from backup in: $BACKUP_DIR"

# Confirm with the user
echo -n "This will overwrite your current files. Are you sure you want to continue? (y/n): "
read -r confirmation
if [ "$confirmation" != "y" ]; then
  echo "Restore canceled."
  exit 0
fi

echo "Starting restore process..."

# Restore client files
echo "Restoring client files..."
if [ -d "$BACKUP_DIR/client" ]; then
  rsync -a --delete "$BACKUP_DIR/client/" "$ROOT_DIR/client/"
else
  echo "Error: Client directory not found in backup"
  exit 1
fi

# Restore server files
echo "Restoring server files..."
if [ -d "$BACKUP_DIR/server" ]; then
  rsync -a --delete "$BACKUP_DIR/server/" "$ROOT_DIR/server/"
else
  echo "Error: Server directory not found in backup"
  exit 1
fi

# Restore shared files
echo "Restoring shared files..."
if [ -d "$BACKUP_DIR/shared" ]; then
  rsync -a --delete "$BACKUP_DIR/shared/" "$ROOT_DIR/shared/"
else
  echo "Warning: Shared directory not found in backup (might not exist)"
fi

# Restore config files
echo "Restoring configuration files..."
for config_file in package.json tsconfig.json vite.config.ts tailwind.config.ts theme.json postcss.config.js drizzle.config.ts; do
  if [ -f "$BACKUP_DIR/$config_file" ]; then
    cp "$BACKUP_DIR/$config_file" "$ROOT_DIR/"
  else
    echo "Warning: Config file $config_file not found in backup"
  fi
done

echo "Restore completed!"
echo "To apply changes, restart the application workflow."