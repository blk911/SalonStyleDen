#!/bin/bash
# VMB Backup Scheduler
# Sets up automatic scheduled backups using cron

echo "=== VMB Backup Scheduler Setup ==="
echo "This script will set up automatic scheduled backups for your VMB application."

# Check for prerequisites
if ! command -v crontab &> /dev/null; then
  echo "ERROR: crontab command not found. Please install cron."
  exit 1
fi

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
DB_BACKUP_SCRIPT="${SCRIPT_DIR}/backup-db.sh"

# Make scripts executable
chmod +x "${BACKUP_SCRIPT}" "${DB_BACKUP_SCRIPT}"

# Prompt for backup schedule
echo "=== Backup Schedule Configuration ==="
echo "Please specify when to run each type of backup."
echo ""

# Database backup schedule
echo "== Database Backup Schedule =="
echo "Recommended: Daily"
read -p "How often should database backups run? [daily/weekly]: " db_frequency
db_frequency=${db_frequency:-daily}

read -p "At what hour (0-23)? [3]: " db_hour
db_hour=${db_hour:-3}

read -p "At what minute (0-59)? [0]: " db_minute
db_minute=${db_minute:-0}

if [[ "${db_frequency}" == "daily" ]]; then
  db_schedule="${db_minute} ${db_hour} * * *"
  echo "Database backup scheduled daily at ${db_hour}:${db_minute}"
else
  read -p "On which day of the week (0-6, 0=Sunday)? [0]: " db_day
  db_day=${db_day:-0}
  db_schedule="${db_minute} ${db_hour} * * ${db_day}"
  echo "Database backup scheduled weekly on day ${db_day} at ${db_hour}:${db_minute}"
fi

# Full backup schedule
echo ""
echo "== Full System Backup Schedule =="
echo "Recommended: Weekly"
read -p "How often should full system backups run? [weekly/monthly]: " full_frequency
full_frequency=${full_frequency:-weekly}

read -p "At what hour (0-23)? [2]: " full_hour
full_hour=${full_hour:-2}

read -p "At what minute (0-59)? [0]: " full_minute
full_minute=${full_minute:-0}

if [[ "${full_frequency}" == "weekly" ]]; then
  read -p "On which day of the week (0-6, 0=Sunday)? [6]: " full_day
  full_day=${full_day:-6}
  full_schedule="${full_minute} ${full_hour} * * ${full_day}"
  echo "Full backup scheduled weekly on day ${full_day} at ${full_hour}:${full_minute}"
else
  read -p "On which day of the month (1-28)? [1]: " full_dom
  full_dom=${full_dom:-1}
  full_schedule="${full_minute} ${full_hour} ${full_dom} * *"
  echo "Full backup scheduled monthly on day ${full_dom} at ${full_hour}:${full_minute}"
fi

# Backup rotation (cleanup)
echo ""
echo "== Backup Retention Configuration =="
read -p "How many days should we keep database backups? [30]: " db_retention
db_retention=${db_retention:-30}

read -p "How many days should we keep full system backups? [90]: " full_retention
full_retention=${full_retention:-90}

# Create cleanup script
CLEANUP_SCRIPT="${SCRIPT_DIR}/cleanup-backups.sh"
cat > "${CLEANUP_SCRIPT}" << EOF
#!/bin/bash
# VMB Backup Cleanup Script
# Removes old backups based on retention policy

# Remove old database backups
find "${SCRIPT_DIR}/vmb_db_backup" -name "vmb-db-*.sql" -type f -mtime +${db_retention} -delete
find "${SCRIPT_DIR}/vmb_db_backup" -name "vmb-db-*.sql.gz" -type f -mtime +${db_retention} -delete
find "${SCRIPT_DIR}/vmb_db_backup" -name "backup-info-*.txt" -type f -mtime +${db_retention} -delete
find "${SCRIPT_DIR}/vmb_db_backup" -name "restore-db-*.sh" -type f -mtime +${db_retention} -delete

# Remove old full backups
find "${SCRIPT_DIR}" -name "vmb_backup_*" -type d -mtime +${full_retention} -exec rm -rf {} \;

echo "Cleanup completed at \$(date)"
EOF

chmod +x "${CLEANUP_SCRIPT}"

# Schedule cleanup to run daily
cleanup_schedule="30 ${full_hour} * * *"

# Create cron entries
(crontab -l 2>/dev/null || echo "# VMB Automatic Backup Schedule") | \
grep -v "${BACKUP_SCRIPT}" | \
grep -v "${DB_BACKUP_SCRIPT}" | \
grep -v "${CLEANUP_SCRIPT}" > temp_cron

# Add new entries
cat >> temp_cron << EOF
# VMB Database Backup - ${db_frequency}
${db_schedule} ${DB_BACKUP_SCRIPT} >> ${SCRIPT_DIR}/vmb_db_backup/backup.log 2>&1

# VMB Full System Backup - ${full_frequency}
${full_schedule} ${BACKUP_SCRIPT} >> ${SCRIPT_DIR}/vmb_backup_\$(date +\%Y-\%m-\%d-\%H-\%M-\%S)/backup.log 2>&1

# VMB Backup Cleanup - daily
${cleanup_schedule} ${CLEANUP_SCRIPT} >> ${SCRIPT_DIR}/cleanup.log 2>&1
EOF

# Install new crontab
crontab temp_cron
rm temp_cron

echo ""
echo "=== Scheduled Backups Configured Successfully ==="
echo "Database backups: ${db_schedule} (${db_frequency})"
echo "Full system backups: ${full_schedule} (${full_frequency})"
echo "Backup cleanup: ${cleanup_schedule} (daily)"
echo ""
echo "Retention periods:"
echo "- Database backups: ${db_retention} days"
echo "- Full system backups: ${full_retention} days"
echo ""
echo "You can verify your cron jobs with: crontab -l"