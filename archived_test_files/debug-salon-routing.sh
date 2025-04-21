#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}==========================================${NC}"
echo -e "${MAGENTA}  Salon Routing & Endpoint Debug Utility  ${NC}"
echo -e "${MAGENTA}==========================================${NC}"

# Function to trace and log HTTP requests/responses between frontend and backend
trace_request() {
  local method=$1
  local endpoint=$2
  local payload=$3
  local description=$4
  local trace_file="route_${method}_${endpoint//\//_}.log"
  
  echo -e "\n${YELLOW}Tracing: ${description}${NC}"
  echo -e "${CYAN}Method: ${method}${NC}"
  echo -e "${CYAN}Endpoint: ${endpoint}${NC}"
  echo -e "${CYAN}Trace File: ${trace_file}${NC}"
  
  # Output header to trace file
  {
    echo "==================================================="
    echo "ROUTE TRACE: ${description}"
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
  if [ "$method" = "GET" ]; then
    curl -v -s -X GET \
      -w "\n\nTiming:\n---------------------\nTotal time: %{time_total}s\nRedirects: %{num_redirects}\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\n" \
      http://localhost:5000${endpoint} \
      2>> "${trace_file}" | tee -a "${trace_file}" | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
    
  elif [ "$method" = "POST" ]; then
    curl -v -s -X POST \
      -H "Content-Type: application/json" \
      -d "$payload" \
      -w "\n\nTiming:\n---------------------\nTotal time: %{time_total}s\nRedirects: %{num_redirects}\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\n" \
      http://localhost:5000${endpoint} \
      2>> "${trace_file}" | tee -a "${trace_file}" | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
  fi
  
  echo -e "\n${GREEN}✓ Route trace completed and saved to ${trace_file}${NC}"
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to check if a route works and what it returns
check_route() {
  local route=$1
  local description=$2
  
  echo -e "\n${YELLOW}Testing route: ${route} - ${description}${NC}"
  
  # First, test direct API hit
  curl -s "http://localhost:5000/api${route}" -o route_response.json
  if [ $? -eq 0 ] && [ -s route_response.json ]; then
    echo -e "${GREEN}✓ API route works${NC}"
    echo -e "Response: $(cat route_response.json | jq '.' 2>/dev/null || cat route_response.json | head -20)"
  else
    echo -e "${RED}✗ API route failed${NC}"
  fi
  
  # Then, test frontend route
  curl -s "http://localhost:5000${route}" -o frontend_response.html
  if [ $? -eq 0 ] && [ -s frontend_response.html ]; then
    echo -e "${GREEN}✓ Frontend route works${NC}"
    echo -e "Response length: $(wc -c < frontend_response.html) bytes"
    grep -q "Ven Me, Baby!" frontend_response.html && echo -e "${GREEN}✓ Page contains site header${NC}" || echo -e "${RED}✗ Page missing site header${NC}"
    grep -q "<h1" frontend_response.html && echo -e "${GREEN}✓ Page contains main heading${NC}" || echo -e "${RED}✗ Page missing main heading${NC}"
  else
    echo -e "${RED}✗ Frontend route failed${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to test if links on pages properly redirect to the right places
test_page_links() {
  local page_url=$1
  local description=$2
  
  echo -e "\n${YELLOW}Testing links on page: ${description}${NC}"
  echo -e "${CYAN}URL: ${page_url}${NC}"
  
  # Use curl to get the page content
  curl -s "http://localhost:5000${page_url}" -o page_content.html
  
  if [ $? -eq 0 ] && [ -s page_content.html ]; then
    echo -e "${GREEN}✓ Page loaded successfully${NC}"
    
    # Extract links from the page
    grep -o 'href="[^"]*"' page_content.html > page_links.txt
    
    if [ -s page_links.txt ]; then
      echo -e "Found $(wc -l < page_links.txt) links on the page:"
      cat page_links.txt | sed 's/href="//g' | sed 's/"//g' | sort -u | head -10 | sed -e 's/^/    /'
      
      # Test a few key links to make sure they work
      while read -r link; do
        link=$(echo "$link" | sed 's/href="//g' | sed 's/"//g')
        # Only test internal links
        if [[ $link == /* ]] && [[ $link != "/#"* ]]; then
          echo -e "\nTesting link: ${link}"
          curl -s --head "http://localhost:5000${link}" | head -1 | grep -q "200 OK" && echo -e "${GREEN}✓ Link is valid${NC}" || echo -e "${RED}✗ Link returned non-200 status${NC}"
        fi
      done < page_links.txt
    else
      echo -e "${RED}✗ No links found on the page${NC}"
    fi
  else
    echo -e "${RED}✗ Failed to load page${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Start the comprehensive testing
echo -e "\n${BLUE}=== Testing Tiffany's Salon Page & Routes ===${NC}"

# 1. Test the main salon GET endpoint for Tiffany's salon
trace_request "GET" "/api/salons/1" "" "Get Tiffany's salon details"

# 2. Test salon public page for Tiffany's salon
check_route "/salon/1" "Tiffany's public salon page"

# 3. Test all links on the Tiffany salon page
test_page_links "/salon/1" "Tiffany's salon page links"

# 4. Test updating Tiffany's salon info
tiffany_info_payload='{
  "name": "TIFFANY 5280 NAILS STUDIO",
  "ownerName": "Tiffany",
  "phone": "720-555-5280",
  "email": "tiffany@5280nails.com",
  "address": "464 South Teller St Suite2",
  "city": "Lakewood",
  "state": "CO",
  "zipCode": "80226",
  "socialMedia": [
    {
      "platform": "Instagram",
      "handle": "@tiffany_5280"
    },
    {
      "platform": "Website",
      "handle": "https://tiffany5280nails.com"
    }
  ]
}'
trace_request "POST" "/api/salons/1" "$tiffany_info_payload" "Update Tiffany's salon info"

# 5. Test salon dashboard page for Tiffany's salon
check_route "/dashboard/salon/1" "Tiffany's salon dashboard"

# 6. Test all links on Tiffany's dashboard page
test_page_links "/dashboard/salon/1" "Tiffany's dashboard page links"

# Also test Ven Me, Baby! salon (ID 12) for comparison
echo -e "\n${BLUE}=== Testing Ven Me, Baby! Salon Page & Routes ===${NC}"

# 7. Test the main salon GET endpoint for Ven Me, Baby!
trace_request "GET" "/api/salons/12" "" "Get Ven Me, Baby! salon details"

# 8. Test salon public page for Ven Me, Baby!
check_route "/salon/12" "Ven Me, Baby! public salon page"

# 9. Test all links on the Ven Me, Baby! salon page
test_page_links "/salon/12" "Ven Me, Baby! salon page links" 

# 10. Test salon dashboard page for Ven Me, Baby!
check_route "/dashboard/salon/12" "Ven Me, Baby! salon dashboard"

# 11. Test all links on Ven Me, Baby! dashboard page
test_page_links "/dashboard/salon/12" "Ven Me, Baby! dashboard page links"

# Test client form and process
echo -e "\n${BLUE}=== Testing Client Form & Registration Process ===${NC}"

# 12. Check client form page
check_route "/register/client" "Client registration form page"

# 13. Test client registration form submission
client_payload='{
  "name": "Test Client",
  "phone": "(303) 555-1212",
  "email": "test@example.com",
  "isCurrentClient": true,
  "salonId": 1,
  "notes": "Test client for debugging",
  "favoriteServices": ["French Tips", "Gel Manicure"]
}'
trace_request "POST" "/api/clients" "$client_payload" "Register a new client"

echo -e "\n${BLUE}=== Testing Salon Form & Registration Process ===${NC}"

# 14. Check salon form page
check_route "/register/salon" "Salon registration form page"

# 15. Test salon registration form submission
salon_payload='{
  "name": "Debug Test Salon",
  "ownerName": "Debug Owner",
  "phone": "(303) 555-9876",
  "email": "debug@testsalon.com",
  "address": "123 Test Street",
  "city": "Denver",
  "state": "CO",
  "zipCode": "80202",
  "socialMedia": [
    {
      "platform": "Instagram",
      "handle": "@debugsalon"
    }
  ],
  "type": "salon"
}'
trace_request "POST" "/api/salons" "$salon_payload" "Register a new salon"

echo -e "\n${MAGENTA}Route testing completed at: $(date)${NC}"
echo -e "${MAGENTA}Check the route_*.log files for detailed request/response information${NC}"