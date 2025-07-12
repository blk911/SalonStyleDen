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
