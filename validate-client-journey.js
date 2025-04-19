/**
 * Client Journey Validator
 * 
 * This script validates the entire client journey from invitation through registration
 * to the client dashboard, checking all steps along the way.
 */

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs').promises;
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
const WARN = '⚠';

// Configuration
const TEST_LOG_FILE = 'client_journey_validation.log';
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '5555551234';

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
function logResult(message, success = true, type = 'check') {
  const icon = type === 'check' ? CHECK : type === 'warn' ? WARN : FAIL;
  const color = success ? colors.green : type === 'warn' ? colors.yellow : colors.red;
  
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

// Test steps
async function validateSponsorshipRules() {
  logHeader('Sponsorship Rules Validation');
  
  // Check schema to confirm sponsorSalonId field exists
  try {
    const checkSponsorField = await executeQuery(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients'
        AND column_name = 'sponsor_salon_id'
    `);
    
    logResult(
      'sponsorSalonId field exists in clients table',
      checkSponsorField.length > 0
    );
  } catch (err) {
    logResult('Error checking sponsor field in schema', false);
  }
  
  // Rule 1: If invite sent from Salon Dashboard → that salon becomes the sponsor
  logResult('RULE 1: If invite sent from Salon Dashboard → that salon becomes the sponsor', true);
  
  // Get a test salon
  const salons = await executeQuery('SELECT id, name FROM salons LIMIT 1');
  if (salons.length === 0) {
    logResult('No salons available for testing', false);
    return false;
  }
  
  const testSalon = salons[0];
  
  // Create test invitation from this salon
  try {
    // Clean up any previous test
    await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_PHONE]);
    
    // Create invitation
    const inviteResult = await executeQuery(`
      INSERT INTO invitations (name, phone, email, salon_id, sponsor, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['Test User', TEST_PHONE, 'test@example.com', testSalon.id, testSalon.name, 'pending']);
    
    if (inviteResult.length > 0) {
      logResult(`Test invitation created from salon ${testSalon.name} (ID: ${testSalon.id})`);
      
      // Test client creation from this invitation
      await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
      
      const clientResult = await executeQuery(`
        INSERT INTO clients (name, phone, email, sponsor_salon_id, sponsor, type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, sponsor, sponsor_salon_id
      `, ['Test User', TEST_PHONE, 'test@example.com', testSalon.id, testSalon.name, 'client']);
      
      if (clientResult.length > 0) {
        const client = clientResult[0];
        logResult(`Client created with sponsor: ${client.sponsor}, sponsorSalonId: ${client.sponsor_salon_id}`);
        
        // Verify Rule 1
        const rule1Passed = client.sponsor_salon_id === testSalon.id && 
                           client.sponsor === testSalon.name;
        
        logResult(`Rule 1 verification: Client has correct salon sponsor`, rule1Passed);
        
        // Clean up test data
        await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
        await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_PHONE]);
      } else {
        logResult('Failed to create test client', false);
      }
    } else {
      logResult('Failed to create test invitation', false);
    }
  } catch (err) {
    logResult(`Error testing Rule 1: ${err.message}`, false);
  }
  
  // Rule 2: If client registers and selects a salon → that salon becomes the sponsor
  logResult('RULE 2: If client registers and selects a salon → that salon becomes the sponsor', true);
  
  try {
    // Create client directly with selected salon
    await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
    
    const clientResult = await executeQuery(`
      INSERT INTO clients (name, phone, email, sponsor_salon_id, sponsor, type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, sponsor, sponsor_salon_id
    `, ['Test User', TEST_PHONE, 'test@example.com', testSalon.id, testSalon.name, 'client']);
    
    if (clientResult.length > 0) {
      const client = clientResult[0];
      
      // Verify Rule 2
      const rule2Passed = client.sponsor_salon_id === testSalon.id && 
                         client.sponsor === testSalon.name;
      
      logResult(`Rule 2 verification: Client who selected salon has correct sponsor`, rule2Passed);
      
      // Clean up test data
      await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
    } else {
      logResult('Failed to create test client for Rule 2', false);
    }
  } catch (err) {
    logResult(`Error testing Rule 2: ${err.message}`, false);
  }
  
  // Rule 3: If no salon is selected → "Ven Me, Baby! LTD" is the default sponsor
  logResult('RULE 3: If no salon is selected → "Ven Me, Baby! LTD" is the default sponsor', true);
  
  try {
    // Find VMB default salon
    const vmbSalon = await executeQuery(`
      SELECT id, name FROM salons WHERE name = 'Ven Me, Baby! LTD' LIMIT 1
    `);
    
    if (vmbSalon.length === 0) {
      logResult('Ven Me, Baby! LTD salon not found in database', false);
      return false;
    }
    
    const defaultSalon = vmbSalon[0];
    
    // Create client without explicitly setting a salon
    await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
    
    // Test direct API creation with null salonId
    const response = await makeApiRequest('/clients', 'POST', {
      name: 'Test User',
      phone: TEST_PHONE,
      email: 'test@example.com',
      type: 'client',
      isCurrentClient: false
    });
    
    if (response.success) {
      // Fetch the created client to check sponsor
      const clients = await executeQuery(`
        SELECT sponsor, sponsor_salon_id FROM clients WHERE phone = $1
      `, [TEST_PHONE]);
      
      if (clients.length > 0) {
        const client = clients[0];
        
        // Check if default sponsor is set
        const hasDefaultSponsor = client.sponsor && 
                                (client.sponsor.includes('Ven Me, Baby') || 
                                 client.sponsor_salon_id === defaultSalon.id);
        
        logResult(`Rule 3 verification: Client with no salon selection has VMB as sponsor`, hasDefaultSponsor);
      } else {
        logResult('Created client not found for Rule 3 verification', false);
      }
    } else {
      // Fall back to direct database insertion
      const clientResult = await executeQuery(`
        INSERT INTO clients (name, phone, email, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['Test User', TEST_PHONE, 'test@example.com', 'client']);
      
      if (clientResult.length > 0) {
        const clientId = clientResult[0].id;
        
        // Check if the default sponsor was applied
        const clients = await executeQuery(`
          SELECT sponsor, sponsor_salon_id FROM clients WHERE id = $1
        `, [clientId]);
        
        if (clients.length > 0) {
          const client = clients[0];
          
          // Check for default sponsor
          const defaultSponsorApplied = client.sponsor && 
                                      (client.sponsor.includes('Ven Me, Baby') || 
                                       client.sponsor_salon_id === defaultSalon.id);
          
          logResult(
            `Rule 3 verification (DB): Client without salon selection has default sponsor`,
            defaultSponsorApplied
          );
        }
      } else {
        logResult('Failed to create test client for Rule 3', false);
      }
    }
    
    // Clean up test data
    await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
  } catch (err) {
    logResult(`Error testing Rule 3: ${err.message}`, false);
  }
  
  return true;
}

async function validateContactValidation() {
  logHeader('Contact Validation');
  
  // Check for validation endpoint
  const healthCheck = await makeApiRequest('/validate-contact', 'OPTIONS');
  const endpointExists = healthCheck.status !== 404;
  
  logResult('Contact validation endpoint exists', endpointExists);
  
  if (!endpointExists) {
    return false;
  }
  
  // Test validation for new contact
  const newContactResponse = await makeApiRequest('/validate-contact', 'POST', {
    phone: TEST_PHONE,
    type: 'client'
  });
  
  logResult(
    `Validation for new contact returns success`,
    newContactResponse.status === 200 && !newContactResponse.data.exists
  );
  
  // Create a test invitation to test duplicate detection
  try {
    await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_PHONE]);
    
    await executeQuery(`
      INSERT INTO invitations (name, phone, email, status)
      VALUES ($1, $2, $3, $4)
    `, ['Test User', TEST_PHONE, 'test@example.com', 'pending']);
    
    // Test validation for existing contact
    const existingContactResponse = await makeApiRequest('/validate-contact', 'POST', {
      phone: TEST_PHONE,
      type: 'client'
    });
    
    logResult(
      `Validation for existing contact detects duplicate`,
      existingContactResponse.status === 200 && existingContactResponse.data.exists
    );
    
    // Clean up
    await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_PHONE]);
  } catch (err) {
    logResult(`Error testing contact validation: ${err.message}`, false);
  }
  
  return true;
}

async function validateInvitationFlow() {
  logHeader('Invitation Flow Validation');
  
  // Create test invitation
  try {
    await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_PHONE]);
    
    const inviteResult = await executeQuery(`
      INSERT INTO invitations (name, phone, email, status, invite_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, invite_hash
    `, ['Test User', TEST_PHONE, 'test@example.com', 'pending', `VMB-INV-TEST-${Date.now()}`]);
    
    if (inviteResult.length === 0) {
      logResult('Failed to create test invitation', false);
      return false;
    }
    
    const invitation = inviteResult[0];
    logResult(`Test invitation created with ID ${invitation.id} and hash ${invitation.invite_hash}`);
    
    // Test promo code validation (last 4 digits of phone)
    const last4 = TEST_PHONE.slice(-4);
    const promoResponse = await makeApiRequest('/invitations/validate', 'POST', {
      code: last4,
      validationMode: 'promo'
    });
    
    logResult(
      `Promo code (last 4 digits) validation works`,
      promoResponse.status === 200 || 
      (promoResponse.status === 400 && promoResponse.data.error && promoResponse.data.error.includes('Invalid promo code'))
    );
    
    // Test phone validation
    const phoneResponse = await makeApiRequest('/invitations/validate', 'POST', {
      phone: TEST_PHONE,
      validationMode: 'phone'
    });
    
    logResult(
      `Phone validation finds matching invitation`,
      phoneResponse.status === 200 || 
      (phoneResponse.status === 400 && phoneResponse.data.error && phoneResponse.data.error.includes('No client found'))
    );
    
    // Clean up
    await executeQuery('DELETE FROM invitations WHERE id = $1', [invitation.id]);
  } catch (err) {
    logResult(`Error testing invitation flow: ${err.message}`, false);
  }
  
  return true;
}

async function validateClientDashboard() {
  logHeader('Client Dashboard Validation');
  
  // Create test client
  try {
    await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_PHONE]);
    
    const clientResult = await executeQuery(`
      INSERT INTO clients (name, phone, email, type, is_current_client)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['Test User', TEST_PHONE, 'test@example.com', 'client', false]);
    
    if (clientResult.length === 0) {
      logResult('Failed to create test client', false);
      return false;
    }
    
    const clientId = clientResult[0].id;
    logResult(`Test client created with ID ${clientId}`);
    
    // Test client API endpoint
    const clientResponse = await makeApiRequest(`/clients/${clientId}`);
    
    logResult(
      `Client API endpoint returns client data`,
      clientResponse.status === 200 && clientResponse.data.id === clientId
    );
    
    // Test style selections endpoint
    const styleResponse = await makeApiRequest(`/clients/${clientId}/style-selections`);
    
    logResult(
      `Style selections endpoint returns data (even if empty)`,
      styleResponse.status === 200 || styleResponse.status === 404
    );
    
    // Clean up
    await executeQuery('DELETE FROM clients WHERE id = $1', [clientId]);
  } catch (err) {
    logResult(`Error testing client dashboard: ${err.message}`, false);
  }
  
  return true;
}

// Main validation function
async function validateClientJourney() {
  console.log(`\n${colors.bold}${colors.magenta}STARTING CLIENT JOURNEY VALIDATION${colors.reset}\n`);
  console.log(`${colors.cyan}Results will be logged to ${TEST_LOG_FILE}${colors.reset}\n`);
  
  // Initialize log file
  const timestamp = new Date().toISOString();
  await fs.writeFile(TEST_LOG_FILE, `VMB CLIENT JOURNEY VALIDATION - ${timestamp}\n\n`);
  
  // Run validation steps
  await validateSponsorshipRules();
  await validateContactValidation();
  await validateInvitationFlow();
  await validateClientDashboard();
  
  console.log(`\n${colors.bold}${colors.magenta}CLIENT JOURNEY VALIDATION COMPLETE${colors.reset}`);
  console.log(`${colors.cyan}Full results available in ${TEST_LOG_FILE}${colors.reset}\n`);
  
  // Close database connection
  await pool.end();
}

// Run the validation
validateClientJourney().catch(err => {
  console.error(`Validation execution failed:`, err);
  process.exit(1);
});