#!/bin/bash

# Test script for all major components
echo "=========================================="
echo "TESTING ALL MAJOR COMPONENTS"
echo "=========================================="
echo "This test will check all major system components:"
echo "1. Server health"
echo "2. Database connection"
echo "3. Salon API endpoints"
echo "4. Client API endpoints"
echo "5. Invitation API endpoints"
echo "6. Style selection API endpoints"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log steps
log_step() {
  echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to log success
log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to log error
log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Create logs directory
mkdir -p ./logs/component-test

# 1. Check server health
log_step "Checking server health..."
HEALTH_RESPONSE=$(curl -s -X GET http://localhost:5000/api/health)
echo "$HEALTH_RESPONSE" > ./logs/component-test/health_response.json

if [[ "$HEALTH_RESPONSE" == *"status"* ]]; then
  log_success "Server is healthy!"
else
  # Try alternate endpoint for API status
  STATUS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/status)
  echo "$STATUS_RESPONSE" > ./logs/component-test/status_response.json
  
  if [[ "$STATUS_RESPONSE" == *"status"* ]]; then
    log_success "Server is healthy! (via status endpoint)"
  else
    log_error "Server health check failed."
    echo "Response from /api/health: $HEALTH_RESPONSE"
    echo "Response from /api/status: $STATUS_RESPONSE"
  fi
fi

# 2. Test database connection
log_step "Testing database connection..."
DB_RESPONSE=$(curl -s -X GET http://localhost:5000/api/status)
echo "$DB_RESPONSE" > ./logs/component-test/db_response.json

if [[ "$DB_RESPONSE" == *"database"*"connected"* ]]; then
  log_success "Database connection successful!"
else
  log_error "Database connection failed."
  echo "$DB_RESPONSE"
fi

# 3. Test salon API endpoints
log_step "Testing salon API endpoints..."

# Get all salons
log_step "Fetching all salons..."
SALONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/salons)
echo "$SALONS_RESPONSE" > ./logs/component-test/salons_response.json

if [[ "$SALONS_RESPONSE" == *"["* ]]; then
  log_success "Salons API endpoint working!"
  SALON_COUNT=$(echo "$SALONS_RESPONSE" | grep -o '"id"' | wc -l)
  log_success "Retrieved $SALON_COUNT salons."
else
  log_error "Salons API endpoint failed."
  echo "$SALONS_RESPONSE"
fi

# Get specific salon (ID 1)
log_step "Fetching salon ID 1..."
SALON_RESPONSE=$(curl -s -X GET http://localhost:5000/api/salons/1)
echo "$SALON_RESPONSE" > ./logs/component-test/salon_response.json

if [[ "$SALON_RESPONSE" == *"id"*"1"* ]]; then
  log_success "Salon detail API endpoint working!"
  SALON_NAME=$(echo "$SALON_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  log_success "Retrieved salon: $SALON_NAME"
else
  log_error "Salon detail API endpoint failed."
  echo "$SALON_RESPONSE"
fi

# 4. Test client API endpoints
log_step "Testing client API endpoints..."

# Get all clients
log_step "Fetching all clients..."
CLIENTS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/clients)
echo "$CLIENTS_RESPONSE" > ./logs/component-test/clients_response.json

if [[ "$CLIENTS_RESPONSE" == *"["* ]]; then
  log_success "Clients API endpoint working!"
  CLIENT_COUNT=$(echo "$CLIENTS_RESPONSE" | grep -o '"id"' | wc -l)
  log_success "Retrieved $CLIENT_COUNT clients."
else
  log_error "Clients API endpoint failed."
  echo "$CLIENTS_RESPONSE"
fi

# Get specific client (ID 1)
log_step "Fetching client ID 1..."
CLIENT_RESPONSE=$(curl -s -X GET http://localhost:5000/api/clients/1)
echo "$CLIENT_RESPONSE" > ./logs/component-test/client_response.json

if [[ "$CLIENT_RESPONSE" == *"id"*"1"* ]]; then
  log_success "Client detail API endpoint working!"
  CLIENT_NAME=$(echo "$CLIENT_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  log_success "Retrieved client: $CLIENT_NAME"
else
  log_error "Client detail API endpoint failed."
  echo "$CLIENT_RESPONSE"
fi

# 5. Test invitation API endpoints
log_step "Testing invitation API endpoints..."

# Get all invitations
log_step "Fetching recent invitations..."
INVITATIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/invitations)
echo "$INVITATIONS_RESPONSE" > ./logs/component-test/invitations_response.json

if [[ "$INVITATIONS_RESPONSE" == *"["* ]]; then
  log_success "Invitations API endpoint working!"
  INVITATION_COUNT=$(echo "$INVITATIONS_RESPONSE" | grep -o '"id"' | wc -l)
  log_success "Retrieved $INVITATION_COUNT invitations."
else
  log_error "Invitations API endpoint failed."
  echo "$INVITATIONS_RESPONSE"
fi

# Get salon invitations
log_step "Fetching invitations for salon ID 1..."
SALON_INVITATIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/salons/1/invitations)
echo "$SALON_INVITATIONS_RESPONSE" > ./logs/component-test/salon_invitations_response.json

if [[ "$SALON_INVITATIONS_RESPONSE" == *"["* ]]; then
  log_success "Salon invitations API endpoint working!"
  SALON_INVITATION_COUNT=$(echo "$SALON_INVITATIONS_RESPONSE" | grep -o '"id"' | wc -l)
  log_success "Retrieved $SALON_INVITATION_COUNT invitations for salon ID 1."
else
  log_error "Salon invitations API endpoint failed."
  echo "$SALON_INVITATIONS_RESPONSE"
fi

# 6. Test style selection API endpoints
log_step "Testing style selection API endpoints..."

# Get client style selections
log_step "Fetching style selections for client ID 1..."
STYLE_SELECTIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/clients/1/style-selections)
echo "$STYLE_SELECTIONS_RESPONSE" > ./logs/component-test/style_selections_response.json

if [[ "$STYLE_SELECTIONS_RESPONSE" == *"["* ]]; then
  log_success "Style selections API endpoint working!"
  SELECTION_COUNT=$(echo "$STYLE_SELECTIONS_RESPONSE" | grep -o '"id"' | wc -l)
  log_success "Retrieved $SELECTION_COUNT style selections for client ID 1."
else
  log_error "Style selections API endpoint failed."
  echo "$STYLE_SELECTIONS_RESPONSE"
fi

# Get salon style selections
log_step "Fetching style selections for salon ID 1..."
SALON_STYLE_SELECTIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/salons/1/style-selections)
echo "$SALON_STYLE_SELECTIONS_RESPONSE" > ./logs/component-test/salon_style_selections_response.json

if [[ "$SALON_STYLE_SELECTIONS_RESPONSE" == *"["* ]]; then
  log_success "Salon style selections API endpoint working!"
  SALON_SELECTION_COUNT=$(echo "$SALON_STYLE_SELECTIONS_RESPONSE" | grep -o '"id"' | wc -l)
  log_success "Retrieved $SALON_SELECTION_COUNT style selections for salon ID 1."
else
  log_error "Salon style selections API endpoint failed."
  echo "$SALON_STYLE_SELECTIONS_RESPONSE"
fi

echo ""
echo "=========================================="
echo "COMPONENT TEST SUMMARY"
echo "=========================================="
echo "All test logs saved to ./logs/component-test/"
echo "=========================================="
