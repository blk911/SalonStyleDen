#!/bin/bash
# VMB Backup Manager
# Interactive tool to manage backups and restores

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Function to list all backups
list_backups() {
  echo "=== VMB Backups ==="
  
  # Full backups
  print_message "${BLUE}" "Full System Backups:"
  if ls -d vmb_backup_* &>/dev/null; then
    for backup in $(ls -d vmb_backup_* | sort -r); do
      timestamp=$(echo $backup | sed 's/vmb_backup_//')
      size=$(du -sh $backup | cut -f1)
      echo "  - $backup ($size) created on ${timestamp//-/ }"
    done
  else
    print_message "${YELLOW}" "  No full system backups found."
  fi
  
  # Database backups
  print_message "${BLUE}" "Database Backups:"
  if [[ -d vmb_db_backup ]] && ls vmb_db_backup/vmb-db-* &>/dev/null; then
    for backup in $(ls vmb_db_backup/vmb-db-* | grep -v ".gz$" | sort -r); do
      timestamp=$(echo $backup | sed 's/.*vmb-db-//' | sed 's/.sql//')
      size=$(du -sh $backup | cut -f1)
      echo "  - $backup ($size) created on ${timestamp//-/ }"
    done
  else
    print_message "${YELLOW}" "  No database backups found."
  fi
  echo ""
}

# Function to create a new backup
create_backup() {
  print_message "${BLUE}" "=== Create New Backup ==="
  echo "Select backup type:"
  echo "1. Full system backup"
  echo "2. Database only"
  echo "3. Cancel"
  read -p "Enter choice [1-3]: " choice
  
  case $choice in
    1)
      print_message "${GREEN}" "Creating full system backup..."
      if [[ -f backup.sh ]]; then
        ./backup.sh
      else
        print_message "${RED}" "Error: backup.sh not found in current directory!"
      fi
      ;;
    2)
      print_message "${GREEN}" "Creating database backup..."
      if [[ -f backup-db.sh ]]; then
        ./backup-db.sh
      else
        print_message "${RED}" "Error: backup-db.sh not found in current directory!"
      fi
      ;;
    3)
      print_message "${YELLOW}" "Backup cancelled."
      ;;
    *)
      print_message "${RED}" "Invalid choice!"
      ;;
  esac
}

# Function to restore from backup
restore_backup() {
  print_message "${BLUE}" "=== Restore from Backup ==="
  echo "Select restore type:"
  echo "1. Full system restore"
  echo "2. Database only restore"
  echo "3. Cancel"
  read -p "Enter choice [1-3]: " choice
  
  case $choice in
    1)
      # List full backups for selection
      print_message "${BLUE}" "Available full system backups:"
      if ls -d vmb_backup_* &>/dev/null; then
        i=1
        for backup in $(ls -d vmb_backup_* | sort -r); do
          timestamp=$(echo $backup | sed 's/vmb_backup_//')
          size=$(du -sh $backup | cut -f1)
          echo "  $i. $backup ($size) created on ${timestamp//-/ }"
          backups[$i]=$backup
          ((i++))
        done
        
        read -p "Select backup to restore [1-$((i-1))]: " selection
        if [[ $selection -ge 1 && $selection -lt $i ]]; then
          selected=${backups[$selection]}
          print_message "${GREEN}" "Restoring from $selected..."
          if [[ -f "$selected/restore.sh" ]]; then
            cd "$selected"
            ./restore.sh
            cd ..
          else
            print_message "${RED}" "Error: Restore script not found in backup directory!"
          fi
        else
          print_message "${RED}" "Invalid selection!"
        fi
      else
        print_message "${YELLOW}" "No full system backups found."
      fi
      ;;
    2)
      # List DB backups for selection
      print_message "${BLUE}" "Available database backups:"
      if [[ -d vmb_db_backup ]] && ls vmb_db_backup/restore-db-* &>/dev/null; then
        i=1
        for script in $(ls vmb_db_backup/restore-db-* | sort -r); do
          timestamp=$(echo $script | sed 's/.*restore-db-//' | sed 's/.sh//')
          echo "  $i. $script (created on ${timestamp//-/ })"
          db_scripts[$i]=$script
          ((i++))
        done
        
        read -p "Select database backup to restore [1-$((i-1))]: " selection
        if [[ $selection -ge 1 && $selection -lt $i ]]; then
          selected=${db_scripts[$selection]}
          print_message "${GREEN}" "Restoring database from $selected..."
          $selected
        else
          print_message "${RED}" "Invalid selection!"
        fi
      else
        print_message "${YELLOW}" "No database restore scripts found."
      fi
      ;;
    3)
      print_message "${YELLOW}" "Restore cancelled."
      ;;
    *)
      print_message "${RED}" "Invalid choice!"
      ;;
  esac
}

