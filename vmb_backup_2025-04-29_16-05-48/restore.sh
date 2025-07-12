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
rsync -avh --exclude="node_modules" --exclude=".git" --exclude="restore.sh" --exclude="BACKUP_INFO.txt" --exclude="database_backup.sql" "$BACKUP_DIR/" "$TEMP_RESTORE_DIR/"

# Stop any running server
if pgrep -f "node" > /dev/null; then
  echo "🛑 Stopping any running Node processes..."
  pkill -f "node" || true
  sleep 2
fi

# Copy files to final destination
echo "📋 Moving files to target location..."
rsync -avh --exclude="node_modules" --exclude=".git" "$TEMP_RESTORE_DIR/" "$TARGET_DIR/"

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
