#!/bin/bash

#################################################
# VMB APP SCRUBBER - COMPREHENSIVE DIAGNOSTIC TOOL
# Created: April 23, 2025
#
# This script performs a comprehensive scan of the
# VMB application, identifying potential issues:
# - Dead/unused files and components
# - Test files that should be archived
# - Problematic API routes and endpoints
# - Debug statements that should be removed
# - Database query vulnerabilities
# - React component structure issues
# - Memory leaks in useEffect hooks
# - Direct DOM manipulation
# - Broken imports
# - Unused React state/hooks
# - Security vulnerabilities
#################################################

# ANSI color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
CHECK_MARK="${GREEN}✅${NC}"
CROSS_MARK="${RED}❌${NC}"
WARNING="${YELLOW}⚠️${NC}"

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}=   VMB APP DIAGNOSTIC SUITE - FULL SCAN   =${NC}"
echo -e "${GREEN}============================================${NC}\n"

# Create temp directory for scan results
mkdir -p ./tmp_scan_results
SCAN_REPORT="./tmp_scan_results/scan_report_$(date +%Y%m%d_%H%M%S).txt"
echo "Scan started at $(date)" > $SCAN_REPORT

# 1. Find unused files and components
echo -e "\n${BLUE}TEST 1: SCANNING FOR UNUSED FILES AND COMPONENTS${NC}"
echo -e "${BLUE}-----------------------------------------${NC}"
echo -e "Analyzing JavaScript/TypeScript imports..."

# Create a list of all potential entry points
find . -path "./client/src/*.tsx" -o -path "./client/src/*.ts" | grep -v "node_modules" > ./tmp_scan_results/entry_files.txt
find . -path "./server/*.ts" -o -path "./server/*.js" | grep -v "node_modules" >> ./tmp_scan_results/entry_files.txt

# Find all js/ts files in the project
find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" > ./tmp_scan_results/all_files.txt

# Check for files that might be test files
echo -e "\n${YELLOW}SUSPECTED TEST FILES:${NC}"
grep -l "test\|spec\|mock" $(cat ./tmp_scan_results/all_files.txt) | sort | tee -a $SCAN_REPORT
test_count=$(grep -l "test\|spec\|mock" $(cat ./tmp_scan_results/all_files.txt) | wc -l)
if [ $test_count -gt 0 ]; then
  echo -e "${CROSS_MARK} Found $test_count potential test files that may not be needed in production" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} No suspected test files found" | tee -a $SCAN_REPORT
fi

# Find all .js/.ts/.tsx files that are not imported anywhere
echo -e "\n${YELLOW}POTENTIALLY UNUSED FILES:${NC}" | tee -a $SCAN_REPORT
potentially_unused=0
for file in $(cat ./tmp_scan_results/all_files.txt); do
  # Extract base filename without extension
  filename=$(basename "$file" | sed 's/\.[^.]*$//')
  # Check if this file is imported anywhere
  if ! grep -q "from.*$filename\|import.*$filename\|require.*$filename" $(cat ./tmp_scan_results/all_files.txt | grep -v "$file"); then
    # Skip entry files, config files, and index files
    if [[ "$file" != *"/index."* && "$file" != */vite.config.* && "$file" != */tailwind.config.* && "$file" != */postcss.config.* ]]; then
      # Skip files that are directly referenced in package.json
      if ! grep -q "$file" package.json; then
        echo "$file" | tee -a $SCAN_REPORT
        potentially_unused=$((potentially_unused + 1))
      fi
    fi
  fi
done

if [ $potentially_unused -gt 0 ]; then
  echo -e "${CROSS_MARK} Found $potentially_unused potentially unused files" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} No potentially unused files detected" | tee -a $SCAN_REPORT
fi

# 2. Check API routes for potential errors
echo -e "\n\n${BLUE}TEST 2: VALIDATING API ROUTES${NC}"
echo -e "${BLUE}--------------------------${NC}"
echo -e "Checking server routes for potential issues...\n"

# List all API endpoints
echo "${YELLOW}API ENDPOINTS FOUND:${NC}" | tee -a $SCAN_REPORT
grep -r "app.get\|app.post\|app.put\|app.delete\|app.patch" ./server --include="*.ts" --include="*.js" | sort | tee -a $SCAN_REPORT

