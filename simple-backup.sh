#!/bin/bash

# Simple VMB Backup Script
# Created: 2025-04-29

# Get current timestamp for backup folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="vmb_backup_${TIMESTAMP}"

echo "Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# Create folders to match the project structure
mkdir -p "${BACKUP_DIR}/client"
mkdir -p "${BACKUP_DIR}/server"
mkdir -p "${BACKUP_DIR}/shared"
mkdir -p "${BACKUP_DIR}/scripts"

# Copy key directories
echo "Copying client files..."
cp -r client/* "${BACKUP_DIR}/client/" 2>/dev/null

echo "Copying server files..."
cp -r server/* "${BACKUP_DIR}/server/" 2>/dev/null

echo "Copying shared files..."
cp -r shared/* "${BACKUP_DIR}/shared/" 2>/dev/null

echo "Copying scripts..."
cp -r scripts/* "${BACKUP_DIR}/scripts/" 2>/dev/null

# Copy root configuration files
echo "Copying configuration files..."
cp package.json "${BACKUP_DIR}/" 2>/dev/null
cp tsconfig.json "${BACKUP_DIR}/" 2>/dev/null
cp vite.config.ts "${BACKUP_DIR}/" 2>/dev/null
cp tailwind.config.ts "${BACKUP_DIR}/" 2>/dev/null
cp postcss.config.js "${BACKUP_DIR}/" 2>/dev/null
cp drizzle.config.ts "${BACKUP_DIR}/" 2>/dev/null
cp .env "${BACKUP_DIR}/" 2>/dev/null
cp theme.json "${BACKUP_DIR}/" 2>/dev/null

# Create a restore script
cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
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
EOF

# Make the restore script executable
chmod +x "${BACKUP_DIR}/restore.sh"

# Create a manifest file
echo "VMB Backup" > "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Timestamp: ${TIMESTAMP}" >> "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Created on: $(date)" >> "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Backup directory: ${BACKUP_DIR}" >> "${BACKUP_DIR}/BACKUP_INFO.txt"

echo "Backup completed successfully!"
echo "Backup created in: ${BACKUP_DIR}"
echo "To restore from this backup, run: ./${BACKUP_DIR}/restore.sh"

# Create a marker file to indicate the latest backup
echo "${BACKUP_DIR}" > .vmb_latest_backup