#!/bin/bash
# VMB Database Backup Script
# Dedicated script for backing up just the PostgreSQL database

# Set timestamp for backup files
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
BACKUP_DIR="./vmb_db_backup"
DB_BACKUP="vmb-db-${TIMESTAMP}.sql"

echo "=== Starting VMB Database Backup: ${TIMESTAMP} ==="
mkdir -p "${BACKUP_DIR}"

# Check if database credentials are available
if [[ -n "${DATABASE_URL}" ]]; then
  echo "Using DATABASE_URL for backup"
  pg_dump "${DATABASE_URL}" > "${BACKUP_DIR}/${DB_BACKUP}"
  BACKUP_RESULT=$?
elif [[ -n "${PGUSER}" && -n "${PGPASSWORD}" && -n "${PGDATABASE}" ]]; then
  echo "Using individual PostgreSQL environment variables"
  PGUSER="${PGUSER}" PGPASSWORD="${PGPASSWORD}" PGDATABASE="${PGDATABASE}" \
  PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" \
  pg_dump > "${BACKUP_DIR}/${DB_BACKUP}"
  BACKUP_RESULT=$?
else
  echo "ERROR: Database credentials not found in environment!"
  echo "Please ensure DATABASE_URL or PGUSER, PGPASSWORD, etc. are set."
  exit 1
fi

# Check backup result
if [[ ${BACKUP_RESULT} -eq 0 ]]; then
  echo "Database backup completed successfully"
  echo "Backup saved to: ${BACKUP_DIR}/${DB_BACKUP}"
  
  # Create a compressed version
  echo "Creating compressed backup"
  gzip -c "${BACKUP_DIR}/${DB_BACKUP}" > "${BACKUP_DIR}/${DB_BACKUP}.gz"
  
  # Create metadata file with info about the backup
  echo "Creating backup metadata"
  cat > "${BACKUP_DIR}/backup-info-${TIMESTAMP}.txt" << EOF
VMB Database Backup
============================
Date: $(date)
Backup File: ${DB_BACKUP}
Compressed: ${DB_BACKUP}.gz
Database: ${PGDATABASE:-"Unknown"}
Size: $(du -h "${BACKUP_DIR}/${DB_BACKUP}" | cut -f1)
Compressed Size: $(du -h "${BACKUP_DIR}/${DB_BACKUP}.gz" | cut -f1)
============================
EOF

  # List tables for reference
  if [[ -n "${DATABASE_URL}" ]]; then
    echo "Generating schema information for reference..."
    psql "${DATABASE_URL}" -c "\dt" >> "${BACKUP_DIR}/backup-info-${TIMESTAMP}.txt"
  fi
  
  # Create restore script specifically for this backup
  cat > "${BACKUP_DIR}/restore-db-${TIMESTAMP}.sh" << EOF
#!/bin/bash
# VMB Database Restore Script for backup from ${TIMESTAMP}

echo "=== Starting VMB Database Restoration: $(date +"%Y-%m-%d-%H-%M-%S") ==="
echo "Will restore from backup: ${DB_BACKUP}"

# Get database credentials
read -p "Enter database name: " DB_NAME
read -p "Enter database user: " DB_USER
read -s -p "Enter database password: " DB_PASS
echo ""
read -p "Enter database host [localhost]: " DB_HOST
DB_HOST=\${DB_HOST:-localhost}
read -p "Enter database port [5432]: " DB_PORT
DB_PORT=\${DB_PORT:-5432}

# Restore database
echo "Restoring database..."
PGPASSWORD="\${DB_PASS}" psql -h "\${DB_HOST}" -p "\${DB_PORT}" -U "\${DB_USER}" -d "\${DB_NAME}" -f "${DB_BACKUP}"

if [[ \$? -eq 0 ]]; then
  echo "Database restoration completed successfully!"
else
  echo "ERROR: Database restoration failed!"
  exit 1
fi

echo "=== Restoration Complete ==="
EOF
  
  chmod +x "${BACKUP_DIR}/restore-db-${TIMESTAMP}.sh"
  
  echo "=== Database Backup Complete ==="
  echo "A restore script has been created: ${BACKUP_DIR}/restore-db-${TIMESTAMP}.sh"
else
  echo "ERROR: Database backup failed with code ${BACKUP_RESULT}"
  exit 1
fi