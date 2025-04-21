#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}==========================================${NC}"
echo -e "${PURPLE}     Ven Me, Baby! Complete Test Suite    ${NC}"
echo -e "${PURPLE}==========================================${NC}"

echo -e "\n${BLUE}Installing required dependencies for tests...${NC}"
npm install -g playwright@latest
npm install pg assert
npm install -g playwright@latest

echo -e "\n${BLUE}Running API and Server Tests...${NC}"
chmod +x ./test-app.sh
./test-app.sh

echo -e "\n${BLUE}Running Database Schema and Data Tests...${NC}"
node test-database.js

echo -e "\n${BLUE}Running UI Component and Integration Tests...${NC}"
node test-components.js

echo -e "\n${GREEN}All tests completed!${NC}"
echo -e "${YELLOW}Review the results above to check for any failures.${NC}"