# Function to schedule backups
setup_schedules() {
  print_message "${BLUE}" "=== Setup Backup Schedule ==="
  if [[ -f schedule-backups.sh ]]; then
    ./schedule-backups.sh
  else
    print_message "${RED}" "Error: schedule-backups.sh not found in current directory!"
  fi
}

# Function to display backup information
show_backup_info() {
  print_message "${BLUE}" "=== Backup System Information ==="
  
  # Check for backup scripts
  echo "Backup Scripts:"
  [[ -f backup.sh ]] && print_message "${GREEN}" "  ✓ Full backup script (backup.sh)" || print_message "${RED}" "  ✗ Full backup script (backup.sh)"
  [[ -f backup-db.sh ]] && print_message "${GREEN}" "  ✓ Database backup script (backup-db.sh)" || print_message "${RED}" "  ✗ Database backup script (backup-db.sh)"
  [[ -f schedule-backups.sh ]] && print_message "${GREEN}" "  ✓ Schedule script (schedule-backups.sh)" || print_message "${RED}" "  ✗ Schedule script (schedule-backups.sh)"
  
  # Check backup directories
  echo "Backup Directories:"
  if ls -d vmb_backup_* &>/dev/null; then
    count=$(ls -d vmb_backup_* | wc -l)
    latest=$(ls -d vmb_backup_* | sort -r | head -1)
    size=$(du -sh vmb_backup_* | awk '{total += $1} END {print total}')
    print_message "${GREEN}" "  ✓ Full backups: $count found, latest: $latest"
  else
    print_message "${YELLOW}" "  ✗ No full backups found"
  fi
  
  if [[ -d vmb_db_backup ]]; then
    if ls vmb_db_backup/vmb-db-* &>/dev/null; then
      count=$(ls vmb_db_backup/vmb-db-* | grep -v ".gz$" | wc -l)
      latest=$(ls vmb_db_backup/vmb-db-* | grep -v ".gz$" | sort -r | head -1)
      size=$(du -sh vmb_db_backup | cut -f1)
      print_message "${GREEN}" "  ✓ Database backups: $count found, latest: $latest, total size: $size"
    else
      print_message "${YELLOW}" "  ✗ No database backup files found"
    fi
  else
    print_message "${YELLOW}" "  ✗ Database backup directory not found"
  fi
  
  # Check scheduled jobs
  echo "Scheduled Backups:"
  if command -v crontab &>/dev/null; then
    if crontab -l 2>/dev/null | grep -q "VMB"; then
      print_message "${GREEN}" "  ✓ Backup schedule configured:"
      crontab -l | grep "VMB" | while read -r line; do
        [[ $line != \#* ]] && echo "     $line"
      done
    else
      print_message "${YELLOW}" "  ✗ No scheduled backups found"
    fi
  else
    print_message "${RED}" "  ✗ Cannot check scheduled backups (crontab not available)"
  fi
  
  echo ""
}

# Main function
main() {
  clear
  print_message "${GREEN}" "===================================="
  print_message "${GREEN}" "     VMB Backup Manager v1.0        "
  print_message "${GREEN}" "===================================="
  echo ""
  
  while true; do
    echo "Choose an option:"
    echo "1. List all backups"
    echo "2. Create new backup"
    echo "3. Restore from backup"
    echo "4. Schedule automatic backups"
    echo "5. Show backup system info"
    echo "6. Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice
    echo ""
    
    case $choice in
      1) list_backups ;;
      2) create_backup ;;
      3) restore_backup ;;
      4) setup_schedules ;;
      5) show_backup_info ;;
      6) 
        print_message "${GREEN}" "Exiting VMB Backup Manager"
        exit 0
        ;;
      *)
        print_message "${RED}" "Invalid choice!"
        ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
    print_message "${GREEN}" "===================================="
    print_message "${GREEN}" "     VMB Backup Manager v1.0        "
    print_message "${GREEN}" "===================================="
    echo ""
  done
}

# Run the main function
main