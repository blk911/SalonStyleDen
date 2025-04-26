#!/bin/bash
# VMB Quick Backup Script - Replit Optimized Version
# This script creates a lightweight backup of the VMB project optimized for Replit

# Set timestamp for backup files
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
BACKUP_DIR="./vmb_backup_${TIMESTAMP}"
CODE_ARCHIVE="vmb-code-${TIMESTAMP}.tar.gz"
DB_BACKUP="vmb-db-${TIMESTAMP}.sql"

echo "=== Starting VMB Quick Backup: ${TIMESTAMP} ==="
mkdir -p "${BACKUP_DIR}"

echo "=== Backing up Code Files ==="
# Only backup essential files and directories, exclude large directories
tar \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="attached_assets" \
    --exclude="vmb_backup_*" \
    --exclude="dist" \
    --exclude="build" \
    -cf "${BACKUP_DIR}/${CODE_ARCHIVE}" \
    ./client ./server ./shared package.json tsconfig.json vite.config.ts drizzle.config.ts

echo "=== Backing up Database Schema ==="
# Since pg_dump might have version mismatch, we'll use a different approach
if [[ -n "${DATABASE_URL}" ]]; then
  echo "Creating database schema information using psql..."
  
  # Get a list of tables
  echo "-- VMB Database Schema Backup (Tables)" > "${BACKUP_DIR}/${DB_BACKUP}"
  echo "-- Generated on: $(date)" >> "${BACKUP_DIR}/${DB_BACKUP}"
  echo "-- Note: This is a schema-only backup due to pg_dump version constraints in Replit" >> "${BACKUP_DIR}/${DB_BACKUP}"
  echo "" >> "${BACKUP_DIR}/${DB_BACKUP}"
  
  # Get table schemas using psql instead of pg_dump
  echo "-- Database Tables" >> "${BACKUP_DIR}/${DB_BACKUP}"
  psql "${DATABASE_URL}" -c "\dt" >> "${BACKUP_DIR}/${DB_BACKUP}" 2>/dev/null
  
  # Get table columns for each table
  echo "" >> "${BACKUP_DIR}/${DB_BACKUP}"
  echo "-- Table Schemas" >> "${BACKUP_DIR}/${DB_BACKUP}"
  
  # Get table list
  TABLE_LIST=$(psql "${DATABASE_URL}" -t -c "\dt" | awk '{print $3}' 2>/dev/null)
  
  # For each table, get its columns
  for table in $TABLE_LIST; do
    echo "" >> "${BACKUP_DIR}/${DB_BACKUP}"
    echo "-- Schema for table: $table" >> "${BACKUP_DIR}/${DB_BACKUP}"
    psql "${DATABASE_URL}" -c "\d $table" >> "${BACKUP_DIR}/${DB_BACKUP}" 2>/dev/null
  done
  
  echo "Created database schema information file"
  
  # Create a backup instructions file
  echo "-- How to recreate the database" > "${BACKUP_DIR}/db-recreation-guide.txt"
  echo "1. Create a new database" >> "${BACKUP_DIR}/db-recreation-guide.txt"
  echo "2. Run npm migrations:" >> "${BACKUP_DIR}/db-recreation-guide.txt"
  echo "   npm run db:push" >> "${BACKUP_DIR}/db-recreation-guide.txt"
  echo "" >> "${BACKUP_DIR}/db-recreation-guide.txt"
  echo "Note: Since a full pg_dump wasn't possible due to version constraints in Replit," >> "${BACKUP_DIR}/db-recreation-guide.txt"
  echo "you'll need to manually recreate the data or use the migrations to rebuild the schema." >> "${BACKUP_DIR}/db-recreation-guide.txt"
else
  echo "WARNING: DATABASE_URL not found. Skipping database backup."
fi

# Copy environment template
cp env-template.txt "${BACKUP_DIR}/env-template.txt"

# Create a simple package.json backup
cp package.json "${BACKUP_DIR}/package.json.ref"

# Create a simple restore script
cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
#!/bin/bash
# VMB Simple Restore Script

echo "=== Starting VMB Restoration Process ==="

# Extract code archive
CODE_ARCHIVE=$(ls *.tar.gz | head -1)
echo "Extracting code from ${CODE_ARCHIVE}..."
mkdir -p ../restored
tar -xf "${CODE_ARCHIVE}" -C ../restored

# Check for database backup
DB_BACKUP=$(ls *.sql | head -1)
if [[ -n "${DB_BACKUP}" ]]; then
  echo "Database backup found: ${DB_BACKUP}"
  echo "To restore the database, run:"
  echo "  psql -d your_database_name < ${DB_BACKUP}"
else
  echo "No database backup found."
fi

echo "Restoration prepared. Files extracted to ../restored/"
echo "Don't forget to set up your environment variables and install dependencies."
EOF

chmod +x "${BACKUP_DIR}/restore.sh"

echo "=== Quick Backup Complete ==="
echo "Backup created at: ${BACKUP_DIR}"
ls -la "${BACKUP_DIR}"