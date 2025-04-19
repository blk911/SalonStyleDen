/**
 * Client Form Flow Tracer
 * 
 * This script analyzes the client registration form flow from frontend to backend,
 * tracing the entire path to ensure all connections are intact.
 */

const path = require('path');
const fs = require('fs').promises;

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
const CLIENT_FORM_FILE = path.join(__dirname, 'client', 'src', 'components', 'forms', 'ClientForm.tsx');
const CLIENT_DASHBOARD_FILE = path.join(__dirname, 'client', 'src', 'pages', 'ClientDashboard.tsx');
const ROUTES_FILE = path.join(__dirname, 'server', 'routes.ts');
const STORAGE_FILE = path.join(__dirname, 'server', 'storage.ts');
const SCHEMA_FILE = path.join(__dirname, 'shared', 'schema.ts');
const OUTPUT_FILE = 'client_form_trace_results.md';

// Utility functions
async function logResult(message, success = true) {
  const icon = success ? CHECK : FAIL;
  const color = success ? colors.green : colors.red;
  
  const logMessage = `${color}${icon} ${message}${colors.reset}`;
  console.log(logMessage);
  
  // Also append to output file
  await fs.appendFile(OUTPUT_FILE, `${icon} ${message}\n`);
}

async function logHeader(title) {
  const line = '='.repeat(title.length + 4);
  const message = `\n${line}\n  ${colors.bold}${colors.cyan}${title}${colors.reset}  \n${line}\n`;
  console.log(message);
  
  // Also append to output file
  await fs.appendFile(OUTPUT_FILE, `\n${line}\n  ${title}  \n${line}\n`);
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Tracing functions
async function traceClientFormToBackend() {
  // Initialize output file
  await fs.writeFile(OUTPUT_FILE, `# Client Form Flow Trace Results\n\nGenerated: ${new Date().toISOString()}\n\n`);
  
  console.log(`\n${colors.bold}${colors.magenta}STARTING CLIENT FORM FLOW TRACE${colors.reset}\n`);
  console.log(`${colors.cyan}Results will be saved to ${OUTPUT_FILE}${colors.reset}\n`);
  
  // Step 1: Check for required files
  await logHeader('File Verification');
  
  const requiredFiles = [
    { path: CLIENT_FORM_FILE, name: 'Client Form Component' },
    { path: CLIENT_DASHBOARD_FILE, name: 'Client Dashboard Page' },
    { path: ROUTES_FILE, name: 'API Routes' },
    { path: STORAGE_FILE, name: 'Storage Interface' },
    { path: SCHEMA_FILE, name: 'Data Schema' }
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const exists = await fileExists(file.path);
    await logResult(`${file.name} file exists at ${file.path}`, exists);
    if (!exists) allFilesExist = false;
  }
  
  if (!allFilesExist) {
    await logResult('Missing required files. Cannot continue trace.', false);
    return;
  }
  
  // Step 2: Trace client schema definition
  await logHeader('Schema Definitions');
  
  const schemaContent = await fs.readFile(SCHEMA_FILE, 'utf8');
  
  // Check for client table definition
  const hasClientTable = schemaContent.includes('export const clients =');
  await logResult('Client table defined in schema', hasClientTable);
  
  // Check for sponsor field in client table
  const hasSponsorField = schemaContent.includes('sponsor:') || 
                          schemaContent.includes('sponsorSalonId:');
  await logResult('Sponsor fields defined in client schema', hasSponsorField);
  
  // Check for client type definitions
  const hasClientTypes = schemaContent.includes('export type Client =') || 
                        schemaContent.includes('export type SelectClient =');
  await logResult('Client type definitions exist', hasClientTypes);
  
  // Step 3: Trace client form component
  await logHeader('Client Form Component');
  
  const formContent = await fs.readFile(CLIENT_FORM_FILE, 'utf8');
  
  // Check for form fields
  const formFields = [
    { name: 'name', label: 'Name field' },
    { name: 'phone', label: 'Phone field' },
    { name: 'email', label: 'Email field' },
    { name: 'sponsorSalonId', label: 'Sponsor salon field' }
  ];
  
  for (const field of formFields) {
    const hasField = formContent.includes(`name="${field.name}"`) || 
                     formContent.includes(`field.name === "${field.name}"`);
    await logResult(`${field.label} present in client form`, hasField);
  }
  
  // Check for form submission handler
  const hasSubmitHandler = formContent.includes('onSubmit') && 
                          (formContent.includes('fetch') || 
                           formContent.includes('apiRequest') ||
                           formContent.includes('mutateAsync'));
  await logResult('Form submission handler exists', hasSubmitHandler);
  
  // Check for validation
  const hasValidation = formContent.includes('zodResolver') || 
                       formContent.includes('useForm') ||
                       formContent.includes('errors');
  await logResult('Form validation implemented', hasValidation);
  
  // Step 4: Trace API endpoints
  await logHeader('API Endpoints');
  
  const routesContent = await fs.readFile(ROUTES_FILE, 'utf8');
  
  // Check for client-related endpoints
  const clientEndpoints = [
    { path: '/api/clients', method: 'POST', label: 'Client creation endpoint' },
    { path: '/api/validate-contact', method: 'POST', label: 'Contact validation endpoint' },
    { path: '/api/invitations/validate', method: 'POST', label: 'Invitation validation endpoint' }
  ];
  
  for (const endpoint of clientEndpoints) {
    const pattern = new RegExp(`app\\.${endpoint.method.toLowerCase()}\\s*\\(['"']${endpoint.path}`);
    const hasEndpoint = pattern.test(routesContent);
    await logResult(`${endpoint.label} (${endpoint.method} ${endpoint.path}) exists`, hasEndpoint);
  }
  
  // Step 5: Trace storage implementation
  await logHeader('Storage Implementation');
  
  const storageContent = await fs.readFile(STORAGE_FILE, 'utf8');
  
  // Check for client-related storage methods
  const storageMethods = [
    { name: 'createClient', label: 'Client creation method' },
    { name: 'getClient', label: 'Client retrieval method' },
    { name: 'isDuplicateContact', label: 'Contact validation method' },
    { name: 'getInvitation', label: 'Invitation retrieval method' }
  ];
  
  for (const method of storageMethods) {
    const hasMethod = storageContent.includes(`async ${method.name}`) || 
                     storageContent.includes(`${method.name}:`);
    await logResult(`${method.label} implemented in storage interface`, hasMethod);
  }
  
  // Step 6: Trace client dashboard integration
  await logHeader('Client Dashboard Integration');
  
  const dashboardContent = await fs.readFile(CLIENT_DASHBOARD_FILE, 'utf8');
  
  // Check for client data fetching
  const hasClientFetch = dashboardContent.includes('useQuery') && 
                         dashboardContent.includes('/api/clients');
  await logResult('Client data fetching implemented in dashboard', hasClientFetch);
  
  // Check for sponsor display
  const hasSponsorDisplay = dashboardContent.includes('sponsor') || 
                          dashboardContent.includes('Sponsor:');
  await logResult('Sponsor information displayed in dashboard', hasSponsorDisplay);
  
  // Check for proper layout with reduced padding
  const hasReducedPadding = dashboardContent.includes('py-2') || 
                           dashboardContent.includes('pt-2') ||
                           dashboardContent.includes('pb-2');
  await logResult('Reduced padding implemented in dashboard layout', hasReducedPadding);
  
  // Step 7: Summarize trace results
  await logHeader('Trace Summary');
  
  const allComponentsPresent = hasClientTable && hasSubmitHandler && hasValidation;
  await logResult('All client form components present and connected', allComponentsPresent);
  
  const sponsorshipImplemented = hasSponsorField && hasSponsorDisplay;
  await logResult('Sponsorship attribution fully implemented', sponsorshipImplemented);
  
  console.log(`\n${colors.bold}${colors.magenta}CLIENT FORM FLOW TRACE COMPLETE${colors.reset}`);
  console.log(`${colors.cyan}Full results available in ${OUTPUT_FILE}${colors.reset}\n`);
}

// Run the trace
traceClientFormToBackend().catch(err => {
  console.error(`Trace execution failed:`, err);
});