# Check for route parameter consistency
echo -e "\n${YELLOW}ROUTE PARAMETER VALIDATION:${NC}" | tee -a $SCAN_REPORT
invalid_routes=$(grep -r "app.get\|app.post\|app.put\|app.delete\|app.patch" ./server --include="*.ts" --include="*.js" | grep -v "/:" | grep -E "/:([^/]+)/[^:]" || echo "")
if [ -n "$invalid_routes" ]; then
  echo -e "${CROSS_MARK} Found potentially inconsistent route parameters:\n$invalid_routes" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} All route parameters appear consistent" | tee -a $SCAN_REPORT
fi

# Check for potential route handler errors
echo -e "\n${YELLOW}ROUTE HANDLER CHECK:${NC}" | tee -a $SCAN_REPORT
missing_handlers=$(grep -r "app.get\|app.post\|app.put\|app.delete\|app.patch" ./server --include="*.ts" --include="*.js" | grep -v "(req" | grep -v "request" || echo "")
if [ -n "$missing_handlers" ]; then
  echo -e "${CROSS_MARK} Routes potentially missing proper request handlers:\n$missing_handlers" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} All routes appear to have proper request handlers" | tee -a $SCAN_REPORT
fi

# 3. Check for console.log statements that should be removed
echo -e "\n\n${BLUE}TEST 3: CHECKING FOR DEBUG STATEMENTS${NC}"
echo -e "${BLUE}--------------------------------${NC}"
echo -e "Looking for console.log statements that should be removed in production...\n"

console_logs=$(grep -r "console.log" --include="*.tsx" --include="*.ts" --include="*.js" ./client ./server | grep -v "Error\|error\|Exception\|exception\|Failed" || echo "")
if [ -n "$console_logs" ]; then
  count=$(echo "$console_logs" | wc -l)
  echo -e "${CROSS_MARK} Found $count console.log statements that might need cleanup:" | tee -a $SCAN_REPORT
  echo "$console_logs" | head -20 | tee -a $SCAN_REPORT
  if [ $count -gt 20 ]; then
    echo -e "... and $(($count - 20)) more" | tee -a $SCAN_REPORT
  fi
else
  echo -e "${CHECK_MARK} No unnecessary console.log statements found" | tee -a $SCAN_REPORT
fi

# 4. Check database queries for potential issues
echo -e "\n\n${BLUE}TEST 4: VALIDATING DATABASE QUERIES${NC}"
echo -e "${BLUE}-------------------------------${NC}"
echo -e "Analyzing database queries for potential issues...\n"

# Look for SQL queries in the codebase
sql_queries=$(grep -r "SELECT\|INSERT INTO\|UPDATE\|DELETE FROM" --include="*.ts" --include="*.js" ./server || echo "")

if [ -n "$sql_queries" ]; then
  echo -e "${YELLOW}DATABASE QUERIES FOUND:${NC}\n$sql_queries\n" | tee -a $SCAN_REPORT
  
  # Check for potential SQL injection vulnerabilities
  sql_injection_risk=$(grep -r "SELECT\|INSERT INTO\|UPDATE\|DELETE FROM" --include="*.ts" --include="*.js" ./server | grep -E "\`.*\$\{.*\}.*\`|\".*(req|request).*(body|params|query).*\"" || echo "")
  
  if [ -n "$sql_injection_risk" ]; then
    echo -e "${CROSS_MARK} Potential SQL injection risks detected:" | tee -a $SCAN_REPORT
    echo "$sql_injection_risk" | tee -a $SCAN_REPORT
  else
    echo -e "${CHECK_MARK} No obvious SQL injection risks found" | tee -a $SCAN_REPORT
  fi
else
  echo -e "${CHECK_MARK} No direct SQL queries found (likely using ORM)" | tee -a $SCAN_REPORT
fi

# Check for Drizzle ORM problematic patterns
echo -e "\n${YELLOW}CHECKING ORM USAGE:${NC}" | tee -a $SCAN_REPORT
orm_issues=$(grep -r "db.execute\|db.query" --include="*.ts" --include="*.js" ./server | grep -E "\`.*\$\{.*\}.*\`" || echo "")
if [ -n "$orm_issues" ]; then
  echo -e "${CROSS_MARK} Potential ORM issues detected:" | tee -a $SCAN_REPORT
  echo "$orm_issues" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} No obvious ORM issues detected" | tee -a $SCAN_REPORT
