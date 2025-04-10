#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}==========================================${NC}"
echo -e "${MAGENTA}  Salon Page Debug & Backtrace Utility   ${NC}"
echo -e "${MAGENTA}==========================================${NC}"

# Function to trace request and response with detailed debugging
debug_trace_request() {
  local method=$1
  local endpoint=$2
  local payload=$3
  local description=$4
  local trace_file="trace_${method}_${endpoint//\//_}.log"
  
  echo -e "\n${YELLOW}Debug Tracing: ${description}${NC}"
  echo -e "${CYAN}Method: ${method}${NC}"
  echo -e "${CYAN}Endpoint: ${endpoint}${NC}"
  echo -e "${CYAN}Trace File: ${trace_file}${NC}"
  
  # Output header to trace file
  {
    echo "==================================================="
    echo "DEBUG TRACE: ${description}"
    echo "METHOD: ${method}"
    echo "ENDPOINT: ${endpoint}"
    echo "TIMESTAMP: $(date)"
    echo "==================================================="
    echo ""
  } > "${trace_file}"
  
  if [ -n "$payload" ]; then
    echo -e "${CYAN}Payload:${NC}"
    echo "$payload" | jq '.' 2>/dev/null || echo "$payload"
    
    # Add payload to trace file
    {
      echo "REQUEST PAYLOAD:"
      echo "$payload" | jq '.' 2>/dev/null || echo "$payload"
      echo ""
    } >> "${trace_file}"
  fi
  
  echo -e "\n${CYAN}Executing request with curl verbose mode...${NC}"
  
  # Execute curl with verbose option to see detailed HTTP information
  # Also capture headers and timing information
  if [ "$method" = "GET" ]; then
    curl -v -s -X GET \
      -w "\n\nTiming:\n---------------------\nTotal time: %{time_total}s\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nPretransfer: %{time_pretransfer}s\nStarttransfer: %{time_starttransfer}s\n" \
      http://localhost:5000${endpoint} \
      2>> "${trace_file}" | tee -a "${trace_file}" | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
    
  elif [ "$method" = "POST" ]; then
    curl -v -s -X POST \
      -H "Content-Type: application/json" \
      -d "$payload" \
      -w "\n\nTiming:\n---------------------\nTotal time: %{time_total}s\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nPretransfer: %{time_pretransfer}s\nStarttransfer: %{time_starttransfer}s\n" \
      http://localhost:5000${endpoint} \
      2>> "${trace_file}" | tee -a "${trace_file}" | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
  fi
  
  echo -e "\n${GREEN}✓ Debug trace completed and saved to ${trace_file}${NC}"
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to check server logs for relevant error messages
check_server_logs() {
  local endpoint=$1
  local lookback=${2:-100} # Default to last 100 lines
  
  echo -e "\n${YELLOW}Checking server logs for errors related to: ${endpoint}${NC}"
  
  # Get the current workflow logs
  local server_logs=$(bash -c "tail -n ${lookback} .replit/logs/workflow.log 2>/dev/null")
  
  if [ -z "$server_logs" ]; then
    echo -e "${RED}Unable to access server logs. Make sure the application is running.${NC}"
    return 1
  fi
  
  # Extract error messages that might be related to the endpoint
  local errors=$(echo "$server_logs" | grep -i -E "error|exception|fail|warn" | grep -i "$endpoint" || true)
  
  if [ -n "$errors" ]; then
    echo -e "${RED}Found potential errors in server logs:${NC}"
    echo "$errors"
  else
    echo -e "${GREEN}No obvious errors found in server logs for endpoint: ${endpoint}${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to test database queries for this endpoint to detect issues
debug_database_query() {
  local query=$1
  local description=$2
  
  echo -e "\n${YELLOW}Debug Database: ${description}${NC}"
  echo -e "${CYAN}Query: ${query}${NC}"
  
  # Execute the query and capture both output and error
  local result
  result=$(PGOPTIONS='--client-min-messages=warning' psql "$DATABASE_URL" -c "$query" 2>&1)
  local status=$?
  
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓ Query executed successfully${NC}"
    echo "Result:"
    echo "$result" | sed -e 's/^/    /' # Indent the output for readability
  else
    echo -e "${RED}✗ Query failed with status: ${status}${NC}"
    echo "Error:"
    echo "$result" | sed -e 's/^/    /' # Indent the error for readability
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Start with a detailed trace of the main salon listing endpoint
echo -e "\n${BLUE}=== Debug Tracing Main Salon Listing ===${NC}"
debug_trace_request "GET" "/api/salons" "" "Get all salons (with detailed HTTP trace)"

# Check server logs for any errors related to the salons endpoint
check_server_logs "salons" 200

# Debug trace for Tiffany's salon
echo -e "\n${BLUE}=== Debug Tracing Tiffany's Salon (ID: 1) ===${NC}"
debug_trace_request "GET" "/api/salons/1" "" "Get Tiffany's salon with detailed trace"

# Check server logs for any errors related to salon ID 1
check_server_logs "salon.*1" 200

# Debug the database tables directly
echo -e "\n${BLUE}=== Debug Database Queries ===${NC}"
debug_database_query "SELECT id, name, owner_name, services, promos FROM salons WHERE id = 1;" "Check Tiffany salon record"
debug_database_query "SELECT id, name, owner_name, services, promos FROM salons WHERE name LIKE '%Tiffany%';" "Find salons with Tiffany in name"
debug_database_query "SELECT id, name, owner_name, services, promos FROM salons WHERE name LIKE '%Ven Me%';" "Find Ven Me salon"

# Test updating a salon's promos
echo -e "\n${BLUE}=== Debug Testing POST Operations ===${NC}"

tiffany_promo_payload='{
  "promos": [
    {
      "id": 1,
      "title": "Summer French Tips Special",
      "description": "Get stunning French tips with pearl accents. Perfect for summer elegance!",
      "endDate": null
    },
    {
      "id": 2,
      "title": "Spring Blossom Special",
      "description": "Celebrate spring with floral nail art designs at 15% off!",
      "endDate": "2025-06-30"
    }
  ]
}'

debug_trace_request "POST" "/api/salons/1/promos" "$tiffany_promo_payload" "Update Tiffany's salon promos with detailed trace"

# Check server logs for any errors after the POST request
check_server_logs "promos" 100

# Confirm if the update was successful
debug_database_query "SELECT id, name, promos FROM salons WHERE id = 1;" "Verify Tiffany's salon promos after update"

echo -e "\n${MAGENTA}Debug session completed at: $(date)${NC}"
echo -e "${MAGENTA}Check the trace_*.log files for detailed request/response information${NC}"