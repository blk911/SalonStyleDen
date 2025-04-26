# VMB Backup and Restore System

This documentation provides comprehensive information about the backup and restoration system for the Ven Me, Baby! application.

## Overview

The VMB Backup System is designed to provide robust backup and restore capabilities for both development and production environments. It can capture:

- **Application code**
- **Database schema and data**
- **Environment configuration templates**
- **Restoration instructions**

## Backup Tools

The system includes several tools for different backup scenarios:

### 1. Quick Backup (`quick-backup.sh`)

A lightweight, fast backup script optimized for Replit that:
- Creates a compressed archive of essential code files
- Captures database schema information using psql (bypassing pg_dump version limitations)
- Generates restoration instructions
- Suitable for daily use during development

**Usage:**
```bash
chmod +x quick-backup.sh
./quick-backup.sh
```

### 2. Backup Scheduler (`schedule-backups.sh`)

A tool to help set up regular backup schedules:
- Offers hourly, daily, and weekly backup options
- Provides cleaning functionality for old backups
- In Replit, creates a loop-based scheduler as an alternative to cron

**Usage:**
```bash
chmod +x schedule-backups.sh
./schedule-backups.sh --daily     # Set up daily backups
./schedule-backups.sh --weekly    # Set up weekly backups
./schedule-backups.sh --cleanup   # Clean up old backups (keep last 5)
./schedule-backups.sh --status    # Show backup status
```

### 3. Backup Manager (`backup-manager.sh`)

An interactive, menu-driven management interface for all backup operations:
- Create and manage backups
- View existing backups with detailed information
- Restore from backups
- Configure backup schedules
- Clean up old backups
- Create database-only backups

**Usage:**
```bash
chmod +x backup-manager.sh
./backup-manager.sh
```

## Backup Content Details

Each backup includes:

1. **Code Archive** (`vmb-code-*.tar.gz`)
   - Contains all source code files
   - Excludes node_modules, .git, and other large directories

2. **Database Schema** (`vmb-db-*.sql`)
   - Table definitions and relationships
   - Column information
   - Foreign key constraints
   - Sample data (limited rows)

3. **Environment Template** (`env-template.txt`)
   - Template for recreating environment variables

4. **Restoration Script** (`restore.sh`)
   - Executable script to assist with restoration process

## Backup Directory Structure

Backups are organized with the timestamp in the directory name:
```
vmb_backup_YYYY-MM-DD-HH-MM-SS/
├── vmb-code-YYYY-MM-DD-HH-MM-SS.tar.gz
├── vmb-db-YYYY-MM-DD-HH-MM-SS.sql
├── env-template.txt
├── package.json.ref
├── db-recreation-guide.txt
└── restore.sh
```

## Database Backup Notes

Due to version compatibility issues in Replit (PostgreSQL v16 server with pg_dump v15), the system uses a custom approach:

1. Uses `psql` commands rather than `pg_dump` to extract schema
2. Captures table structure, relations, and constraints
3. Limits data export to 1000 rows per table to avoid memory issues
4. Provides migration-based restoration guidance

## Restoration Process

To restore from a backup:

### Automated Restoration

1. Navigate to the backup directory:
   ```bash
   cd vmb_backup_YYYY-MM-DD-HH-MM-SS
   ```

2. Run the restore script:
   ```bash
   chmod +x restore.sh
   ./restore.sh
   ```

3. Follow the interactive prompts

### Manual Restoration

1. Extract the code archive:
   ```bash
   tar -xzf vmb-code-*.tar.gz -C /path/to/destination
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env-template.txt .env
   # Edit .env with actual values
   ```

4. Restore database schema:
   ```bash
   # Option 1: Use Drizzle migrations
   npm run db:push
   
   # Option 2: Import from SQL (if full dump is available)
   psql -d your_database_name < vmb-db-*.sql
   ```

## Best Practices

1. **Regular Backups**: Schedule daily backups during active development
2. **Pre-Change Backups**: Always backup before major changes
3. **Retention Policy**: Keep at least 5 recent backups
4. **Test Restores**: Periodically test restoration to verify backup integrity

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   bash: ./script.sh: Permission denied
   ```
   **Solution**: Make scripts executable with `chmod +x script.sh`

2. **Database Connection Failed**
   ```
   Error: DATABASE_URL not found
   ```
   **Solution**: Ensure DATABASE_URL environment variable is set

3. **pg_dump Version Mismatch**
   ```
   pg_dump: server version: 16.x; pg_dump version: 15.x
   ```
   **Solution**: Use the schema-only backup approach with psql commands

4. **Restoration Path Issues**
   ```
   No such file or directory
   ```
   **Solution**: Verify paths and ensure target directories exist

## Advanced Usage

### Database-Only Backup

To back up just the database (useful after significant data changes):

```bash
./backup-manager.sh
# Select option 6: Backup database only
```

This creates database backups in the `vmb_db_backup` directory.

### Cleanup Old Backups

To remove older backups (keeps the 5 most recent):

```bash
./schedule-backups.sh --cleanup
```

## Security Considerations

1. **Environment Variables**: Backup templates include placeholders, not actual secrets
2. **Access Control**: Restrict access to backup directories in production
3. **Encryption**: Consider encrypting backups that contain sensitive information