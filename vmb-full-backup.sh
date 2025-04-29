#!/bin/bash

# VMB Full Backup Script with Restore Function
# Created: 2025-04-29

# Get current timestamp for backup folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="vmb_backup_${TIMESTAMP}"
TEMP_DB_DUMP="temp_db_dump.sql"

# Create backup directory
echo "📁 Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# Backup all code files
echo "📂 Backing up code files..."
cp -r * "${BACKUP_DIR}/"
# Exclude certain directories and files
rm -rf "${BACKUP_DIR}/node_modules" 2>/dev/null
rm -rf "${BACKUP_DIR}/vmb_backup_"* 2>/dev/null
find "${BACKUP_DIR}" -name "*.sql" -type f -delete 2>/dev/null
rm -rf "${BACKUP_DIR}/temp" 2>/dev/null

# Copy hidden files separately (excluding .git)
find . -maxdepth 1 -name ".*" -type f -not -path "./.git*" -exec cp {} "${BACKUP_DIR}" \; 2>/dev/null

echo "✓ Code files backed up successfully"

# Backup database using pg_dump if available or using native node export
if [ -n "$DATABASE_URL" ]; then
  echo "💾 Attempting database backup..."
  
  # Try pg_dump method first
  if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/database_backup.sql" 2>/dev/null
    
    if [ $? -eq 0 ]; then
      echo "✅ Database backup with pg_dump successful"
    else
      echo "⚠️ pg_dump failed, creating a database backup marker file"
      # Create a marker file that indicates database should be backed up
      echo "DATABASE_URL=${DATABASE_URL}" > "${BACKUP_DIR}/database_config.env"
      echo "# This file indicates that a database backup should be performed during restore" >> "${BACKUP_DIR}/database_config.env"
    fi
  else
    echo "⚠️ pg_dump not available, creating a database backup marker file"
    # Create a marker file that indicates database should be backed up
    echo "DATABASE_URL=${DATABASE_URL}" > "${BACKUP_DIR}/database_config.env"
    echo "# This file indicates that a database backup should be performed during restore" >> "${BACKUP_DIR}/database_config.env"
  fi
else
  echo "⚠️ DATABASE_URL not found, skipping database backup"
fi

# Create a backup manifest
echo "📝 Creating backup manifest..."
echo "VMB Backup" > "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Timestamp: ${TIMESTAMP}" >> "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Created on: $(date)" >> "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Files backed up: $(find ${BACKUP_DIR} -type f | wc -l)" >> "${BACKUP_DIR}/BACKUP_INFO.txt"
echo "Database backup: $(if [ -f \"${BACKUP_DIR}/database_backup.sql\" ]; then echo "Yes"; else echo "No"; fi)" >> "${BACKUP_DIR}/BACKUP_INFO.txt"

# Create restore script inside the backup
cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
#!/bin/bash

# VMB Backup Restore Script
# Automatically generated

# Get path to the backup directory
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_NAME="$(basename "$BACKUP_DIR")"

echo "🔄 Preparing to restore from backup: $BACKUP_NAME"
echo "📂 Backup location: $BACKUP_DIR"

# Check if we're in a Replit environment
if [ -d "/home/runner" ]; then
  TARGET_DIR="$(cd "${BACKUP_DIR}/.." && pwd)"
  echo "🖥️ Replit environment detected"
else
  # Ask for restore location if not in Replit
  read -p "📁 Enter restore location (default: current directory): " TARGET_DIR
  TARGET_DIR="${TARGET_DIR:-$(pwd)}"
fi

echo "🎯 Will restore to: $TARGET_DIR"
read -p "⚠️ This will overwrite existing files. Continue? (y/n): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "🛑 Restore aborted"
  exit 1
fi

# Create a temporary directory for restore
TEMP_RESTORE_DIR="$TARGET_DIR/temp_restore"
mkdir -p "$TEMP_RESTORE_DIR"

# Copy all files to temporary directory
echo "📋 Copying files to temporary location..."
cp -r "$BACKUP_DIR"/* "$TEMP_RESTORE_DIR/"
# Exclude certain files that shouldn't be copied
rm -f "$TEMP_RESTORE_DIR/restore.sh" "$TEMP_RESTORE_DIR/BACKUP_INFO.txt" "$TEMP_RESTORE_DIR/database_backup.sql" 2>/dev/null
rm -rf "$TEMP_RESTORE_DIR/node_modules" "$TEMP_RESTORE_DIR/.git" 2>/dev/null

# Copy hidden files separately (excluding .git)
find "$BACKUP_DIR" -maxdepth 1 -name ".*" -type f -not -path "*/.git*" -exec cp {} "$TEMP_RESTORE_DIR/" \; 2>/dev/null

# Stop any running server
if pgrep -f "node" > /dev/null; then
  echo "🛑 Stopping any running Node processes..."
  pkill -f "node" || true
  sleep 2
fi

# Copy files to final destination
echo "📋 Moving files to target location..."
cp -r "$TEMP_RESTORE_DIR"/* "$TARGET_DIR/"

# Copy hidden files
find "$TEMP_RESTORE_DIR" -maxdepth 1 -name ".*" -type f -not -path "*/.git*" -exec cp {} "$TARGET_DIR/" \; 2>/dev/null

# Restore database if backup exists and DATABASE_URL is set
if [ -f "$BACKUP_DIR/database_backup.sql" ] && [ -n "$DATABASE_URL" ]; then
  echo "💾 Restoring database..."
  
  # Check if database exists and drop it
  echo "🔄 Preparing database for restore..."
  psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    # Extract database name from DATABASE_URL
    DB_NAME=$(echo "$DATABASE_URL" | sed -e 's/.*\///')
    
    # Create a connection string for postgres database to allow dropping and creating DB
    PG_CONN_STRING=$(echo "$DATABASE_URL" | sed -e "s/$DB_NAME/postgres/")
    
    # Drop and recreate the database
    echo "🗑️ Dropping existing database..."
    psql "$PG_CONN_STRING" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
    echo "🆕 Creating fresh database..."
    psql "$PG_CONN_STRING" -c "CREATE DATABASE \"$DB_NAME\";"
    
    # Restore from backup
    echo "📥 Importing database backup..."
    psql "$DATABASE_URL" < "$BACKUP_DIR/database_backup.sql"
    
    if [ $? -eq 0 ]; then
      echo "✅ Database restore successful"
    else
      echo "❌ Database restore failed"
    fi
  else
    echo "❌ Could not connect to database, skipping restore"
  fi
else
  echo "⚠️ Database backup file not found or DATABASE_URL not set, skipping database restore"
fi

# Clean up temporary directory
echo "🧹 Cleaning up..."
rm -rf "$TEMP_RESTORE_DIR"

echo "✅ Restore completed!"
echo "🚀 You can now start your application"
echo "📝 Restore complete from backup: $BACKUP_NAME"
EOF

# Make the restore script executable
chmod +x "${BACKUP_DIR}/restore.sh"

echo "✅ Backup complete!"
echo "📁 Backup created in: ${BACKUP_DIR}"
echo "🔄 To restore from this backup, run: ./${BACKUP_DIR}/restore.sh"

# Create a marker file to indicate the latest backup
echo "${BACKUP_DIR}" > .vmb_latest_backup

echo "📝 Recorded '${BACKUP_DIR}' as the latest backup in .vmb_latest_backup file"