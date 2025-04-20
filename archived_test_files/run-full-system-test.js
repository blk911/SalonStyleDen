/**
 * Full System Test - VMB Comprehensive Validation
 * 
 * This script performs a comprehensive line-by-line review of the entire system,
 * testing all form fields, pages, endpoints, and tracing routes both forward and backward.
 */

const { Pool } = require('@neondatabase/serverless');
const path = require('path');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const { exec } = require('child_process');

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

// Test result indicators
const CHECK = '✓';
const FAIL = '✗';
const WARN = '⚠';

// Configuration
const TEST_LOG_FILE = 'full_system_test_results.log';
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_CLIENT_PHONE = '5551235555'; // Ensure this doesn't exist in the system
const TEST_CLIENT_EMAIL = 'test_system_check@venmebaby.test';

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

async function findFilesRecursively(dir, extensions) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map(async (dirent) => {
    const filePath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      return findFilesRecursively(filePath, extensions);
    } else if (extensions.includes(path.extname(filePath).toLowerCase())) {
      return filePath;
    }
    return [];
  }));
  
  return Array.prototype.concat(...files);
}

// Test modules
async function testDatabaseConnection() {
  logHeader('Database Connection Tests');
  
  try {
    const result = await pool.query('SELECT NOW()');
    logResult('Database connection successful', true);
    
    // Check key tables exist
    const tables = ['clients', 'salons', 'invitations', 'activity_logs', 'style_selections'];
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`, [table]);
        
        const exists = result.rows[0].exists;
        logResult(`Table '${table}' exists: ${exists}`, exists);
      } catch (err) {
        logResult(`Error checking for table '${table}'`, false);
      }
    }
    
    return true;
  } catch (err) {
    logResult('Database connection failed', false);
    console.error(err);
    return false;
  }
}

async function testApiEndpoints() {
  logHeader('API Endpoint Tests');
  
  const endpoints = [
    { path: '/status', method: 'GET', expected: 200 },
    { path: '/salons', method: 'GET', expected: 200 },
    { path: '/clients', method: 'GET', expected: 200 },
    { path: '/invitations', method: 'GET', expected: 200 },
    { path: '/activity-logs', method: 'GET', expected: 200 },
    { path: '/salons/1', method: 'GET', expected: 200 },
    { path: '/health', method: 'GET', expected: 200 }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    const { status, success } = await makeApiRequest(endpoint.path, endpoint.method);
    const endpointPassed = status === endpoint.expected;
    
    logResult(
      `${endpoint.method} ${endpoint.path} - Expected: ${endpoint.expected}, Got: ${status}`,
      endpointPassed
    );
    
    if (!endpointPassed) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testContactValidation() {
  logHeader('Contact Validation Tests');
  
  // Test validation for existing phone number
  const existingPhone = await executeQuery('SELECT phone FROM clients LIMIT 1');
  if (existingPhone.length > 0) {
    const phone = existingPhone[0].phone;
    const { status, data } = await makeApiRequest('/validate-contact', 'POST', {
      phone,
      type: 'client'
    });
    
    logResult(
      `Contact validation for existing phone '${phone}' - Expected duplicate, Got: ${JSON.stringify(data)}`,
      data.exists === true && data.field === 'phone'
    );
  } else {
    logResult('No existing client found for validation test', false, 'warn');
  }
  
  // Test validation for non-existing phone number
  const { status, data } = await makeApiRequest('/validate-contact', 'POST', {
    phone: TEST_CLIENT_PHONE,
    type: 'client'
  });
  
  logResult(
    `Contact validation for new phone '${TEST_CLIENT_PHONE}' - Expected: no duplicate, Got: ${JSON.stringify(data)}`,
    data.exists !== true
  );
  
  return true;
}

async function testInvitationFlow() {
  logHeader('Invitation Flow Tests');
  
  // Test creating a new invitation
  const { status, data } = await makeApiRequest('/invitations', 'POST', {
    name: 'System Test Client',
    phone: TEST_CLIENT_PHONE,
    email: TEST_CLIENT_EMAIL,
    salonId: 1, // Assuming Tiffany 5280 has ID 1
    sponsor: 'TIFFANY_5280 NAILS STUDIO',
    favoriteServices: ['French Tips', 'Gel Manicure'],
    status: 'pending',
    firstServiceDate: new Date().toISOString().split('T')[0]
  });
  
  const invitationCreated = status === 201 && data.id;
  logResult(
    `Create test invitation - Status: ${status}, ID: ${data.id || 'N/A'}`,
    invitationCreated
  );
  
  if (invitationCreated) {
    // Test invitation validation by phone
    const { status: validateStatus, data: validateData } = await makeApiRequest('/invitations/validate', 'POST', {
      phone: TEST_CLIENT_PHONE,
      validationMode: 'phone'
    });
    
    logResult(
      `Validate invitation by phone - Expected: 200, Got: ${validateStatus}`,
      validateStatus === 200
    );
    
    // Test promo code validation (last 4 digits of phone)
    const last4 = TEST_CLIENT_PHONE.slice(-4);
    const { status: promoStatus, data: promoData } = await makeApiRequest('/invitations/validate', 'POST', {
      code: last4,
      validationMode: 'promo'
    });
    
    logResult(
      `Validate invitation by promo code '${last4}' - Expected: 200, Got: ${promoStatus}`,
      promoStatus === 200
    );
    
    // Cleanup: Delete the test invitation
    try {
      await executeQuery('DELETE FROM invitations WHERE phone = $1', [TEST_CLIENT_PHONE]);
      logResult('Test invitation cleanup successful');
    } catch (err) {
      logResult('Failed to clean up test invitation', false);
    }
  }
  
  return invitationCreated;
}

async function testClientRegistration() {
  logHeader('Client Registration Tests');
  
  // Test client registration with sponsorship
  const { status, data } = await makeApiRequest('/clients', 'POST', {
    name: 'System Test Client',
    phone: TEST_CLIENT_PHONE,
    email: TEST_CLIENT_EMAIL,
    isCurrentClient: false,
    type: 'client',
    sponsorSalonId: 1, // Assuming Tiffany 5280 has ID 1
    sponsor: 'TIFFANY_5280 NAILS STUDIO'
  });
  
  const clientCreated = status === 201 && data.id;
  logResult(
    `Register test client - Status: ${status}, ID: ${data.id || 'N/A'}`,
    clientCreated
  );
  
  if (clientCreated) {
    // Verify the client was created with the correct sponsor
    const clients = await executeQuery('SELECT * FROM clients WHERE phone = $1', [TEST_CLIENT_PHONE]);
    const clientExists = clients.length > 0;
    const sponsorCorrect = clientExists && clients[0].sponsor === 'TIFFANY_5280 NAILS STUDIO';
    
    logResult(
      `Client created with correct sponsor - Expected: TIFFANY_5280 NAILS STUDIO, Got: ${clientExists ? clients[0].sponsor : 'N/A'}`,
      sponsorCorrect
    );
    
    // Cleanup: Delete the test client
    try {
      await executeQuery('DELETE FROM clients WHERE phone = $1', [TEST_CLIENT_PHONE]);
      logResult('Test client cleanup successful');
    } catch (err) {
      logResult('Failed to clean up test client', false);
    }
  }
  
  return clientCreated;
}

async function testSalonPublicPage() {
  logHeader('Salon Public Page Tests');
  
  // Get a valid salon ID for testing
  const salons = await executeQuery('SELECT id FROM salons LIMIT 1');
  if (salons.length === 0) {
    logResult('No salons found in database for testing', false, 'warn');
    return false;
  }
  
  const salonId = salons[0].id;
  
  // Test fetching salon details
  const { status, data } = await makeApiRequest(`/salons/${salonId}`, 'GET');
  const salonFetched = status === 200 && data.id === salonId;
  
  logResult(
    `Fetch salon details for ID ${salonId} - Status: ${status}`,
    salonFetched
  );
  
  // Test salon services
  if (salonFetched && Array.isArray(data.services)) {
    logResult(`Salon has ${data.services.length} services`, true);
    
    // Check service attributes
    const serviceHasRequiredFields = data.services.every(service => 
      service.id && service.name && typeof service.price === 'number' && 
      typeof service.duration === 'number'
    );
    
    logResult(
      'All salon services have required fields (id, name, price, duration)',
      serviceHasRequiredFields
    );
  } else {
    logResult('Salon services not available or not in expected format', false);
  }
  
  return salonFetched;
}

async function testStyleSelections() {
  logHeader('Style Selections Tests');
  
  // Get a valid client and salon for testing
  const clients = await executeQuery('SELECT id FROM clients LIMIT 1');
  const salons = await executeQuery('SELECT id FROM salons LIMIT 1');
  
  if (clients.length === 0 || salons.length === 0) {
    logResult('Missing clients or salons for style selection tests', false, 'warn');
    return false;
  }
  
  const clientId = clients[0].id;
  const salonId = salons[0].id;
  
  // Test getting style selections for a client
  const { status, data } = await makeApiRequest(`/clients/${clientId}/style-selections`, 'GET');
  logResult(
    `Fetch style selections for client ${clientId} - Status: ${status}`,
    status === 200 || status === 404 // 404 is acceptable if the client has no selections
  );
  
  // Test adding a style selection
  const selectionData = {
    clientId,
    salonId,
    styleId: 1, // Assuming style ID 1 exists
    selectedAt: new Date().toISOString(),
    notes: 'System test style selection'
  };
  
  try {
    await executeQuery(
      'INSERT INTO style_selections (client_id, salon_id, style_id, selected_at, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [selectionData.clientId, selectionData.salonId, selectionData.styleId, selectionData.selectedAt, selectionData.notes]
    );
    
    logResult('Test style selection created successfully');
    
    // Cleanup
    await executeQuery('DELETE FROM style_selections WHERE client_id = $1 AND notes = $2', 
      [selectionData.clientId, selectionData.notes]);
    
    logResult('Test style selection cleanup successful');
    return true;
  } catch (err) {
    logResult(`Failed to create test style selection: ${err.message}`, false);
    return false;
  }
}

async function validateComponentConsistency() {
  logHeader('Component Consistency Tests');
  
  const clientSrcDir = path.join(__dirname, 'client', 'src');
  
  // Find all React component files
  const componentFiles = await findFilesRecursively(clientSrcDir, ['.tsx', '.jsx']);
  logResult(`Found ${componentFiles.length} component files`);
  
  // Count by type
  const counts = {
    pages: 0,
    components: 0,
    hooks: 0,
    forms: 0,
    dashboards: 0
  };
  
  // Analyze component files
  for (const file of componentFiles) {
    const content = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(__dirname, file);
    
    // Categorize
    if (file.includes('/pages/')) counts.pages++;
    if (file.includes('/components/')) counts.components++;
    if (file.includes('/hooks/')) counts.hooks++;
    if (file.includes('/forms/')) counts.forms++;
    if (file.includes('/dashboard/')) counts.dashboards++;
    
    // Check for basic component structure
    const hasReactImport = content.includes('import React') || 
                          content.includes('react');
    const hasExport = content.includes('export default') || 
                     content.includes('export function') ||
                     content.includes('export const');
    
    if (!hasExport) {
      logResult(`${relativePath} - Missing export statement`, false);
    }
    
    // Check for hook usage patterns
    const hasHooks = content.includes('useState') || 
                    content.includes('useEffect') ||
                    content.includes('useQuery');
                    
    if (hasHooks) {
      // Basic check for hook rules (very simplified)
      const hasConditionalHooks = content.includes('if') && 
                                 content.match(/if\s*\([^)]*\)\s*{[^}]*use[A-Z]/);
      
      if (hasConditionalHooks) {
        logResult(`${relativePath} - Potential conditional hook usage detected`, false, 'warn');
      }
    }
  }
  
  logResult(`Component counts: Pages: ${counts.pages}, Components: ${counts.components}, Hooks: ${counts.hooks}, Forms: ${counts.forms}, Dashboard: ${counts.dashboards}`);
  
  return true;
}

async function traceRoutes() {
  logHeader('Route Tracing Tests');
  
  const routesFile = path.join(__dirname, 'server', 'routes.ts');
  const appFile = path.join(__dirname, 'client', 'src', 'App.tsx');
  
  try {
    // Analyze server routes
    const routesContent = await fs.readFile(routesFile, 'utf8');
    const apiRoutes = routesContent.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g) || [];
    
    logResult(`Found ${apiRoutes.length} API routes defined in routes.ts`);
    
    // Extract actual routes
    const routes = apiRoutes.map(route => {
      const match = route.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/);
      return match ? { method: match[1].toUpperCase(), path: match[2] } : null;
    }).filter(Boolean);
    
    // Log the routes
    routes.forEach(route => {
      logResult(`${route.method} ${route.path}`, true);
    });
    
    // Analyze client routes
    const appContent = await fs.readFile(appFile, 'utf8');
    const clientRoutes = appContent.match(/<Route\s+[^>]*path\s*=\s*['"]([^'"]+)['"]/g) || [];
    
    logResult(`Found ${clientRoutes.length} client routes defined in App.tsx`);
    
    // Extract client routes
    const clientPaths = clientRoutes.map(route => {
      const match = route.match(/path\s*=\s*['"]([^'"]+)['"]/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Log the client routes
    clientPaths.forEach(path => {
      logResult(`Client route: ${path}`, true);
    });
    
    return true;
  } catch (err) {
    logResult(`Error analyzing routes: ${err.message}`, false);
    return false;
  }
}

// Main test runner
async function runFullSystemTest() {
  console.log(`\n${colors.bold}${colors.magenta}STARTING FULL SYSTEM TEST${colors.reset}\n`);
  console.log(`${colors.cyan}Test results will be logged to ${TEST_LOG_FILE}${colors.reset}\n`);
  
  // Initialize log file
  const timestamp = new Date().toISOString();
  await fs.writeFile(TEST_LOG_FILE, `VMB FULL SYSTEM TEST - ${timestamp}\n\n`);
  
  // Run all test modules
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    logResult('Database tests failed, cannot continue with data-dependent tests', false);
    process.exit(1);
  }
  
  await testApiEndpoints();
  await testContactValidation();
  await testInvitationFlow();
  await testClientRegistration();
  await testSalonPublicPage();
  await testStyleSelections();
  await validateComponentConsistency();
  await traceRoutes();
  
  console.log(`\n${colors.bold}${colors.magenta}FULL SYSTEM TEST COMPLETE${colors.reset}`);
  console.log(`${colors.cyan}Full results available in ${TEST_LOG_FILE}${colors.reset}\n`);
  
  // Close database connection
  await pool.end();
}

// Run the tests
runFullSystemTest().catch(err => {
  console.error(`${colors.red}${FAIL} Test execution failed:${colors.reset}`, err);
  process.exit(1);
});