fi

# 5. Validate frontend components
echo -e "\n\n${BLUE}TEST 5: VALIDATING FRONTEND COMPONENTS${NC}"
echo -e "${BLUE}----------------------------------${NC}"
echo -e "Checking for React component structure issues...\n"

# Check for components without necessary imports
missing_imports=$(grep -r "function.*return" --include="*.tsx" ./client | grep -v "import React" | grep -v "export const" || echo "")
if [ -n "$missing_imports" ]; then
  echo -e "${CROSS_MARK} Components potentially missing React imports:" | tee -a $SCAN_REPORT
  echo "$missing_imports" | head -10 | tee -a $SCAN_REPORT
  if [ $(echo "$missing_imports" | wc -l) -gt 10 ]; then
    echo -e "... and $(($(echo "$missing_imports" | wc -l) - 10)) more" | tee -a $SCAN_REPORT
  fi
else
  echo -e "${CHECK_MARK} All components appear to have proper imports" | tee -a $SCAN_REPORT
fi

# Check for potential memory leaks in useEffect
memory_leaks=$(grep -A 10 -B 2 "useEffect" --include="*.tsx" --include="*.ts" ./client | grep -v "return.*cleanup\|return.*unsubscribe\|return.*=>.*off\|return.*=>.*cancel" || echo "")
if [ -n "$memory_leaks" ]; then
  echo -e "\n${WARNING} Potential missing cleanup in useEffect hooks (requires manual review):" | tee -a $SCAN_REPORT
  echo "$memory_leaks" | head -15 | tee -a $SCAN_REPORT
  if [ $(echo "$memory_leaks" | wc -l) -gt 15 ]; then
    echo -e "... and $(($(echo "$memory_leaks" | wc -l) - 15)) more" | tee -a $SCAN_REPORT
  fi
else
  echo -e "\n${CHECK_MARK} No obvious useEffect issues detected" | tee -a $SCAN_REPORT
fi

# 6. Check for direct DOM manipulation (should use refs instead)
echo -e "\n\n${BLUE}TEST 6: CHECKING FOR DIRECT DOM MANIPULATION${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "Looking for direct DOM manipulation that should use refs...\n"

dom_manipulation=$(grep -r "document.getElementById\|document.querySelector\|document.getElementsByClassName" --include="*.tsx" --include="*.ts" ./client || echo "")
if [ -n "$dom_manipulation" ]; then
  echo -e "${CROSS_MARK} Direct DOM manipulation found (consider using refs):" | tee -a $SCAN_REPORT
  echo "$dom_manipulation" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} No direct DOM manipulation detected" | tee -a $SCAN_REPORT
fi

# 7. Check for broken imports
echo -e "\n\n${BLUE}TEST 7: VALIDATING IMPORT STATEMENTS${NC}"
echo -e "${BLUE}---------------------------------${NC}"
echo -e "Checking for potential broken imports...\n"

