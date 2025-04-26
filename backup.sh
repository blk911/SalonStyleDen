#!/bin/bash
# VMB Project Backup Script
# This script creates a comprehensive backup of the VMB codebase
# including database, configuration, and documentation for restoration.

# Set timestamp for backup files
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
BACKUP_DIR="./vmb_backup_${TIMESTAMP}"
CODE_ARCHIVE="vmb-code-${TIMESTAMP}.tar.gz"
DB_BACKUP="vmb-db-${TIMESTAMP}.sql"
CONFIG_TEMPLATE="vmb-env-template.txt"
README="README.restore.md"

echo "=== Starting VMB Backup Process: ${TIMESTAMP} ==="
echo "Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# 1. Git Status Check
echo "=== Checking Git Status ==="
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Git repository detected"
  
  # Check for uncommitted changes
  if [[ -n $(git status --porcelain) ]]; then
    echo "WARNING: You have uncommitted changes. Committing all changes before backup."
    git add .
    git commit -m "Auto-commit before backup ${TIMESTAMP}"
  else
    echo "Git repository is clean. No uncommitted changes."
  fi
  
  # Create a backup tag
  echo "Creating git tag: backup-${TIMESTAMP}"
  git tag "backup-${TIMESTAMP}"
  
  # Optional: Create a stable-backup branch
  echo "Creating/updating stable-backup branch"
  git branch -f stable-backup
  git show-ref --verify --quiet refs/heads/stable-backup && git checkout stable-backup
else
  echo "WARNING: Not in a git repository. Initializing one for backup purposes."
  git init
  git add .
  git commit -m "Initial commit for backup ${TIMESTAMP}"
  git tag "backup-${TIMESTAMP}"
  git branch -f stable-backup
fi

# 2. Create Code Archive
echo "=== Creating Code Archive ==="
echo "Archiving code to ${BACKUP_DIR}/${CODE_ARCHIVE}"
tar --exclude="node_modules" \
    --exclude=".git" \
    --exclude="dist" \
    --exclude="build" \
    --exclude="vmb_backup_*" \
    -czf "${BACKUP_DIR}/${CODE_ARCHIVE}" .

# 3. Database Backup
echo "=== Creating Database Backup ==="
if [[ -n "${DATABASE_URL}" ]]; then
  echo "Backing up database to ${BACKUP_DIR}/${DB_BACKUP}"
  pg_dump "${DATABASE_URL}" > "${BACKUP_DIR}/${DB_BACKUP}"
  
  if [[ $? -eq 0 ]]; then
    echo "Database backup completed successfully"
  else
    echo "WARNING: Database backup failed!"
  fi
else
  echo "WARNING: DATABASE_URL not found. Skipping database backup."
  echo "You'll need to manually backup the database."
fi

# 4. Environment Configuration Template
echo "=== Creating Environment Template ==="
echo "# VMB Environment Variables" > "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "# Generated on: $(date)" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "# Database Configuration" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "DATABASE_URL=postgresql://username:password@hostname:port/database" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "PGUSER=username" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "PGPASSWORD=password" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "PGDATABASE=database" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "PGHOST=hostname" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "PGPORT=5432" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "# Application Settings" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "SESSION_SECRET=your_session_secret" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"
echo "# Add any other environment variables your application needs" >> "${BACKUP_DIR}/${CONFIG_TEMPLATE}"

# 5. Restoration Instructions
echo "=== Creating Restoration Documentation ==="
cat > "${BACKUP_DIR}/${README}" << 'EOF'
# VMB Restoration Guide

This document provides step-by-step instructions to restore the VMB application from backup.

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Git
- npm

## Restoration Steps

### 1. Extract the Code Archive

```bash
tar -xzf vmb-code-*.tar.gz -C /your/target/directory
cd /your/target/directory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root directory using the provided template:

```bash
cp vmb-env-template.txt .env
```

Edit the `.env` file and fill in the actual values for your environment.

### 4. Restore Database

Option 1: Restore from SQL backup:

```bash
psql -d your_database_name < vmb-db-*.sql
```

Option 2: Create fresh database and run migrations:

```bash
npm run db:push
```

### 5. Start the Application

```bash
npm run dev
```

## Troubleshooting

If you encounter any issues during restoration:

1. Check the environment variables in your `.env` file
2. Ensure PostgreSQL is running and accessible
3. Verify that all dependencies were installed correctly

For more help, refer to the project documentation.
EOF

# 6. Create a package.json backup
echo "=== Copying package.json for Reference ==="
cp package.json "${BACKUP_DIR}/package.json.ref"

# 7. List all installed npm packages for reference
echo "=== Creating Dependency List ==="
npm list --depth=0 > "${BACKUP_DIR}/dependencies.txt"

# 8. Create a .gitignore for the backup directory
echo "=== Setting Up Backup .gitignore ==="
echo "node_modules/" > "${BACKUP_DIR}/.gitignore"
echo "*.env" >> "${BACKUP_DIR}/.gitignore"

# 9. Create a restore script
echo "=== Creating Restore Script ==="
cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
#!/bin/bash
# VMB Project Restore Script

echo "=== Starting VMB Restoration Process ==="

# 1. Check for code archive
CODE_ARCHIVE=$(ls vmb-code-*.tar.gz 2>/dev/null | head -1)
if [[ -z "${CODE_ARCHIVE}" ]]; then
  echo "ERROR: No code archive found! Expected vmb-code-*.tar.gz"
  exit 1
fi

# 2. Extract code archive
echo "=== Extracting Code Archive ==="
tar -xzf "${CODE_ARCHIVE}" -C ../

# 3. Switch to project directory
cd ../

# 4. Install dependencies
echo "=== Installing Dependencies ==="
npm install

# 5. Prompt for database restoration
echo "=== Database Restoration ==="
DB_BACKUP=$(ls vmb-db-*.sql 2>/dev/null | head -1)
if [[ -n "${DB_BACKUP}" ]]; then
  read -p "Do you want to restore the database from backup? (y/n): " restore_db
  if [[ "${restore_db}" == "y" ]]; then
    read -p "Enter your database name: " db_name
    echo "Restoring database from ${DB_BACKUP}..."
    psql -d "${db_name}" < "${DB_BACKUP}"
    if [[ $? -eq 0 ]]; then
      echo "Database restoration completed successfully"
    else
      echo "WARNING: Database restoration failed!"
    fi
  else
    echo "Skipping database restoration."
  fi
else
  echo "No database backup found. Skipping database restoration."
fi

# 6. Environment setup
echo "=== Environment Setup ==="
ENV_TEMPLATE=$(ls vmb-env-template.txt 2>/dev/null | head -1)
if [[ -n "${ENV_TEMPLATE}" ]]; then
  echo "Environment template found. Creating .env file..."
  cp "${ENV_TEMPLATE}" ../.env
  echo "Please edit the .env file with your actual values."
else
  echo "WARNING: No environment template found. You'll need to create your own .env file."
fi

echo "=== Restoration Complete ==="
echo "You can now start the application with: npm run dev"
EOF

chmod +x "${BACKUP_DIR}/restore.sh"

# 10. Finalize
echo "=== Backup Complete ==="
echo "Backup created at: ${BACKUP_DIR}"
echo "To restore from this backup, use the restore.sh script in the backup directory."
echo ""
echo "Backup contents:"
ls -la "${BACKUP_DIR}"