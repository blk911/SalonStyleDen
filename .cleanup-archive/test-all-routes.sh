#!/bin/bash

# Colors for prettier output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4
  local payload=$5

  echo -e "${YELLOW}Testing:${NC} $description"
  echo -e "${YELLOW}$method${NC} $endpoint"
  
  if [ "$method" == "GET" ]; then
    # Make GET request
    response=$(curl -s -o response.txt -w "%{http_code}" -X $method http://localhost:5000$endpoint)
  else
    # Make POST request with payload
    response=$(curl -s -o response.txt -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$payload" http://localhost:5000$endpoint)
  fi
  
  # Check response status
  if [ "$response" -eq "$expected_status" ]; then
    echo -e "${GREEN}Success:${NC} Status code $response matches expected $expected_status"
    # Show brief preview of response content
    echo "Response preview: $(head -c 100 response.txt)..."
  else
    echo -e "${RED}Error:${NC} Expected status $expected_status but got $response"
    echo "Response: $(cat response.txt)"
  fi
  
  echo "----------------------------------------"
}

echo "==== Starting API Route Tests ===="

# Test GET endpoints
test_endpoint "GET" "/api/salons" 200 "Fetch all salons"
test_endpoint "GET" "/api/salons/1" 200 "Fetch salon by ID 1"
test_endpoint "GET" "/api/salons/12" 200 "Fetch Ven Me Baby salon"
test_endpoint "GET" "/api/clients" 200 "Fetch all clients"

# Test POST endpoint with sample data
salon_payload='{"name":"Test Route Salon","ownerName":"Test Owner","phone":"(303) 555-1234","email":"test@example.com","type":"salon"}'
test_endpoint "POST" "/api/salons" 201 "Create new salon" "$salon_payload"

# Clean up
rm response.txt
echo "==== API Tests Completed ===="