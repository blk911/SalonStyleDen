#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}    Salon Endpoint Detailed Test Suite    ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Function for detailed endpoint testing with logging and status
detailed_test() {
  local method=$1
  local endpoint=$2
  local payload=$3
  local description=$4
  
  echo -e "\n${YELLOW}Testing: ${description}${NC}"
  echo -e "${CYAN}Method: ${method}${NC}"
  echo -e "${CYAN}Endpoint: ${endpoint}${NC}"
  
  if [ -n "$payload" ]; then
    echo -e "${CYAN}Payload:${NC}"
    echo "$payload" | jq '.' 2>/dev/null || echo "$payload"
  fi
  
  echo -e "\n${CYAN}Response:${NC}"
  
  # Execute the request with appropriate method
  if [ "$method" = "GET" ]; then
    curl -s -X GET http://localhost:5000${endpoint} | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
    status=$?
  elif [ "$method" = "POST" ]; then
    curl -s -X POST -H "Content-Type: application/json" -d "$payload" http://localhost:5000${endpoint} | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
    status=$?
  elif [ "$method" = "PUT" ]; then
    curl -s -X PUT -H "Content-Type: application/json" -d "$payload" http://localhost:5000${endpoint} | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
    status=$?
  else
    # Fallback to another method if needed
    curl -s -X "$method" -H "Content-Type: application/json" -d "$payload" http://localhost:5000${endpoint} | jq '.' 2>/dev/null || echo "Failed to parse response as JSON"
    status=$?
  fi
  
  if [ $status -eq 0 ]; then
    echo -e "\n${GREEN}✓ Request executed successfully${NC}"
  else
    echo -e "\n${RED}✗ Request failed with status: ${status}${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

echo -e "\n${BLUE}=== Testing Tiffany's Salon Endpoints (ID: 1) ===${NC}"

# 1. Get Tiffany's salon details
detailed_test "GET" "/api/salons/1" "" "Get Tiffany's salon details"

# 2. Try to update Tiffany's salon info
update_payload='{
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

# This endpoint may not exist but we're testing if it does
detailed_test "POST" "/api/salons/1" "$update_payload" "Update Tiffany's salon info"

# 3. Get services for Tiffany's salon
detailed_test "GET" "/api/salons/1/services" "" "Get Tiffany's salon services"

# 4. Add a new service to Tiffany's salon
service_payload='{
  "services": [
    {
      "id": 1,
      "name": "French Tips / Touch-Up",
      "description": "Classic white tips or quick polish refresh.",
      "price": 40,
      "duration": 30,
      "featured": true,
      "gifUrl": "/assets/french-tips.png"
    },
    {
      "id": 2,
      "name": "Luxe Gel Manicure",
      "description": "Glossy, chip-free color with lasting shine.",
      "price": 55,
      "duration": 45,
      "featured": true,
      "gifUrl": "/assets/gel-manicure.png"
    },
    {
      "id": 3,
      "name": "Sculpted Acrylics",
      "description": "Custom-shaped acrylics for bold length.",
      "price": 70,
      "duration": 60,
      "featured": true,
      "gifUrl": "/assets/sculpted-acrylics.png"
    },
    {
      "id": 4,
      "name": "Glam Me! Custom Design",
      "description": "Fully custom art, gems, 3D extras.",
      "price": 125,
      "duration": 90,
      "featured": true,
      "gifUrl": "/assets/glam-design.png"
    },
    {
      "id": 5,
      "name": "Seasonal Spring Special",
      "description": "Floral designs with pastel colors for spring.",
      "price": 85,
      "duration": 60,
      "featured": true,
      "gifUrl": "/assets/spring-special.png"
    }
  ]
}'
detailed_test "POST" "/api/salons/1/services" "$service_payload" "Update Tiffany's salon services"

# 5. Get promotions for Tiffany's salon
detailed_test "GET" "/api/salons/1/promos" "" "Get Tiffany's salon promotions"

# 6. Add promotions to Tiffany's salon
promo_payload='{
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
detailed_test "POST" "/api/salons/1/promos" "$promo_payload" "Update Tiffany's salon promotions"

echo -e "\n${BLUE}=== Testing Ven Me, Baby! Salon Endpoints (ID: 12) ===${NC}"

# 7. Get Ven Me, Baby! salon details
detailed_test "GET" "/api/salons/12" "" "Get Ven Me, Baby! salon details"

# 8. Get services for Ven Me, Baby! salon
detailed_test "GET" "/api/salons/12/services" "" "Get Ven Me, Baby! salon services"

# 9. Get promotions for Ven Me, Baby! salon
detailed_test "GET" "/api/salons/12/promos" "" "Get Ven Me, Baby! salon promotions"

echo -e "\n${BLUE}=== Testing Salon Listing/Filtering Endpoints ===${NC}"

# 10. Test salon filtering by state
detailed_test "GET" "/api/salons?state=CO" "" "Filter salons by state (CO)"

# 11. Test salon filtering by city
detailed_test "GET" "/api/salons?city=Denver" "" "Filter salons by city (Denver)"

# 12. Test salon filtering by zipcode
detailed_test "GET" "/api/salons?zipCode=80202" "" "Filter salons by ZIP code (80202)"

echo -e "\n${BLUE}Test completed at: $(date)${NC}"