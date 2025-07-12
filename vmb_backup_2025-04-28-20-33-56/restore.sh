#!/bin/bash
# VMB Restore Script

echo "Restoring VMB project from backup..."
cp -r client server shared ..
cp package.json package-lock.json tsconfig.json ..
cp drizzle.config.ts tailwind.config.ts vite.config.ts postcss.config.js ..

echo "Restore complete."

if [ -f "database_backup.sql" ] && [ -n "$DATABASE_URL" ]; then
  echo "Would you like to restore the database? (y/n)"
  read answer
  if [ "$answer" = "y" ]; then
    echo "Restoring database..."
    psql "$DATABASE_URL" < database_backup.sql
    echo "Database restored."
  fi
fi
