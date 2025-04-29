#!/bin/bash

echo "=== VMB Database Cleanup Utility ==="
echo "This script will remove ALL data from the database."
echo "Press Ctrl+C within 5 seconds to cancel..."

# 5 second countdown
for i in {5..1}; do
  echo "Continuing in $i seconds..."
  sleep 1
done

# Use the DATABASE_URL environment variable to connect to the database
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "=== Starting Database Cleanup ==="

# Use the direct environment variables (more reliable)
DB_HOST=$PGHOST
DB_PORT=$PGPORT
DB_USER=$PGUSER
DB_PASSWORD=$PGPASSWORD
DB_NAME=$PGDATABASE

# Validate we have all required parameters
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "ERROR: Missing database connection parameters."
  echo "Make sure PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE environment variables are set."
  exit 1
fi

# Show connection details (without password)
echo "Connecting to database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"

# Create SQL for backing up VMB, LTD salon info (if it exists)
BACKUP_VMB_SQL=$(cat <<EOL
-- Back up VMB, LTD salon info
CREATE TEMPORARY TABLE vmb_backup AS 
SELECT * FROM "salons" WHERE name = 'VMB, LTD';
EOL
)

# Create SQL for backing up Tiffany 5280 Nails info (if it exists)
BACKUP_TIFFANY_SQL=$(cat <<EOL
-- Back up Tiffany 5280 salon info
CREATE TEMPORARY TABLE tiffany_backup AS 
SELECT * FROM "salons" WHERE name = 'Tiffany 5280 Nails Studio';
EOL
)

# Create SQL for truncating only relationship tables (keep salon profiles)
TRUNCATE_SQL=$(cat <<EOL
-- Truncate all relationship tables
TRUNCATE TABLE "clients" CASCADE;
TRUNCATE TABLE "invitations" CASCADE;
TRUNCATE TABLE "style_selections" CASCADE;
TRUNCATE TABLE "activity_logs" CASCADE;
EOL
)

# Create SQL for deleting all salons except VMB, LTD and Tiffany 5280
DELETE_OTHER_SALONS_SQL=$(cat <<EOL
-- Delete all salons except our special ones
DELETE FROM "salons" WHERE name != 'VMB, LTD' AND name != 'Tiffany 5280 Nails Studio';
EOL
)

# Create SQL for resetting sequences
RESET_SEQUENCES_SQL=$(cat <<EOL
-- Reset all sequences
ALTER SEQUENCE clients_id_seq RESTART WITH 1;
ALTER SEQUENCE invitations_id_seq RESTART WITH 1;
ALTER SEQUENCE style_selections_id_seq RESTART WITH 1;
ALTER SEQUENCE activity_logs_id_seq RESTART WITH 1;
EOL
)

# Create SQL for adding Tiffany 5280 if it doesn't exist
CREATE_TIFFANY_SQL=$(cat <<EOL
-- Add Tiffany 5280 Nails Studio if it doesn't exist
INSERT INTO "salons" (name, owner_name, phone, email, type)
SELECT 'Tiffany 5280 Nails Studio', 'Tiffany', '555-TIFF-5280', 'tiffany@5280nails.com', 'salon'
WHERE NOT EXISTS (SELECT 1 FROM "salons" WHERE name = 'Tiffany 5280 Nails Studio');
EOL
)

# Create SQL for ensuring VMB, LTD exists
CREATE_VMB_SQL=$(cat <<EOL
-- Ensure VMB, LTD exists
INSERT INTO "salons" (name, owner_name, phone, email, type)
SELECT 'VMB, LTD', 'VMB Admin', '555-VMB-ADMN', 'admin@venmebaby.com', 'corporate'
WHERE NOT EXISTS (SELECT 1 FROM "salons" WHERE name = 'VMB, LTD');
EOL
)

# Execute SQL commands
echo "Backing up VMB and Tiffany salon data..."
echo "$BACKUP_VMB_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
echo "$BACKUP_TIFFANY_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Truncating relationship tables..."
echo "$TRUNCATE_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Deleting other salons while preserving VMB and Tiffany..."
echo "$DELETE_OTHER_SALONS_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Resetting sequences..."
echo "$RESET_SEQUENCES_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Ensuring VMB, LTD exists..."
echo "$CREATE_VMB_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Ensuring Tiffany 5280 Nails Studio exists..."
echo "$CREATE_TIFFANY_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "=== Database Cleanup Complete ==="
echo "All relationship data has been removed while preserving Tiffany 5280 and VMB, LTD profiles."
echo "Client invitations, style selections, and activity logs have been purged."
echo "Ready for fresh client interactions!"