# Look for imports that might not exist
echo -e "${YELLOW}CHECKING POTENTIALLY PROBLEMATIC IMPORTS:${NC}" | tee -a $SCAN_REPORT
broken_imports=0
for file in $(find ./client/src -name "*.tsx" -o -name "*.ts"); do
  # Extract imports from file
  imports=$(grep "import.*from" "$file" | grep -v "import type" || echo "")
  
  if [ -n "$imports" ]; then
    while IFS= read -r line; do
      # Extract the from part
      from=$(echo "$line" | grep -o "from.*" | sed "s/from//g" | tr -d ";'\" " || echo "")
      if [ -n "$from" ] && [[ $from != @* ]] && [[ $from != .* ]] && [[ $from != /* ]]; then
        # Check if this is a package in package.json
        if ! grep -q "\"$from\"" package.json; then
          echo "${CROSS_MARK} Potential broken import in $file: $line" | tee -a $SCAN_REPORT
          broken_imports=$((broken_imports + 1))
        fi
      fi
    done <<< "$imports"
  fi
done

if [ $broken_imports -eq 0 ]; then
  echo -e "${CHECK_MARK} No problematic imports detected" | tee -a $SCAN_REPORT
fi

# 8. Check for unused state/effects
echo -e "\n\n${BLUE}TEST 8: CHECKING FOR UNUSED REACT HOOKS${NC}"
echo -e "${BLUE}----------------------------------${NC}"
echo -e "Looking for potentially unused state or effects...\n"

# Find state declarations
state_declarations=$(grep -r "useState" --include="*.tsx" --include="*.ts" ./client || echo "")
if [ -n "$state_declarations" ]; then
  echo -e "${YELLOW}STATE HOOKS FOUND:${NC} $(echo "$state_declarations" | wc -l)" | tee -a $SCAN_REPORT
  
  # Extract potential unused state variables
  echo -e "\n${YELLOW}POTENTIAL UNUSED STATE VARIABLES:${NC}" | tee -a $SCAN_REPORT
  unused_state=0
  
  while IFS= read -r line; do
    file=$(echo "$line" | cut -d ':' -f 1)
    state_var=$(echo "$line" | grep -o "const \[[^,]*," | sed 's/const \[//' | sed 's/,//' || echo "")
    
    if [ -n "$state_var" ]; then
      # Count occurrences of this state variable outside the declaration
      usage_count=$(grep -v "useState.*$state_var" "$file" | grep -c "$state_var")
      
      if [ $usage_count -le 1 ]; then
        echo "${CROSS_MARK} Potential unused state in $file: $state_var" | tee -a $SCAN_REPORT
        unused_state=$((unused_state + 1))
      fi
    fi
  done <<< "$state_declarations"
  
  if [ $unused_state -eq 0 ]; then
    echo -e "${CHECK_MARK} No obviously unused state variables detected" | tee -a $SCAN_REPORT
  fi
else
  echo -e "${CHECK_MARK} No state hooks found" | tee -a $SCAN_REPORT
fi

# 9. Look for UI accessibility issues
echo -e "\n\n${BLUE}TEST 9: CHECKING FOR ACCESSIBILITY ISSUES${NC}"
echo -e "${BLUE}-------------------------------------${NC}"
echo -e "Analyzing components for potential accessibility issues...\n"

# Check for missing alt attributes on images
missing_alt=$(grep -r "<img" --include="*.tsx" --include="*.jsx" ./client | grep -v "alt" || echo "")
if [ -n "$missing_alt" ]; then
  echo -e "${CROSS_MARK} Images potentially missing alt attributes:" | tee -a $SCAN_REPORT
  echo "$missing_alt" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} All images appear to have alt attributes" | tee -a $SCAN_REPORT
fi

# Check for potential a11y issues with click handlers
a11y_issues=$(grep -r "onClick" --include="*.tsx" --include="*.jsx" ./client | grep -v "role\|aria-" | grep -v "button" || echo "")
if [ -n "$a11y_issues" ]; then
  echo -e "\n${WARNING} Potential accessibility issues (click handlers without proper roles):" | tee -a $SCAN_REPORT
  echo "$a11y_issues" | head -10 | tee -a $SCAN_REPORT
  if [ $(echo "$a11y_issues" | wc -l) -gt 10 ]; then
    echo -e "... and $(($(echo "$a11y_issues" | wc -l) - 10)) more" | tee -a $SCAN_REPORT
  fi
else
  echo -e "\n${CHECK_MARK} No obvious accessibility issues detected" | tee -a $SCAN_REPORT
fi

# 10. Check files that might be obsolete or unused
echo -e "\n\n${BLUE}TEST 10: IDENTIFYING OBSOLETE FILES${NC}"
echo -e "${BLUE}----------------------------------${NC}"
echo -e "Analyzing for files that might be outdated or unused...\n"

# Look for files with old timestamps
find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" -mtime +60 | sort > ./tmp_scan_results/old_files.txt
old_file_count=$(cat ./tmp_scan_results/old_files.txt | wc -l)

if [ $old_file_count -gt 0 ]; then
  echo -e "${YELLOW}FILES NOT MODIFIED IN OVER 60 DAYS ($old_file_count):${NC}" | tee -a $SCAN_REPORT
  head -10 ./tmp_scan_results/old_files.txt | tee -a $SCAN_REPORT
  if [ $old_file_count -gt 10 ]; then
    echo -e "... and $(($old_file_count - 10)) more" | tee -a $SCAN_REPORT
  fi
else
  echo -e "${CHECK_MARK} All files have been modified within the last 60 days" | tee -a $SCAN_REPORT
fi

# PENULTIMATE TEST - Critical vulnerability check
echo -e "\n\n${BLUE}PENULTIMATE TEST: CRITICAL SECURITY SCAN${NC}"
echo -e "${BLUE}------------------------------------${NC}"
echo -e "${WARNING} WARNING: About to run final security scan. This may identify critical vulnerabilities.\n"
echo -e "Running security check for critical vulnerabilities..."

# Check for hardcoded credentials
credentials=$(grep -r "password\|apiKey\|secret\|token\|key:" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" . | grep -v "node_modules" | grep -v "password: z.string" | grep -v "passwordHash" | grep -v "passwordMatch" | grep -v "passwordReset" | grep -v "type" || echo "")

if [ -n "$credentials" ]; then
  echo -e "\n${CROSS_MARK} CRITICAL: Potential hardcoded credentials found:" | tee -a $SCAN_REPORT
  echo "$credentials" | tee -a $SCAN_REPORT
else
  echo -e "\n${CHECK_MARK} No obvious hardcoded credentials detected" | tee -a $SCAN_REPORT
fi

# Look for exposed API keys
api_keys=$(grep -r "key-[a-zA-Z0-9]\{20,\}\|sk-[a-zA-Z0-9]\{20,\}\|pk-[a-zA-Z0-9]\{20,\}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" . | grep -v "node_modules" || echo "")

if [ -n "$api_keys" ]; then
  echo -e "\n${CROSS_MARK} CRITICAL: Potential API keys exposed in code:" | tee -a $SCAN_REPORT
  echo "$api_keys" | tee -a $SCAN_REPORT
else
  echo -e "\n${CHECK_MARK} No API keys detected in codebase" | tee -a $SCAN_REPORT
fi

# 12. FINAL TEST - Analyze component structure and code quality
echo -e "\n\n${BLUE}FINAL TEST: CODE QUALITY ANALYSIS${NC}"
echo -e "${BLUE}-----------------------------${NC}"
echo -e "Running final code quality checks...\n"

# Look for overly complex components (potential refactoring candidates)
complex_components=$(find ./client/src/components -name "*.tsx" -exec wc -l {} \; | sort -nr | head -10 || echo "")

if [ -n "$complex_components" ]; then
  echo -e "${YELLOW}POTENTIAL REFACTORING CANDIDATES (LARGEST COMPONENTS):${NC}" | tee -a $SCAN_REPORT
  echo "$complex_components" | tee -a $SCAN_REPORT
else
  echo -e "${CHECK_MARK} No overly complex components detected" | tee -a $SCAN_REPORT
fi

# Analyze function complexity (components with many conditionals)
conditional_heavy=$(grep -r "if\|switch\|case\|? :" --include="*.tsx" ./client/src/components | cut -d: -f1 | sort | uniq -c | sort -nr | head -10 || echo "")

if [ -n "$conditional_heavy" ]; then
  echo -e "\n${YELLOW}COMPONENTS WITH MANY CONDITIONALS (COMPLEXITY):${NC}" | tee -a $SCAN_REPORT
  echo "$conditional_heavy" | tee -a $SCAN_REPORT
else
  echo -e "\n${CHECK_MARK} No components with excessive conditionals detected" | tee -a $SCAN_REPORT
fi

# Complete the scan report
echo -e "\n\n${GREEN}==================================================${NC}"
echo -e "${GREEN}=   DIAGNOSTIC SCAN COMPLETE - RESULTS SUMMARY   =${NC}"
echo -e "${GREEN}==================================================${NC}\n"

# Generate summary

echo -e "\n${BLUE}SCAN SUMMARY:${NC}" | tee -a $SCAN_REPORT
echo "Scan completed at $(date)" >> $SCAN_REPORT

# Cleanup temp files if needed
# rm -rf ./tmp_scan_results

echo -e "\nDetailed scan report saved to: ${YELLOW}$SCAN_REPORT${NC}\n"