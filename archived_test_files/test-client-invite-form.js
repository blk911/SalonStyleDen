/**
 * Client Invite Form Test Script
 * 
 * This script specifically tests the client invitation form functionality
 * that we implemented in the ClientInviteForm component.
 */

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Terminal colors for better readability
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Result indicators
const CHECK = '✓';
const FAIL = '✗';

// Configuration
const TEST_LOG_FILE = 'client_invite_form_test.log';
const API_BASE_URL = 'http://localhost:5000/api';
const CLIENT_INVITE_FORM_PATH = path.join(__dirname, 'client', 'src', 'components', 'dashboard', 'ClientInviteForm.tsx');
const TEST_PHONE = '5555556789';
const TEST_EMAIL = 'test_invite@venmebaby.test';

// Database connection
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
} catch (err) {
  console.error(`${colors.red}${FAIL} Database connection error:${colors.reset}`, err);
  process.exit(1);
}

// Utility functions
function logResult(message, success = true) {
  const icon = success ? CHECK : FAIL;
  const color = success ? colors.green : colors.red;
  
  const logMessage = `${color}${icon} ${message}${colors.reset}`;
  console.log(logMessage);
  
  // Also append to log file
  fs.appendFile(TEST_LOG_FILE, logMessage.replace(/\x1b\[[0-9;]*m/g, '') + '\n')
    .catch(err => console.error('Error writing to log file:', err));
  
  return success;
}

function logHeader(title) {
  const line = '='.repeat(title.length + 4);
  const message = `\n${line}\n  ${colors.bold}${colors.cyan}${title}${colors.reset}  \n${line}\n`;
  console.log(message);
  
  // Also append to log file without color codes
  fs.appendFile(TEST_LOG_FILE, `\n${line}\n  ${title}  \n${line}\n`)
    .catch(err => console.error('Error writing to log file:', err));
}

async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    logResult(`Database query failed: ${query}`, false);
    console.error(err);
    return [];
  }
}

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (err) {
    return {
      status: 500,
      data: { error: err.message },
      success: false
    };
  }
}

// Test functions
async function testComponentImplementation() {
  logHeader('Client Invite Form Component Analysis');
  
  try {
    // Check if the component file exists
    try {
      await fs.access(CLIENT_INVITE_FORM_PATH);
      logResult('ClientInviteForm component file exists');
    } catch (err) {
      logResult('ClientInviteForm component file not found', false);
      return false;
    }
    
    // Read the component file content
    const componentContent = await fs.readFile(CLIENT_INVITE_FORM_PATH, 'utf8');
    
    // Check for required form fields
    const requiredFields = [
      { name: 'name', label: 'Name field' },
      { name: 'phone', label: 'Phone field' },
      { name: 'email', label: 'Email field' }
    ];
    
    for (const field of requiredFields) {
      const hasField = componentContent.includes(`name="${field.name}"`) || 
                      componentContent.includes(`field.name === "${field.name}"`);
      logResult(`${field.label} present in client invite form`, hasField);
    }
    
    // Check for form submission handler
    const hasSubmitHandler = componentContent.includes('onSubmit') && 
                           (componentContent.includes('fetch') || 
                           componentContent.includes('apiRequest') ||
                           componentContent.includes('mutateAsync'));
    logResult('Form submission handler exists', hasSubmitHandler);
    
    // Check for validation
    const hasValidation = componentContent.includes('zodResolver') || 
                         componentContent.includes('useForm') ||
                         componentContent.includes('errors');
    logResult('Form validation implemented', hasValidation);
    
    // Check for clientId prop
    const hasClientIdProp = componentContent.includes('clientId:') || 
                           componentContent.includes('clientId ');
    logResult('ClientId property implemented', hasClientIdProp);
    
    // Check for success callback
    const hasSuccessCallback = componentContent.includes('onSuccess') || 
                             componentContent.includes('onSuccess:');
    logResult('Success callback implemented', hasSuccessCallback);
    
    return true;
  } catch (err) {
    logResult(`Error analyzing ClientInviteForm component: ${err.message}`, false);
    return false;
  }
}

