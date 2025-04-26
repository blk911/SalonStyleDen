# VMB Backup and Restore Guide

This document provides detailed instructions for backing up and restoring the VMB (Ven Me, Baby!) application.

## Backup Overview

The backup system includes:

1. **Complete Code Snapshot** - All application source code, configurations, and assets
2. **Database Backup** - A complete PostgreSQL database dump
3. **Environment Configuration** - Template for recreating environment variables
4. **Restore Documentation** - Step-by-step restoration instructions
5. **Dependency Information** - Record of all installed packages

## Backup Procedures

### Option 1: Full System Backup (Recommended)

The full backup script creates a comprehensive backup of the entire application:

```bash
# Make the script executable
chmod +x backup.sh

# Run the backup
./backup.sh
```

This will create a timestamped directory `vmb_backup_YYYY-MM-DD-HH-MM-SS` containing all necessary files.

### Option 2: Database-Only Backup

If you only need to backup the database:

```bash
# Make the script executable
chmod +x backup-db.sh

# Run the database backup
./backup-db.sh
```

This creates a timestamped SQL dump in the `vmb_db_backup` directory.

## Restore Procedures

### Full System Restore

To restore from a full backup:

1. Navigate to the backup directory:
   ```bash
   cd vmb_backup_YYYY-MM-DD-HH-MM-SS
   ```

2. Run the restore script:
   ```bash
   ./restore.sh
   ```

3. Follow the prompts to complete the restoration.

### Database-Only Restore

To restore just the database:

1. Navigate to the database backup directory:
   ```bash
   cd vmb_db_backup
   ```

2. Run the specific restore script:
   ```bash
   ./restore-db-YYYY-MM-DD-HH-MM-SS.sh
   ```

3. Follow the prompts to enter database credentials.

## Manual Restore Process

If the scripts don't work for any reason, here's the manual process:

### 1. Code Restoration

```bash
# Extract the code archive
tar -xzf vmb-code-YYYY-MM-DD-HH-MM-SS.tar.gz -C /target/directory
cd /target/directory

# Install dependencies
npm install
```

### 2. Database Restoration

```bash
# Option 1: Use psql directly
psql -d your_database_name < vmb-db-YYYY-MM-DD-HH-MM-SS.sql

# Option 2: Use the DATABASE_URL
psql "postgresql://username:password@hostname:port/database" < vmb-db-YYYY-MM-DD-HH-MM-SS.sql
```

### 3. Environment Setup

```bash
# Create environment file from template
cp vmb-env-template.txt .env

# Edit the file with proper values
nano .env
```

## Backup Schedule Recommendations

- **Code Backup**: After significant feature additions or changes
- **Database Backup**: Daily, preferably during low-usage hours
- **Full System Backup**: Weekly

## Best Practices

1. **Multiple Locations**: Store backups in multiple physical locations
2. **Verification**: Periodically verify backups by performing a test restore
3. **Rotation**: Implement a backup rotation schedule to manage storage
4. **Security**: Ensure backup files are securely stored (they contain sensitive data)

## Troubleshooting

- **Database Restore Fails**: Check PostgreSQL version compatibility
- **Code Restore Issues**: Verify Node.js version compatibility
- **Dependency Problems**: Compare package.json with the backup reference version

For additional help, refer to the complete project documentation or contact the development team.