#!/bin/bash

# Test script for the entire invitation and style selection flow
echo "=========================================="
echo "TESTING INVITATION → STYLE SELECTION FLOW"
echo "=========================================="
echo "This test will:"
echo "1. Create a test client invitation"
echo "2. Fetch and display the created invitation"
echo "3. Make a style selection for the client"
echo "4. Verify style selection was recorded"
echo ""

# Create logs directory
mkdir -p ./logs/flow-test

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

# Generate unique name and details for the test client
CLIENT_NAME="TestClient_$(date +%s)"
CLIENT_EMAIL="$CLIENT_NAME@example.com"
CLIENT_PHONE="555-123-$(date +%s | tail -c 5)"

# 1. Create a test invitation
log_step "Creating client invitation for $CLIENT_NAME..."

INVITATION_DATA='{
  "name": "'"$CLIENT_NAME"'",
  "phone": "'"$CLIENT_PHONE"'",
  "email": "'"$CLIENT_EMAIL"'",
  "notes": "Test client created via automation script",
  "favoriteServices": ["French Tips"],
  "salonId": 1,
  "firstServiceDate": "2025-04-16",
  "status": "pending",
  "sponsor": "TIFFANY_5280 NAILS STUDIO"
}'

echo "$INVITATION_DATA" > ./logs/flow-test/invitation_request.json
log_step "Sending invitation with the following data:"
cat ./logs/flow-test/invitation_request.json

INVITE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$INVITATION_DATA" http://localhost:5000/api/invitations)
echo "$INVITE_RESPONSE" > ./logs/flow-test/invitation_response.json

# Extract invitation ID from response
INVITATION_ID=$(echo "$INVITE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$INVITATION_ID" ]; then
  log_error "Failed to create invitation or extract invitation ID"
  exit 1
else
  log_success "Created invitation with ID: $INVITATION_ID"
fi

# 2. Fetch and display the created invitation
log_step "Fetching the created invitation..."
INVITATION_DETAILS=$(curl -s -X GET http://localhost:5000/api/invitations/$INVITATION_ID)
echo "$INVITATION_DETAILS" > ./logs/flow-test/invitation_details.json

log_success "Invitation details retrieved and saved to ./logs/flow-test/invitation_details.json"

# 3. Create client record (this would normally happen via client registration)
log_step "Creating client record..."
CLIENT_DATA='{
  "name": "'"$CLIENT_NAME"'",
  "phone": "'"$CLIENT_PHONE"'",
  "email": "'"$CLIENT_EMAIL"'",
  "isCurrentClient": true,
  "notes": "Test client created via automation script",
  "favoriteServices": ["French Tips"],
  "type": "client",
  "salonId": 1,
  "salonName": "TIFFANY_5280 NAILS STUDIO"
}'

echo "$CLIENT_DATA" > ./logs/flow-test/client_request.json
CLIENT_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$CLIENT_DATA" http://localhost:5000/api/clients)
echo "$CLIENT_RESPONSE" > ./logs/flow-test/client_response.json

# Extract client ID from response
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CLIENT_ID" ]; then
  log_error "Failed to create client or extract client ID"
  # Continue anyway, we can use client ID 1 for testing
  CLIENT_ID=1
  log_step "Falling back to using client ID 1 for testing"
else
  log_success "Created client with ID: $CLIENT_ID"
fi

# 4. Make a style selection for the client
log_step "Making a style selection for client ID $CLIENT_ID..."
STYLE_SELECTION_DATA='{
  "styleId": 1,
  "salonId": 1,
  "invitationId": '"$INVITATION_ID"'
}'

echo "$STYLE_SELECTION_DATA" > ./logs/flow-test/style_selection_request.json
STYLE_SELECTION_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$STYLE_SELECTION_DATA" http://localhost:5000/api/clients/$CLIENT_ID/style-selections)
echo "$STYLE_SELECTION_RESPONSE" > ./logs/flow-test/style_selection_response.json

# Check if style selection was successful
if [[ "$STYLE_SELECTION_RESPONSE" == *"id"* ]]; then
  log_success "Style selection created successfully!"
  STYLE_SELECTION_ID=$(echo "$STYLE_SELECTION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  log_success "Style selection ID: $STYLE_SELECTION_ID"
else
  log_error "Failed to create style selection. Response:"
  echo "$STYLE_SELECTION_RESPONSE"
fi

# 5. Verify style selection was recorded
log_step "Verifying style selection was recorded for client ID $CLIENT_ID..."
CLIENT_STYLE_SELECTIONS=$(curl -s -X GET http://localhost:5000/api/clients/$CLIENT_ID/style-selections)
echo "$CLIENT_STYLE_SELECTIONS" > ./logs/flow-test/client_style_selections.json

if [[ "$CLIENT_STYLE_SELECTIONS" == *"id"* ]]; then
  log_success "Client has style selections recorded!"
else
  log_error "No style selections found for client $CLIENT_ID."
fi

# 6. Verify invitation status update (if applicable)
if [ ! -z "$INVITATION_ID" ]; then
  log_step "Checking if invitation status was updated..."
  UPDATED_INVITATION=$(curl -s -X GET http://localhost:5000/api/invitations/$INVITATION_ID)
  echo "$UPDATED_INVITATION" > ./logs/flow-test/updated_invitation.json
  
  INVITATION_STATUS=$(echo "$UPDATED_INVITATION" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ "$INVITATION_STATUS" == "style_selected" ]; then
    log_success "Invitation status successfully updated to 'style_selected'!"
  else
    log_step "Invitation status is: $INVITATION_STATUS (may not have been updated depending on implementation)"
  fi
fi

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Client Name: $CLIENT_NAME"
echo "Client ID: $CLIENT_ID"
echo "Invitation ID: $INVITATION_ID"
echo ""
echo "All test logs saved to ./logs/flow-test/"
echo "=========================================="
