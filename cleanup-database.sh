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

# Create SQL for truncating all tables
TRUNCATE_SQL=$(cat <<EOL
-- Truncate all tables in the database
TRUNCATE TABLE "clients" CASCADE;
TRUNCATE TABLE "salons" CASCADE; 
TRUNCATE TABLE "invitations" CASCADE;
TRUNCATE TABLE "style_selections" CASCADE;
TRUNCATE TABLE "activity_logs" CASCADE;
TRUNCATE TABLE "users" CASCADE;
EOL
)

# Create SQL for resetting sequences
RESET_SEQUENCES_SQL=$(cat <<EOL
-- Reset all sequences
ALTER SEQUENCE clients_id_seq RESTART WITH 1;
ALTER SEQUENCE salons_id_seq RESTART WITH 1;
ALTER SEQUENCE invitations_id_seq RESTART WITH 1;
ALTER SEQUENCE style_selections_id_seq RESTART WITH 1;
ALTER SEQUENCE activity_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
EOL
)

# Create SQL for inserting the default VMB, LTD salon
INSERT_DEFAULT_SALON_SQL=$(cat <<EOL
-- Insert VMB, LTD as the default salon
INSERT INTO "salons" (
  "name", 
  "owner_name", 
  "phone", 
  "email", 
  "address", 
  "city", 
  "state", 
  "zip_code", 
  "type", 
  "license_verified"
)
VALUES (
  'VMB, LTD', 
  'VMB Admin', 
  '555-VMB-ADMN', 
  'admin@venmebaby.com', 
  '1 VMB Plaza', 
  'Los Angeles', 
  'CA', 
  '90210', 
  'corporate', 
  true
)
RETURNING id;
EOL
)

# Execute SQL commands
echo "Truncating tables..."
echo "$TRUNCATE_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Resetting sequences..."
echo "$RESET_SEQUENCES_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Adding default VMB, LTD salon..."
echo "$INSERT_DEFAULT_SALON_SQL" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "=== Database Cleanup Complete ==="
echo "All tables have been truncated and sequences reset."
echo "A default VMB, LTD salon has been added with ID 1."