#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   Ven Me, Baby! Application Test Suite   ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Function to test API endpoints
test_api_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  
  echo -e "\n${YELLOW}Testing: ${description}${NC}"
  echo -e "Endpoint: ${endpoint}"
  
  # Make the request and capture status code
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000${endpoint})
  
  if [ "$response" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Success: Status $response${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed: Expected status $expected_status but got $response${NC}"
    return 1
  fi
}

# Function to test database queries
test_database_query() {
  local query=$1
  local description=$2
  
  echo -e "\n${YELLOW}Testing: ${description}${NC}"
  echo -e "Query: ${query}"
  
  # Execute the query and check if it returns data
  result=$(psql $DATABASE_URL -c "$query" 2>&1)
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ Query executed successfully${NC}"
    echo "Result preview: $(echo "$result" | head -n 5 | tr '\n' ' ')"
    return 0
  else
    echo -e "${RED}✗ Query failed: $result${NC}"
    return 1
  fi
}

# Initialize counters for test statistics
total_tests=0
passed_tests=0
failed_tests=0

# Run a test and update counters
run_test() {
  local test_function=$1
  local arg1=$2
  local arg2=$3
  local arg3=$4
  
  total_tests=$((total_tests + 1))
  
  if $test_function "$arg1" "$arg2" "$arg3"; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

echo -e "\n${BLUE}=== Testing API Endpoints ===${NC}"

# Test GET API endpoints
run_test test_api_endpoint "/api/salons" 200 "Get all salons"
run_test test_api_endpoint "/api/salons/1" 200 "Get salon by ID (Tiffany's salon)"
run_test test_api_endpoint "/api/salons/12" 200 "Get salon by ID (Ven Me, Baby! LTD)"
run_test test_api_endpoint "/api/clients" 200 "Get all clients"
run_test test_api_endpoint "/api/salons/999" 404 "Get non-existent salon (should return 404)"

echo -e "\n${BLUE}=== Testing Database Queries ===${NC}"

# Test database queries
run_test test_database_query "SELECT COUNT(*) FROM salons;" "Count all salons"
run_test test_database_query "SELECT COUNT(*) FROM clients;" "Count all clients" 
run_test test_database_query "SELECT id, name, owner_name FROM salons WHERE name LIKE '%Ven Me%';" "Find Ven Me salon"
run_test test_database_query "SELECT id, name, owner_name FROM salons WHERE name LIKE '%Tiffany%';" "Find Tiffany's salon"

# Create a test salon for testing POST operations
echo -e "\n${BLUE}=== Testing POST Operations ===${NC}"
echo -e "${YELLOW}Creating a test salon...${NC}"

salon_data='{
  "name": "Test Salon",
  "ownerName": "Test Owner",
  "phone": "(303) 555-1234",
  "email": "test@example.com",
  "type": "salon",
  "address": "123 Test St",
  "city": "Denver",
  "state": "CO",
  "zipCode": "80202"
}'

create_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$salon_data" http://localhost:5000/api/salons)
salon_id=$(echo $create_response | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

if [ -n "$salon_id" ]; then
  echo -e "${GREEN}✓ Created test salon with ID: $salon_id${NC}"
  
  # Test adding services to the salon
  echo -e "${YELLOW}Adding services to test salon...${NC}"
  
  service_data='{
    "services": [
      {
        "id": 1,
        "name": "Test Service",
        "description": "A test service",
        "price": 50,
        "duration": 45,
        "featured": true,
        "gifUrl": "/assets/french-tips.png"
      }
    ]
  }'
  
  update_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$service_data" http://localhost:5000/api/salons/$salon_id/services)
  if [[ "$update_response" == *"Test Service"* ]]; then
    echo -e "${GREEN}✓ Added services to test salon${NC}"
    passed_tests=$((passed_tests + 1))
  else
    echo -e "${RED}✗ Failed to add services to test salon${NC}"
    failed_tests=$((failed_tests + 1))
  fi
  
else
  echo -e "${RED}✗ Failed to create test salon${NC}"
  failed_tests=$((failed_tests + 1))
fi

total_tests=$((total_tests + 1))

# Print test summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "Total tests: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $failed_tests${NC}"

# Calculate and display success percentage
success_percentage=$(( (passed_tests * 100) / total_tests ))
echo -e "Success rate: ${success_percentage}%"

if [ $failed_tests -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
else
  echo -e "\n${RED}Some tests failed. See above for details.${NC}"
fi

echo -e "\n${BLUE}Test completed at: $(date)${NC}"