#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}==========================================${NC}"
echo -e "${PURPLE}    Comprehensive Component Test Suite    ${NC}"
echo -e "${PURPLE}==========================================${NC}"

# Function to run a particular component test and report results
test_component() {
  local component=$1
  local description=$2
  local test_command=$3
  
  echo -e "\n${YELLOW}Testing: ${description}${NC}"
  echo -e "${CYAN}Component: ${component}${NC}"
  echo -e "${CYAN}Command: ${test_command}${NC}"
  
  # Execute the test
  echo -e "\n${CYAN}Running test...${NC}"
  eval "$test_command"
  local status=$?
  
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓ Component test passed${NC}"
  else
    echo -e "${RED}✗ Component test failed with status: ${status}${NC}"
    echo -e "${RED}This component has issues that need to be addressed!${NC}"
  fi
  
  echo -e "${BLUE}------------------------------------------${NC}"
}

# Function to check for console errors related to a specific component
check_component_errors() {
  local component=$1
  local route=$2
  
  echo -e "\n${YELLOW}Checking for frontend errors in: ${component}${NC}"
  
  # Launch Puppeteer to check for console errors
  node -e "
    const puppeteer = require('puppeteer');
    
    (async () => {
      const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Collect all console messages
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      try {
        // Navigate to the page
        await page.goto('http://localhost:5000${route}', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        
        // Wait for a moment to ensure all scripts run
        await page.waitForTimeout(2000);
        
        // Filter for errors
        const errors = consoleMessages.filter(msg => 
          msg.type === 'error' || 
          (msg.type === 'warning' && msg.text.includes('Error'))
        );
        
        if (errors.length > 0) {
          console.error('Errors detected in component:', errors);
          process.exit(1);
        } else {
          console.log('No errors detected in component');
          process.exit(0);
        }
      } catch (error) {
        console.error('Error testing component:', error);
        process.exit(1);
      } finally {
        await browser.close();
      }
    })();
  "
  return $?
}

echo -e "\n${BLUE}=== Testing Navigation Components ===${NC}"
test_component "Navbar" "Main navigation bar rendering" "curl -s http://localhost:5000/ | grep -q 'navbar' && echo 'Navbar found in HTML'"
test_component "Footer" "Footer component rendering" "curl -s http://localhost:5000/ | grep -q 'footer' && echo 'Footer found in HTML'"
test_component "Hero" "Hero component with buttons" "curl -s http://localhost:5000/ | grep -q 'hero' && echo 'Hero found in HTML'"

echo -e "\n${BLUE}=== Testing Form Components ===${NC}"
test_component "ClientForm" "Client registration form fields" "curl -s http://localhost:5000/register/client | grep -q 'form' && echo 'Form found in HTML'"
test_component "SalonForm" "Salon registration form fields" "curl -s http://localhost:5000/register/salon | grep -q 'form' && echo 'Form found in HTML'"
test_component "SocialMediaSelect" "Social media selection component" "curl -s http://localhost:5000/register/salon | grep -q 'social' && echo 'Social media select found in HTML'"

echo -e "\n${BLUE}=== Testing Dashboard Components ===${NC}"
test_component "EditableSalonInfo" "Editable salon information component" "curl -s http://localhost:5000/dashboard/salon | grep -q 'editable' && echo 'Editable component found in HTML'"
test_component "EditableService" "Editable service component" "curl -s http://localhost:5000/dashboard/salon | grep -q 'service' && echo 'Service component found in HTML'"
test_component "EditablePromo" "Editable promotion component" "curl -s http://localhost:5000/dashboard/salon | grep -q 'promo' && echo 'Promo component found in HTML'"
test_component "WeeklySchedule" "Weekly schedule component" "curl -s http://localhost:5000/dashboard/salon | grep -q 'schedule' && echo 'Schedule component found in HTML'"

echo -e "\n${BLUE}=== Testing UI Components for Errors ===${NC}"
# These tests use Puppeteer to check for console errors
check_component_errors "Home Page" "/"
check_component_errors "Client Form" "/register/client"
check_component_errors "Salon Form" "/register/salon"
check_component_errors "Salons Page" "/salons"
check_component_errors "Salon Dashboard" "/dashboard/salon/1"
check_component_errors "Client Dashboard" "/dashboard/client/1"
check_component_errors "Promos Page" "/promos"
check_component_errors "Salon Public Page" "/salon/1"

echo -e "\n${BLUE}=== Testing Social Media Components Specifically ===${NC}"
# This is a specific test for the social media component that's causing errors
test_component "SocialMediaSelect" "Social media dropdown interaction" "
  node -e \"
    const puppeteer = require('puppeteer');
    
    (async () => {
      const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Collect all console messages
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      try {
        // Navigate to the salon registration page
        await page.goto('http://localhost:5000/register/salon', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        
        // Find and click on social media dropdown if it exists
        const hasDropdown = await page.evaluate(() => {
          const dropdowns = Array.from(document.querySelectorAll('select, [role=combobox]'));
          const socialDropdown = dropdowns.find(el => 
            el.id?.includes('social') || 
            el.name?.includes('social') || 
            el.className?.includes('social')
          );
          
          if (socialDropdown) {
            socialDropdown.click();
            return true;
          }
          return false;
        });
        
        if (hasDropdown) {
          // Wait to see if errors appear
          await page.waitForTimeout(1000);
          
          // Check for errors
          const errors = consoleMessages.filter(msg => 
            msg.type === 'error' || 
            (msg.type === 'warning' && msg.text.includes('Error'))
          );
          
          if (errors.length > 0) {
            console.error('Errors detected in social media component:', errors);
            process.exit(1);
          } else {
            console.log('Social media component works without errors');
            process.exit(0);
          }
        } else {
          console.log('Could not find social media dropdown to test');
          process.exit(0);
        }
      } catch (error) {
        console.error('Error testing social media component:', error);
        process.exit(1);
      } finally {
        await browser.close();
      }
    })();
  \"
"

echo -e "\n${PURPLE}Component tests completed at: $(date)${NC}"
echo -e "${PURPLE}Review any failed tests to identify components that need fixing${NC}"