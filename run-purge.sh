#!/bin/bash

# Script to run the salon purge SQL

echo "This script will purge all salons EXCEPT:"
echo "- Tiffany 5280 Nails Studio"
echo "- Deb Dazzles"
echo "- Jenna's Glamour Nails"
echo "- Ven Me, Baby! LTD"
echo ""
echo "ALL OTHER SALONS WILL BE PERMANENTLY DELETED!"
echo ""
read -p "Are you sure you want to continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo "Purge aborted."
  exit 1
fi

# Extract connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Extract parts from DATABASE_URL
# Expected format: postgres://username:password@hostname:port/database
DB_USER=$(echo $DATABASE_URL | sed -E 's/^postgres:\/\/([^:]+):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed -E 's/^postgres:\/\/[^:]+:([^@]+)@.*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed -E 's/^postgres:\/\/[^:]+:[^@]+@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/^postgres:\/\/[^:]+:[^@]+@[^:]+:([^\/]+)\/.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed -E 's/^postgres:\/\/[^:]+:[^@]+@[^:]+:[^\/]+\/([^?]+).*/\1/')

echo "Connecting to database $DB_NAME on $DB_HOST:$DB_PORT as $DB_USER"
echo ""

# Show salons before purge
echo "Current salons in database:"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, name FROM salons ORDER BY id;"
echo ""

# Final confirmation
read -p "TYPE 'DELETE' TO CONFIRM PURGE: " final_confirm

if [ "$final_confirm" != "DELETE" ]; then
  echo "Purge aborted."
  exit 1
fi

# Run the purge script
echo "Running purge script..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f purge-salons.sql

echo ""
echo "Purge completed. The salons that remain are:"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, name FROM salons ORDER BY id;"