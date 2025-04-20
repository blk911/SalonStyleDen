/**
 * Client Invite Form Test Runner (CommonJS version)
 * 
 * This script verifies our ClientInviteForm implementation.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_LOG_FILE = 'client_form_test_results.log';

// Clear previous log file
if (fs.existsSync(TEST_LOG_FILE)) {
  fs.unlinkSync(TEST_LOG_FILE);
}

console.log('\n=== STARTING CLIENT FORM TEST ===\n');

// Utility to append to log file
function log(message) {
  console.log(message);
  fs.appendFileSync(TEST_LOG_FILE, message + '\n');
}

// Test the client form
function testClientForm() {
  return new Promise((resolve) => {
    // Step 1: Check if ClientInviteForm component exists
    const clientInviteFormPath = path.join(__dirname, 'client', 'src', 'components', 'dashboard', 'ClientInviteForm.tsx');
    
    if (fs.existsSync(clientInviteFormPath)) {
      log('✓ ClientInviteForm component file exists');
      
      // Step 2: Check if component is imported in ClientDashboard
      const clientDashboardPath = path.join(__dirname, 'client', 'src', 'pages', 'ClientDashboard.tsx');
      const dashboardContent = fs.readFileSync(clientDashboardPath, 'utf8');
      
      if (dashboardContent.includes('import ClientInviteForm')) {
        log('✓ ClientInviteForm component is imported in ClientDashboard');
      } else {
        log('✗ ClientInviteForm component is NOT imported in ClientDashboard');
      }
      
      // Step 3: Check if "SHARE VMB" section exists in dashboard
      if (dashboardContent.includes('SHARE VMB')) {
        log('✓ "SHARE VMB" section exists in ClientDashboard');
      } else {
        log('✗ "SHARE VMB" section is missing in ClientDashboard');
      }
      
      // Step 4: Check form fields in ClientInviteForm
      const formContent = fs.readFileSync(clientInviteFormPath, 'utf8');
      const requiredFields = ['name', 'phone', 'email'];
      
      for (const field of requiredFields) {
        if (formContent.includes(`name="${field}"`)) {
          log(`✓ ${field} field exists in ClientInviteForm`);
        } else {
          log(`✗ ${field} field is missing in ClientInviteForm`);
        }
      }
      
      // Step 5: Check for client ID prop
      if (formContent.includes('clientId:') || formContent.includes('clientId ')) {
        log('✓ clientId prop is implemented in ClientInviteForm');
      } else {
        log('✗ clientId prop is missing in ClientInviteForm');
      }
      
      // Step 6: Check for form submission
      if (formContent.includes('onSubmit') && (formContent.includes('fetch') || formContent.includes('apiRequest'))) {
        log('✓ Form submission is implemented in ClientInviteForm');
      } else {
        log('✗ Form submission is missing in ClientInviteForm');
      }
    } else {
      log('✗ ClientInviteForm component file does not exist');
    }
    
    resolve();
  });
}

// Run the tests
testClientForm().then(() => {
  console.log('\n=== CLIENT FORM TEST COMPLETE ===\n');
  console.log(`Results saved to ${TEST_LOG_FILE}\n`);
});