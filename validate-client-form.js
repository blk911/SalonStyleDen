#!/usr/bin/env node

/**
 * Client Form Validator - VMB Error Tracing Utility
 * 
 * This utility specifically analyzes the client registration form
 * shown in the screenshot to identify any issues.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const APP_ROOT = '.';
const CLIENT_SRC = path.join(APP_ROOT, 'client/src');
const OUTPUT_FILE = path.join(APP_ROOT, 'logs/error-tracing/client-form-validation.log');

// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

// Results array to store all findings
const results = {
  issues: [],
  passes: []
};

async function main() {
  console.log(`${CYAN}=== Ven Me, Baby! Client Form Validation ====${RESET}`);
  console.log(`Analyzing client registration form...`);
  
  try {
    await ensureDirectoryExists(path.dirname(OUTPUT_FILE));
    
    // Locate the client form component
    const clientFormFile = await findClientFormFile();
    
    if (!clientFormFile) {
      throw new Error('Client form component not found');
    }
    
    console.log(`\n${BLUE}Found client form component: ${clientFormFile}${RESET}`);
    
    // Analyze the form component
    await analyzeClientForm(clientFormFile);
    
    // Check related endpoints and backend validation
    await checkBackendIntegration();
    
    // Generate report
    await generateReport();
    
    console.log(`\n${GREEN}✓ Client form validation complete!${RESET}`);
    console.log(`Report generated at: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error(`${RED}Error during analysis:${RESET}`, error);
    process.exit(1);
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function findClientFormFile() {
  // Look in common locations for the client form
  const possibleLocations = [
    path.join(CLIENT_SRC, 'pages/ClientForm.tsx'),
    path.join(CLIENT_SRC, 'pages/ClientRegistration.tsx'),
    path.join(CLIENT_SRC, 'components/ClientForm.tsx'),
    path.join(CLIENT_SRC, 'components/forms/ClientForm.tsx'),
    path.join(CLIENT_SRC, 'components/ClientRegistration.tsx'),
  ];
  
  for (const location of possibleLocations) {
    if (await fileExists(location)) {
      return location;
    }
  }
  
  // If not found in common locations, search the entire src directory
  return await searchForFile('client/src', file => {
    return file.endsWith('.tsx') && (
      file.includes('ClientForm') || 
      file.includes('ClientRegistration') ||
      file.includes('client-form')
    );
  });
}

async function searchForFile(dir, predicate) {
  try {
    const entries = await fs.readdir(path.join(APP_ROOT, dir), { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const result = await searchForFile(fullPath, predicate);
        if (result) return result;
      } else if (predicate(entry.name)) {
        return path.join(APP_ROOT, fullPath);
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${dir}:`, error.message);
  }
  
  return null;
}

async function analyzeClientForm(filePath) {
  console.log(`\n${BLUE}Analyzing client form component...${RESET}`);
  
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check for various form elements
  const checks = [
    {
      name: 'Form component',
      condition: content.includes('<Form') || content.includes('useForm'),
      message: 'Uses Form component or useForm hook'
    },
    {
      name: 'Email validation',
      condition: content.includes('email') && (
        content.includes('validate') || 
        content.includes('pattern') || 
        content.includes('zodResolver') || 
        content.includes('formState.errors')
      ),
      message: 'Includes email validation'
    },
    {
      name: 'Phone validation',
      condition: content.includes('phone') && (
        content.includes('validate') || 
        content.includes('pattern') || 
        content.includes('zodResolver') || 
        content.includes('formState.errors')
      ),
      message: 'Includes phone validation'
    },
    {
      name: 'Error display',
      condition: content.includes('formState.errors') || 
                content.includes('error') || 
                content.includes('Alert') ||
                content.includes('toast'),
      message: 'Includes error display mechanisms'
    },
    {
      name: 'Salon selection',
      condition: content.includes('salon') && content.includes('select'),
      message: 'Includes salon selection'
    },
    {
      name: 'Form submission',
      condition: content.includes('onSubmit') || content.includes('handleSubmit'),
      message: 'Includes form submission handling'
    },
    {
      name: 'API integration',
      condition: content.includes('fetch') || 
                content.includes('axios') || 
                content.includes('apiRequest') ||
                content.includes('useQuery') ||
                content.includes('useMutation'),
      message: 'Includes API integration'
    },
    {
      name: 'Duplicate email check',
      condition: content.includes('already registered') || 
                content.includes('email exists') ||
                content.includes('duplicate'),
      message: 'Includes duplicate email check message'
    }
  ];
  
  // Run all checks
  for (const check of checks) {
    if (check.condition) {
      console.log(`  ${GREEN}✓${RESET} ${check.name}: ${check.message}`);
      results.passes.push(check.message);
    } else {
      console.log(`  ${RED}✗${RESET} ${check.name}: Missing ${check.message.toLowerCase()}`);
      results.issues.push(`Missing ${check.name.toLowerCase()}`);
    }
  }
  
  // Specific code pattern analysis
  const patterns = [
    {
      name: 'Email validation regex',
      pattern: /pattern\s*:\s*\/(.+?)\/|email\s*:\s*z\.string\(\)\.email\(/,
      message: 'Email validation pattern is present'
    },
    {
      name: 'Form submission handler',
      pattern: /const\s+(?:onSubmit|handleSubmit)\s*=|useForm\(\{[^}]*onSubmit/s,
      message: 'Form submission handler is defined'
    },
    {
      name: 'Error display component',
      pattern: /<FormMessage|<ErrorMessage|<Alert|toast\(/,
      message: 'Error display component is used'
    },
    {
      name: 'Required fields',
      pattern: /required\s*:|\.required\(\)/,
      message: 'Required field validation is present'
    }
  ];
  
  // Run pattern checks
  for (const pattern of patterns) {
    if (pattern.pattern.test(content)) {
      console.log(`  ${GREEN}✓${RESET} ${pattern.name}: ${pattern.message}`);
      results.passes.push(pattern.message);
    } else {
      console.log(`  ${RED}✗${RESET} ${pattern.name}: Missing ${pattern.message.toLowerCase()}`);
      results.issues.push(`Missing ${pattern.name.toLowerCase()}`);
    }
  }
  
  // Check the dialog component for accessibility
  if (content.includes('<Dialog') || content.includes('<AlertDialog')) {
    // Check for dialog title and description
    const hasDialogTitle = content.includes('<DialogTitle') || content.includes('<AlertDialogTitle');
    const hasDialogDescription = content.includes('<DialogDescription') || content.includes('<AlertDialogDescription');
    
    if (!hasDialogTitle) {
      console.log(`  ${RED}✗${RESET} Dialog Accessibility: Missing DialogTitle component`);
      results.issues.push('Missing DialogTitle component for accessibility');
    }
    
    if (!hasDialogDescription) {
      console.log(`  ${YELLOW}!${RESET} Dialog Accessibility: Missing DialogDescription component`);
      results.issues.push('Missing DialogDescription component for accessibility');
    }
  }
  
  // Look for the specific error message from the screenshot
  const hasAlreadyRegisteredMessage = content.includes('already registered') || 
                                     content.includes('This email is already registered');
  
  if (hasAlreadyRegisteredMessage) {
    console.log(`  ${GREEN}✓${RESET} Duplicate Email Message: "This email is already registered" message is present`);
    results.passes.push('Email duplicate check message is present');
  } else {
    console.log(`  ${RED}✗${RESET} Duplicate Email Message: Missing "This email is already registered" message`);
    results.issues.push('Missing duplicate email error message');
  }
  
  // Check for email validation error message
  const hasEmailValidationMessage = content.includes('valid email') || 
                                   content.includes('Please enter a valid email address');
  
  if (hasEmailValidationMessage) {
    console.log(`  ${GREEN}✓${RESET} Email Validation Message: Email validation error message is present`);
    results.passes.push('Email validation error message is present');
  } else {
    console.log(`  ${RED}✗${RESET} Email Validation Message: Missing email validation error message`);
    results.issues.push('Missing email validation error message');
  }
}

async function checkBackendIntegration() {
  console.log(`\n${BLUE}Checking backend integration...${RESET}`);
  
  // Check if the clients API endpoint exists
  const routesFile = path.join(APP_ROOT, 'server/routes.ts');
  
  if (await fileExists(routesFile)) {
    const routesContent = await fs.readFile(routesFile, 'utf8');
    
    // Look for clients POST endpoint
    const hasClientsEndpoint = routesContent.includes('/api/clients') && 
                               routesContent.includes('post(');
    
    if (hasClientsEndpoint) {
      console.log(`  ${GREEN}✓${RESET} API Endpoint: /api/clients POST endpoint exists`);
      results.passes.push('/api/clients POST endpoint exists');
      
      // Check for duplicate email check in the endpoint
      const hasDuplicateCheck = routesContent.includes('duplicate') || 
                                routesContent.includes('already exists') ||
                                routesContent.includes('already registered');
      
      if (hasDuplicateCheck) {
        console.log(`  ${GREEN}✓${RESET} API Validation: Duplicate check in API endpoint exists`);
        results.passes.push('Duplicate email check in API endpoint exists');
      } else {
        console.log(`  ${RED}✗${RESET} API Validation: Missing duplicate check in API endpoint`);
        results.issues.push('Missing duplicate email check in API endpoint');
      }
      
      // Check for error handling in the endpoint
      const hasErrorHandling = (routesContent.includes('try') && routesContent.includes('catch')) ||
                              routesContent.includes('res.status(400)') ||
                              routesContent.includes('res.status(500)');
      
      if (hasErrorHandling) {
        console.log(`  ${GREEN}✓${RESET} API Error Handling: Error handling in API endpoint exists`);
        results.passes.push('Error handling in API endpoint exists');
      } else {
        console.log(`  ${RED}✗${RESET} API Error Handling: Missing error handling in API endpoint`);
        results.issues.push('Missing error handling in API endpoint');
      }
      
    } else {
      console.log(`  ${RED}✗${RESET} API Endpoint: Missing /api/clients POST endpoint`);
      results.issues.push('Missing /api/clients POST endpoint');
    }
    
    // Check for invitations endpoint as an alternative
    const hasInvitationsEndpoint = routesContent.includes('/api/invitations') && 
                                  routesContent.includes('post(');
    
    if (hasInvitationsEndpoint) {
      console.log(`  ${GREEN}✓${RESET} API Endpoint: /api/invitations POST endpoint exists`);
      results.passes.push('/api/invitations POST endpoint exists');
    }
    
  } else {
    console.log(`  ${RED}✗${RESET} Server Routes: routes.ts file not found`);
    results.issues.push('Server routes file not found');
  }
  
  // Check database schema for clients table
  const schemaFile = path.join(APP_ROOT, 'shared/schema.ts');
  
  if (await fileExists(schemaFile)) {
    const schemaContent = await fs.readFile(schemaFile, 'utf8');
    
    // Look for clients table
    const hasClientsTable = schemaContent.includes('clients') && 
                           (schemaContent.includes('pgTable') || schemaContent.includes('sqliteTable'));
    
    if (hasClientsTable) {
      console.log(`  ${GREEN}✓${RESET} Database Schema: clients table exists`);
      results.passes.push('Clients table exists in database schema');
      
      // Check for email field in clients table
      const hasEmailField = schemaContent.includes('email') && 
                           (schemaContent.includes('varchar') || schemaContent.includes('text'));
      
      if (hasEmailField) {
        console.log(`  ${GREEN}✓${RESET} Database Schema: email field exists in clients table`);
        results.passes.push('Email field exists in clients table');
      } else {
        console.log(`  ${RED}✗${RESET} Database Schema: Missing email field in clients table`);
        results.issues.push('Missing email field in clients table');
      }
      
    } else {
      console.log(`  ${RED}✗${RESET} Database Schema: Missing clients table`);
      results.issues.push('Missing clients table in database schema');
    }
    
  } else {
    console.log(`  ${RED}✗${RESET} Database Schema: schema.ts file not found`);
    results.issues.push('Database schema file not found');
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateReport() {
  console.log(`\n${BLUE}Generating client form validation report...${RESET}`);
  
  let report = `Ven Me, Baby! Client Form Validation Report\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `===========================================\n\n`;
  
  // Add summary
  report += `SUMMARY:\n`;
  report += `  Issues found: ${results.issues.length}\n`;
  report += `  Checks passed: ${results.passes.length}\n\n`;
  
  // Add issues
  if (results.issues.length > 0) {
    report += `ISSUES:\n`;
    report += `------------------------------------------\n`;
    for (const issue of results.issues) {
      report += `  [✗] ${issue}\n`;
    }
    report += `\n`;
  }
  
  // Add passed checks
  if (results.passes.length > 0) {
    report += `PASSED CHECKS:\n`;
    report += `------------------------------------------\n`;
    for (const pass of results.passes) {
      report += `  [✓] ${pass}\n`;
    }
    report += `\n`;
  }
  
  // Add recommendations based on issues
  report += `RECOMMENDATIONS:\n`;
  report += `------------------------------------------\n`;
  
  // Add specific recommendations based on identified issues
  const recommendations = new Set();
  
  for (const issue of results.issues) {
    if (issue.includes('DialogTitle')) {
      recommendations.add('Add a DialogTitle component to the error dialog for accessibility.');
    }
    
    if (issue.includes('DialogDescription')) {
      recommendations.add('Add a DialogDescription component to the error dialog for accessibility.');
    }
    
    if (issue.includes('duplicate email error message')) {
      recommendations.add('Add a clear error message for duplicate email: "This email is already registered".');
    }
    
    if (issue.includes('email validation error message')) {
      recommendations.add('Add a validation error message for invalid email format: "Please enter a valid email address".');
    }
    
    if (issue.includes('API endpoint')) {
      recommendations.add('Implement a POST endpoint for /api/clients or /api/invitations to handle form submissions.');
    }
    
    if (issue.includes('error handling in API endpoint')) {
      recommendations.add('Add proper try/catch blocks with appropriate error responses in the API endpoint.');
    }
    
    if (issue.includes('Missing duplicate check')) {
      recommendations.add('Implement duplicate email checking in the backend to prevent duplicate registrations.');
    }
  }
  
  // Add general recommendations
  recommendations.add('Ensure all form fields have proper validation with clear error messages.');
  recommendations.add('Implement proper loading states during form submission.');
  recommendations.add('Add client-side validation before submitting to the server.');
  recommendations.add('Consider using a form library like React Hook Form with Zod for validation.');
  
  // Write recommendations to report
  for (const recommendation of recommendations) {
    report += `  • ${recommendation}\n`;
  }
  
  await fs.writeFile(OUTPUT_FILE, report);
}

// Start the analysis
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});