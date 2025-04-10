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
echo -e "${MAGENTA}  Salon Owner Display Test Utility       ${NC}"
echo -e "${MAGENTA}==========================================${NC}"

# Function to check if salon owner name is properly displayed
test_salon_owner_display() {
  local salon_id=$1
  local expected_owner_name=$2
  
  echo -e "\n${YELLOW}Testing owner name display for salon ID: ${salon_id}${NC}"
  echo -e "${CYAN}Expected owner name: ${expected_owner_name}${NC}"
  
  # Get the API response for this salon
  echo -e "\n${CYAN}API Response:${NC}"
  local api_response=$(curl -s "http://localhost:5000/api/salons/${salon_id}")
  local actual_owner_name=$(echo $api_response | jq -r '.ownerName')
  
  echo -e "API reports owner name as: ${BLUE}${actual_owner_name}${NC}"
  
  if [[ "$actual_owner_name" == "$expected_owner_name" ]]; then
    echo -e "${GREEN}✓ API has correct owner name${NC}"
  else
    echo -e "${RED}✗ API owner name mismatch${NC}"
  fi
  
  # Now check how it appears in the frontend
  local frontend_response=$(curl -s "http://localhost:5000/salon/${salon_id}")
  
  # Extract the welcome message from the HTML using grep and sed
  local welcome_message=$(echo "$frontend_response" | grep -o "Welcome.*!" | head -1)
  echo -e "Frontend welcome message: ${BLUE}${welcome_message:-'Not found'}${NC}"
  
  if [[ "$welcome_message" == *"$expected_owner_name"* ]]; then
    echo -e "${GREEN}✓ Owner name appears correctly in welcome message${NC}"
  else
    echo -e "${RED}✗ Owner name missing or incorrect in welcome message${NC}"
  fi
  
  # Check the dashboard page too
  local dashboard_response=$(curl -s "http://localhost:5000/dashboard/salon/${salon_id}")
  local dashboard_welcome=$(echo "$dashboard_response" | grep -o "Welcome.*!" | head -1)
  echo -e "Dashboard welcome message: ${BLUE}${dashboard_welcome:-'Not found'}${NC}"
  
  if [[ "$dashboard_welcome" == *"$expected_owner_name"* ]]; then
    echo -e "${GREEN}✓ Owner name appears correctly in dashboard${NC}"
  else
    echo -e "${RED}✗ Owner name missing or incorrect in dashboard${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to trace routing paths between components
trace_component_routing() {
  local component_name=$1
  local route_path=$2
  
  echo -e "\n${YELLOW}Tracing component routing for: ${component_name}${NC}"
  echo -e "${CYAN}Route: ${route_path}${NC}"
  
  local frontend_response=$(curl -s "http://localhost:5000${route_path}")
  
  # Look for React component and router logic
  local component_refs=$(echo "$frontend_response" | grep -o "${component_name}[A-Za-z0-9]*" | sort -u)
  echo -e "\nComponent references found:"
  if [[ -n "$component_refs" ]]; then
    echo "$component_refs" | sed -e 's/^/    /'
    echo -e "${GREEN}✓ Component references found${NC}"
  else
    echo -e "${RED}✗ No component references found${NC}"
  fi
  
  # Look for route references
  local route_refs=$(echo "$frontend_response" | grep -o "/[a-zA-Z0-9/]*${route_path}[a-zA-Z0-9/]*" | sort -u)
  echo -e "\nRoute references found:"
  if [[ -n "$route_refs" ]]; then
    echo "$route_refs" | sed -e 's/^/    /'
    echo -e "${GREEN}✓ Route references found${NC}"
  else
    echo -e "${RED}✗ No route references found${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to check for social media related issues
test_social_media_component() {
  local component_name="socialMedia"
  local form_route=$1
  
  echo -e "\n${YELLOW}Testing social media component on: ${form_route}${NC}"
  
  local frontend_response=$(curl -s "http://localhost:5000${form_route}")
  
  # Look for social media related fields and errors
  local social_refs=$(echo "$frontend_response" | grep -o "social[A-Za-z0-9]*" | sort -u)
  echo -e "\nSocial media references found:"
  if [[ -n "$social_refs" ]]; then
    echo "$social_refs" | sed -e 's/^/    /'
    echo -e "${GREEN}✓ Social media references found${NC}"
  else
    echo -e "${RED}✗ No social media references found${NC}"
  fi
  
  # Look for error patterns that might be related to social media
  local error_patterns=("Maximum update depth exceeded" "Error: social" "undefined is not an object" "Cannot read properties of undefined")
  
  for pattern in "${error_patterns[@]}"; do
    if echo "$frontend_response" | grep -q "$pattern"; then
      echo -e "${RED}✗ Found potential error: ${pattern}${NC}"
    else
      echo -e "${GREEN}✓ No '${pattern}' error detected${NC}"
    fi
  done
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# ------------- Test Execution -------------

# Test Tiffany's salon
echo -e "\n${BLUE}=== Testing Tiffany's Salon (ID: 1) ===${NC}"
test_salon_owner_display 1 "Tiffany"
trace_component_routing "SalonPublic" "/salon/1"
test_social_media_component "/salon/1"

# Test Ven Me, Baby! salon
echo -e "\n${BLUE}=== Testing Ven Me, Baby! Salon (ID: 12) ===${NC}"
test_salon_owner_display 12 "Admin"
trace_component_routing "SalonPublic" "/salon/12"
test_social_media_component "/salon/12"

# Test a random salon
echo -e "\n${BLUE}=== Testing Another Salon (ID: 3) ===${NC}"
test_salon_owner_display 3 "Owner"
trace_component_routing "SalonPublic" "/salon/3"
test_social_media_component "/salon/3"

# Test social media components in forms
echo -e "\n${BLUE}=== Testing Social Media Components in Forms ===${NC}"
test_social_media_component "/register/salon" 
test_social_media_component "/register/client"
test_social_media_component "/dashboard/salon/1"

echo -e "\n${MAGENTA}Tests completed at: $(date)${NC}"