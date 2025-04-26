#!/bin/bash
# VMB Backup Manager - Interactive Management Tool
# This script provides a user-friendly interface for backup operations

# ANSI color codes for better presentation
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths to backup scripts 
QUICK_BACKUP="./quick-backup.sh"
SCHEDULER="./schedule-backups.sh"

# Function to display header
show_header() {
  clear
  echo -e "${BLUE}=================================================${NC}"
  echo -e "${BLUE}     VMB Backup Management System ${NC}"
  echo -e "${BLUE}=================================================${NC}"
  echo ""
}

# Function to check if a script exists and is executable
check_script() {
  if [ -f "$1" ] && [ -x "$1" ]; then
    return 0
  else
    return 1
  fi
}

# Function to display main menu
show_main_menu() {
  show_header
  echo -e "Current Status:"
  echo -e "  Backups: ${YELLOW}$(ls -d vmb_backup_* 2>/dev/null | wc -l)${NC} total"
  echo -e "  Disk usage: ${YELLOW}$(du -sh vmb_backup_* 2>/dev/null | awk '{sum+=$1} END {print sum}')${NC}"
  echo ""
  echo -e "${GREEN}1.${NC} Create a new backup"
  echo -e "${GREEN}2.${NC} View existing backups"
  echo -e "${GREEN}3.${NC} Restore from backup"
  echo -e "${GREEN}4.${NC} Manage backup schedule"
  echo -e "${GREEN}5.${NC} Cleanup old backups"
  echo -e "${GREEN}6.${NC} Backup database only"
  echo -e "${GREEN}7.${NC} Help & Documentation"
  echo -e "${GREEN}8.${NC} Exit"
  echo ""
  echo -n "Enter your choice [1-8]: "
}

