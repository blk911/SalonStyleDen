#!/bin/bash
# VMB Backup Scheduling Script
# This script helps configure and run scheduled backups for the VMB project

# Function to display usage information
show_usage() {
  echo "VMB Backup Scheduler - Usage:"
  echo "  ./schedule-backups.sh [options]"
  echo ""
  echo "Options:"
  echo "  --daily     Schedule daily backups"
  echo "  --hourly    Schedule hourly backups (for active development)"
  echo "  --weekly    Schedule weekly backups (recommended for production)"
  echo "  --cleanup   Clean up old backups (keeps last 5)"
  echo "  --status    Show current backup schedule"
  echo "  --help      Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./schedule-backups.sh --daily   # Schedule daily backups"
  echo "  ./schedule-backups.sh --cleanup # Clean up old backups"
}

# Function to schedule backups using cron
schedule_backup() {
  local frequency=$1
  local schedule=""
  
  case $frequency in
    hourly)
      schedule="0 * * * *"
      echo "Scheduling hourly backups (at minute 0 of every hour)"
      ;;
    daily)
      schedule="0 0 * * *"
      echo "Scheduling daily backups (at midnight every day)"
      ;;
    weekly)
      schedule="0 0 * * 0"
      echo "Scheduling weekly backups (at midnight every Sunday)"
      ;;
    *)
      echo "Unknown frequency. Use hourly, daily, or weekly."
      exit 1
      ;;
  esac
  
  # In Replit, we can't directly modify crontab, so we'll create a script
  # that demonstrates how to set it up and provide instructions
  
  echo "To set up $frequency backups on your system:"
  echo ""
  echo "1. Open your crontab:"
  echo "   crontab -e"
  echo ""
  echo "2. Add the following line:"
  echo "   $schedule cd $(pwd) && ./quick-backup.sh > backup.log 2>&1"
  echo ""
  echo "3. Save and exit the editor"
  echo ""
  echo "Since we're in Replit, we can't directly modify the crontab."
  echo "As an alternative, you can run backups manually with ./quick-backup.sh"
  echo "or set up a simple scheduler using a loop with sleep."
  
  # Create a simple background scheduler script as an alternative to cron
  echo "#!/bin/bash" > vmb_backup_scheduler.sh
  echo "# VMB Backup Scheduler - $frequency backups" >> vmb_backup_scheduler.sh
  echo "" >> vmb_backup_scheduler.sh
  
  case $frequency in
    hourly)
      echo "# Run hourly backups" >> vmb_backup_scheduler.sh
      echo "while true; do" >> vmb_backup_scheduler.sh
      echo "  ./quick-backup.sh" >> vmb_backup_scheduler.sh
      echo "  sleep 3600  # Sleep for 1 hour" >> vmb_backup_scheduler.sh
      echo "done" >> vmb_backup_scheduler.sh
      ;;
    daily)
      echo "# Run daily backups" >> vmb_backup_scheduler.sh
      echo "while true; do" >> vmb_backup_scheduler.sh
      echo "  ./quick-backup.sh" >> vmb_backup_scheduler.sh
      echo "  sleep 86400  # Sleep for 24 hours" >> vmb_backup_scheduler.sh
      echo "done" >> vmb_backup_scheduler.sh
      ;;
    weekly)
      echo "# Run weekly backups" >> vmb_backup_scheduler.sh
      echo "while true; do" >> vmb_backup_scheduler.sh
      echo "  ./quick-backup.sh" >> vmb_backup_scheduler.sh
      echo "  sleep 604800  # Sleep for 7 days" >> vmb_backup_scheduler.sh
      echo "done" >> vmb_backup_scheduler.sh
      ;;
  esac
  
  chmod +x vmb_backup_scheduler.sh
  echo ""
  echo "Created vmb_backup_scheduler.sh that can be run in the background:"
  echo "  nohup ./vmb_backup_scheduler.sh &"
  echo "This will run backups at $frequency intervals"
}

# Function to clean up old backups
cleanup_backups() {
  echo "=== Cleaning up old backups ==="
  
  # Count the number of backup directories
  backup_count=$(ls -d vmb_backup_* 2>/dev/null | wc -l)
  
  if [[ $backup_count -gt 5 ]]; then
    # Keep the 5 most recent backups, delete the rest
    echo "Found $backup_count backups, keeping the 5 most recent"
    ls -dt vmb_backup_* | tail -n +6 | xargs rm -rf
    echo "Cleanup complete"
  else
    echo "Found $backup_count backups (5 or fewer), no cleanup needed"
  fi
}

# Function to show current backup status
show_status() {
  echo "=== VMB Backup Status ==="
  
  # Count the number of backup directories
  backup_count=$(ls -d vmb_backup_* 2>/dev/null | wc -l)
  echo "Total backups: $backup_count"
  
  if [[ $backup_count -gt 0 ]]; then
    echo ""
    echo "Most recent backups:"
    ls -dt vmb_backup_* | head -n 3 | while read backup_dir; do
      echo "- $backup_dir ($(du -sh $backup_dir | cut -f1))"
    done
  fi
  
  echo ""
  echo "Scheduler status:"
  if [[ -f vmb_backup_scheduler.sh ]]; then
    echo "- Scheduler script found: vmb_backup_scheduler.sh"
    if pgrep -f vmb_backup_scheduler.sh > /dev/null; then
      echo "- Scheduler is running"
    else
      echo "- Scheduler is not running"
    fi
  else
    echo "- No scheduler script found"
  fi
}

# Process command line arguments
if [[ $# -eq 0 ]]; then
  show_usage
  exit 0
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --hourly)
      schedule_backup "hourly"
      shift
      ;;
    --daily)
      schedule_backup "daily"
      shift
      ;;
    --weekly)
      schedule_backup "weekly"
      shift
      ;;
    --cleanup)
      cleanup_backups
      shift
      ;;
    --status)
      show_status
      shift
      ;;
    --help)
      show_usage
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done