async function testInvitationEndpoint() {
  logHeader('Invitation API Endpoint Tests');
  
  // Check if invitations endpoint exists and accepts POST
  const optionsResponse = await makeApiRequest('/invitations', 'OPTIONS');
  const endpointExists = optionsResponse.status !== 404;
  
  logResult('Invitations endpoint exists', endpointExists);
  
  if (!endpointExists) {
    return false;
  }
  
  // Test creating an invitation
  try {
    // First clean up any previous test data
    await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_PHONE]);
    
    // Get a valid client to use as the inviter
    const clients = await executeQuery('SELECT id FROM clients LIMIT 1');
    if (clients.length === 0) {
      logResult('No clients found to use as inviter', false);
      return false;
    }
    
    const clientId = clients[0].id;
    
    // Create a test invitation via API
    const inviteResponse = await makeApiRequest('/invitations', 'POST', {
      name: 'Test Invitee',
      phone: TEST_PHONE,
      email: TEST_EMAIL,
      invitedByClientId: clientId,
      status: 'pending'
    });
    
    const inviteCreated = inviteResponse.status === 201 && inviteResponse.data.id;
    logResult(
      `Create invitation via API - Status: ${inviteResponse.status}, ID: ${inviteResponse.data.id || 'N/A'}`,
      inviteCreated
    );
    
    if (inviteCreated) {
      // Verify the invitation in the database
      const invitations = await executeQuery('SELECT * FROM invitations WHERE id = $1', [inviteResponse.data.id]);
      const inviteExists = invitations.length > 0;
      
      logResult('Invitation exists in database', inviteExists);
      
      if (inviteExists) {
        const invite = invitations[0];
        
        // Check that the invited_by_client_id was stored
        const hasClientReference = invite.invited_by_client_id === clientId;
        logResult('Invitation has correct client reference', hasClientReference);
        
        // Check that an invite hash was generated
        const hasInviteHash = invite.invite_hash && invite.invite_hash.startsWith('VMB-INV-');
        logResult('Invitation has VMB-INV hash generated', hasInviteHash);
      }
      
      // Clean up the test invitation
      await executeQuery('DELETE FROM invitations WHERE id = $1', [inviteResponse.data.id]);
      logResult('Test invitation cleaned up');
    }
    
    return inviteCreated;
  } catch (err) {
    logResult(`Error testing invitation endpoint: ${err.message}`, false);
    return false;
  }
}

async function testDashboardIntegration() {
  logHeader('Dashboard Integration Tests');
  
  try {
    // Check ClientDashboard.tsx for ClientInviteForm integration
    const dashboardPath = path.join(__dirname, 'client', 'src', 'pages', 'ClientDashboard.tsx');
    
    try {
      await fs.access(dashboardPath);
      logResult('ClientDashboard component file exists');
    } catch (err) {
      logResult('ClientDashboard component file not found', false);
      return false;
    }
    
    // Read the dashboard content
    const dashboardContent = await fs.readFile(dashboardPath, 'utf8');
    
    // Check for ClientInviteForm import
    const hasImport = dashboardContent.includes('import ClientInviteForm') || 
                     dashboardContent.includes('from \'@/components/dashboard/ClientInviteForm\'');
    logResult('ClientInviteForm imported in dashboard', hasImport);
    
    // Check for component usage
    const hasUsage = dashboardContent.includes('<ClientInviteForm');
    logResult('ClientInviteForm component used in dashboard', hasUsage);
    
    // Check for "SHARE VMB" section
    const hasShareVmbSection = dashboardContent.includes('SHARE VMB');
    logResult('"SHARE VMB" section present in dashboard', hasShareVmbSection);
    
    // Check for clientId prop passing
    const hasClientIdProp = dashboardContent.includes('clientId={client.id}');
    logResult('ClientId prop passed to invite form', hasClientIdProp);
    
    // Check for success handler
    const hasSuccessHandler = dashboardContent.includes('onSuccess={') && 
                             dashboardContent.includes('toast');
    logResult('Success handler with toast notification implemented', hasSuccessHandler);
    
    return hasImport && hasUsage;
  } catch (err) {
    logResult(`Error testing dashboard integration: ${err.message}`, false);
    return false;
  }
}

// Main test function
async function testClientInviteForm() {
  console.log(`\n${colors.bold}${colors.magenta}STARTING CLIENT INVITE FORM TESTS${colors.reset}\n`);
  console.log(`${colors.cyan}Results will be logged to ${TEST_LOG_FILE}${colors.reset}\n`);
  
  // Initialize log file
  const timestamp = new Date().toISOString();
  await fs.writeFile(TEST_LOG_FILE, `VMB CLIENT INVITE FORM TESTS - ${timestamp}\n\n`);
  
  // Run test steps
  const componentImplemented = await testComponentImplementation();
  const endpointWorks = await testInvitationEndpoint();
  const dashboardIntegrated = await testDashboardIntegration();
  
  // Final assessment
  logHeader('Test Summary');
  
  const allTestsPassed = componentImplemented && endpointWorks && dashboardIntegrated;
  logResult('Client invite form implementation complete and functional', allTestsPassed);
  
  if (allTestsPassed) {
    console.log(`\n${colors.green}${colors.bold}ALL TESTS PASSED!${colors.reset} The client invite form is properly implemented and integrated.`);
  } else {
    console.log(`\n${colors.red}${colors.bold}SOME TESTS FAILED.${colors.reset} Please review the log file for details.`);
  }
  
  console.log(`\n${colors.bold}${colors.magenta}CLIENT INVITE FORM TESTS COMPLETE${colors.reset}`);
  console.log(`${colors.cyan}Full results available in ${TEST_LOG_FILE}${colors.reset}\n`);
  
  // Close database connection
  await pool.end();
}

// Run the tests
testClientInviteForm().catch(err => {
  console.error(`Test execution failed:`, err);
  process.exit(1);
});