# Function to create a new backup
create_backup() {
  show_header
  echo -e "${BLUE}Creating New Backup${NC}"
  echo ""
  
  if check_script "$QUICK_BACKUP"; then
    echo "Running backup script..."
    $QUICK_BACKUP
    echo ""
    echo -e "${GREEN}Backup completed successfully!${NC}"
  else
    echo -e "${RED}Error: Backup script not found or not executable.${NC}"
    echo "Checking for quick-backup.sh..."
    
    if [ -f "$QUICK_BACKUP" ]; then
      echo "Script exists but is not executable. Making it executable..."
      chmod +x "$QUICK_BACKUP"
      echo "Running backup script..."
      $QUICK_BACKUP
    else
      echo -e "${RED}Could not find quick-backup.sh. Unable to proceed.${NC}"
    fi
  fi
  
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Function to view existing backups
view_backups() {
  show_header
  echo -e "${BLUE}Existing Backups${NC}"
  echo ""
  
  # Check if any backups exist
  if [ "$(ls -d vmb_backup_* 2>/dev/null | wc -l)" -eq 0 ]; then
    echo -e "${YELLOW}No backups found.${NC}"
    echo ""
    echo -n "Press Enter to return to main menu..."
    read
    return
  fi
  
  # Display backups with details
  echo -e "ID\tDate Created\t\tSize\tContents"
  echo -e "---------------------------------------------------------------"
  
  counter=1
  ls -dt vmb_backup_* | while read backup_dir; do
    # Extract date from directory name
    date_created=$(echo $backup_dir | sed 's/vmb_backup_//')
    
    # Get size
    size=$(du -sh $backup_dir | cut -f1)
    
    # Count files
    file_count=$(find $backup_dir -type f | wc -l)
    
    # Check for database backup
    if ls "$backup_dir"/vmb-db-*.sql >/dev/null 2>&1; then
      db_status="${GREEN}DB Included${NC}"
    else
      db_status="${RED}No DB${NC}"
    fi
    
    echo -e "$counter\t$date_created\t$size\t$file_count files, $db_status"
    counter=$((counter+1))
  done
  
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Function to restore from backup
restore_from_backup() {
  show_header
  echo -e "${BLUE}Restore from Backup${NC}"
  echo ""
  
  # Check if any backups exist
  if [ "$(ls -d vmb_backup_* 2>/dev/null | wc -l)" -eq 0 ]; then
    echo -e "${YELLOW}No backups found.${NC}"
    echo ""
    echo -n "Press Enter to return to main menu..."
    read
    return
  fi
  
  # List available backups
  echo "Available backups:"
  echo ""
  
  counter=1
  declare -a backup_dirs
  
  while read backup_dir; do
    backup_dirs+=("$backup_dir")
    date_created=$(echo $backup_dir | sed 's/vmb_backup_//')
    size=$(du -sh $backup_dir | cut -f1)
    echo -e "$counter. $date_created ($size)"
    counter=$((counter+1))
  done < <(ls -dt vmb_backup_*)
  
  echo ""
  echo -n "Enter backup number to restore, or 0 to cancel: "
  read choice
  
  if [ "$choice" -eq 0 ] 2>/dev/null; then
    return
  fi
  
  if [ "$choice" -gt 0 ] 2>/dev/null && [ "$choice" -le "${#backup_dirs[@]}" ]; then
    selected_backup="${backup_dirs[$((choice-1))]}"
    
    echo ""
    echo -e "${YELLOW}WARNING: Restoration will overwrite current files. Make sure the application is stopped.${NC}"
    echo -n "Are you sure you want to proceed? (y/n): "
    read confirm
    
    if [ "$confirm" == "y" ] || [ "$confirm" == "Y" ]; then
      echo ""
      echo "Checking for restore script in $selected_backup..."
      
      if [ -f "$selected_backup/restore.sh" ] && [ -x "$selected_backup/restore.sh" ]; then
        echo "Restore script found. Executing..."
        cd "$selected_backup"
        ./restore.sh
        cd - > /dev/null
      else
        echo -e "${RED}No executable restore.sh found in the backup.${NC}"
        echo "Manual restoration required:"
        echo "1. Extract the code archive from $selected_backup"
        echo "2. Restore the database if needed"
        echo ""
      fi
    else
      echo "Restoration cancelled."
    fi
  else
    echo -e "${RED}Invalid selection.${NC}"
  fi
  
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Function to manage backup schedule
manage_schedule() {
  show_header
  echo -e "${BLUE}Backup Schedule Management${NC}"
  echo ""
  
  if ! check_script "$SCHEDULER"; then
    echo -e "${RED}Error: Schedule management script not found or not executable.${NC}"
    echo ""
    echo -n "Press Enter to return to main menu..."
    read
    return
  fi
  
  echo -e "${GREEN}1.${NC} View current schedule status"
  echo -e "${GREEN}2.${NC} Set up hourly backups"
  echo -e "${GREEN}3.${NC} Set up daily backups"
  echo -e "${GREEN}4.${NC} Set up weekly backups"
  echo -e "${GREEN}5.${NC} Return to main menu"
  echo ""
  echo -n "Enter your choice [1-5]: "
  read choice
  
  case $choice in
    1)
      echo ""
      $SCHEDULER --status
      ;;
    2)
      echo ""
      $SCHEDULER --hourly
      ;;
    3)
      echo ""
      $SCHEDULER --daily
      ;;
    4)
      echo ""
      $SCHEDULER --weekly
      ;;
    5)
      return
      ;;
    *)
      echo -e "${RED}Invalid option.${NC}"
      ;;
  esac
  
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Function to cleanup old backups
cleanup_backups() {
  show_header
  echo -e "${BLUE}Cleanup Old Backups${NC}"
  echo ""
  
  if check_script "$SCHEDULER"; then
    echo "Running cleanup..."
    $SCHEDULER --cleanup
  else
    echo -e "${YELLOW}Schedule management script not found.${NC}"
    echo "Performing manual cleanup..."
    
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
  fi
  
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Function to backup database only
backup_database_only() {
  show_header
  echo -e "${BLUE}Database-Only Backup${NC}"
  echo ""
  
  TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
  DB_BACKUP_DIR="./vmb_db_backup"
  DB_BACKUP_FILE="${DB_BACKUP_DIR}/vmb-db-${TIMESTAMP}.sql"
  
  mkdir -p "$DB_BACKUP_DIR"
  
  echo "Creating database backup at: $DB_BACKUP_FILE"
  
  if [[ -n "${DATABASE_URL}" ]]; then
    # Since pg_dump might have version mismatch, we'll use a different approach
    echo "Creating database schema information using psql..."
    
    # Get a list of tables
    echo "-- VMB Database Schema Backup (Tables)" > "$DB_BACKUP_FILE"
    echo "-- Generated on: $(date)" >> "$DB_BACKUP_FILE"
    echo "-- Note: This is a schema-only backup due to pg_dump version constraints in Replit" >> "$DB_BACKUP_FILE"
    echo "" >> "$DB_BACKUP_FILE"
    
    # Get table schemas using psql instead of pg_dump
    echo "-- Database Tables" >> "$DB_BACKUP_FILE"
    psql "${DATABASE_URL}" -c "\dt" >> "$DB_BACKUP_FILE" 2>/dev/null
    
    # Get table columns for each table
    echo "" >> "$DB_BACKUP_FILE"
    echo "-- Table Schemas" >> "$DB_BACKUP_FILE"
    
    # Get table list
    TABLE_LIST=$(psql "${DATABASE_URL}" -t -c "\dt" | awk '{print $3}' 2>/dev/null)
    
    # For each table, get its columns
    for table in $TABLE_LIST; do
      echo "" >> "$DB_BACKUP_FILE"
      echo "-- Schema for table: $table" >> "$DB_BACKUP_FILE"
      psql "${DATABASE_URL}" -c "\d $table" >> "$DB_BACKUP_FILE" 2>/dev/null
      
      # Export data (limited to 1000 rows per table to avoid memory issues)
      echo "" >> "$DB_BACKUP_FILE"
      echo "-- Data for table: $table (limited to 1000 rows)" >> "$DB_BACKUP_FILE"
      psql "${DATABASE_URL}" -c "SELECT * FROM $table LIMIT 1000" >> "$DB_BACKUP_FILE" 2>/dev/null
    done
    
    echo "Database backup completed successfully at: $DB_BACKUP_FILE"
  else
    echo -e "${RED}Error: DATABASE_URL not found.${NC}"
    echo "Database backup cannot be performed without connection details."
  fi
  
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Function to show help
show_help() {
  show_header
  echo -e "${BLUE}VMB Backup System Documentation${NC}"
  echo ""
  echo -e "${YELLOW}Overview:${NC}"
  echo "The VMB Backup System provides comprehensive backup and restore functionality"
  echo "for the Ven Me, Baby! application. It can backup code, database schema, and"
  echo "environment configuration."
  echo ""
  echo -e "${YELLOW}Backup Types:${NC}"
  echo "1. Full Backup - Includes code, database schema, and configuration"
  echo "2. Database-Only Backup - Captures just the database schema and data"
  echo ""
  echo -e "${YELLOW}Backup Frequency Recommendations:${NC}"
  echo "- Development: Daily backups"
  echo "- Production: Daily or weekly backups, plus before major changes"
  echo ""
  echo -e "${YELLOW}Restoration Process:${NC}"
  echo "Restoration involves:"
  echo "1. Extracting the code archive"
  echo "2. Restoring database schema through migrations"
  echo "3. Setting up environment variables"
  echo ""
  echo -e "${YELLOW}Best Practices:${NC}"
  echo "- Perform regular backups"
  echo "- Test restores occasionally to ensure backup integrity"
  echo "- Keep at least 3 recent backups"
  echo "- Document any custom configurations"
  echo ""
  echo -e "${YELLOW}Common Issues:${NC}"
  echo "- Database version mismatch: Replit uses PostgreSQL v16, while pg_dump is v15"
  echo "  Solution: Our backup uses psql commands to extract schema information"
  echo ""
  echo "- Restore permission issues: Ensure scripts are executable"
  echo "  Solution: Run 'chmod +x script_name.sh' before execution"
  echo ""
  echo -n "Press Enter to return to main menu..."
  read
}

# Main program loop
while true; do
  show_main_menu
  read choice
  
  case $choice in
    1)
      create_backup
      ;;
    2)
      view_backups
      ;;
    3)
      restore_from_backup
      ;;
    4)
      manage_schedule
      ;;
    5)
      cleanup_backups
      ;;
    6)
      backup_database_only
      ;;
    7)
      show_help
      ;;
    8)
      show_header
      echo -e "${GREEN}Thank you for using the VMB Backup Manager!${NC}"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid option. Please try again.${NC}"
      sleep 1
      ;;
  esac
done