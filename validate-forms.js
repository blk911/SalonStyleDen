#!/usr/bin/env node

/**
 * Form Validator - VMB Error Tracing Utility
 * 
 * This utility specifically analyzes form elements and their connections
 * to backend endpoints in the Ven Me, Baby! application.
 * It checks for proper validation, error handling, and API connections.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const APP_ROOT = '.';
const CLIENT_SRC = path.join(APP_ROOT, 'client/src');
const SERVER_SRC = path.join(APP_ROOT, 'server');
const SHARED_SRC = path.join(APP_ROOT, 'shared');
const OUTPUT_FILE = path.join(APP_ROOT, 'logs/error-tracing/form-validation-results.log');

// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

// Form components to analyze
const FORM_COMPONENTS = [
  {
    name: 'Client Registration Form',
    file: 'client/src/pages/ClientForm.tsx',
    endpoint: '/api/clients',
    method: 'POST',
    requiredFields: ['name', 'email', 'phone'],
  },
  {
    name: 'Salon Registration Form',
    file: 'client/src/pages/SalonForm.tsx',
    endpoint: '/api/salons',
    method: 'POST',
    requiredFields: ['name', 'ownerName', 'email', 'phone'],
  },
  {
    name: 'Client Invitation Form',
    file: 'client/src/components/InvitationForm.tsx',
    endpoint: '/api/invitations',
    method: 'POST',
    requiredFields: ['name', 'email', 'phone', 'salonId'],
  },
  {
    name: 'Style Selection Form',
    file: 'client/src/components/StyleSelectionForm.tsx',
    endpoint: '/api/style-selections',
    method: 'POST',
    requiredFields: ['clientId', 'styleOptions'],
  },
];

// Results tracking
const formResults = [];

async function main() {
  console.log(`${CYAN}=== Ven Me, Baby! Form Validation ====${RESET}`);
  console.log(`Analyzing forms and their connections to endpoints...`);
  
  try {
    await ensureDirectoryExists(path.dirname(OUTPUT_FILE));
    
    // Analyze each form component
    for (const form of FORM_COMPONENTS) {
      await analyzeForm(form);
    }
    
    // Generate report
    await generateReport();
    
    console.log(`\n${GREEN}✓ Form validation analysis complete!${RESET}`);
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

async function analyzeForm(formConfig) {
  console.log(`\n${BLUE}Analyzing ${formConfig.name}...${RESET}`);
  
  const result = {
    name: formConfig.name,
    file: formConfig.file,
    endpoint: formConfig.endpoint,
    method: formConfig.method,
    issues: [],
    checks: [],
  };
  
  try {
    // Check if form file exists
    if (!(await fileExists(formConfig.file))) {
      result.issues.push(`Form file not found: ${formConfig.file}`);
      formResults.push(result);
      return;
    }
    
    // Read form file content
    const formContent = await fs.readFile(formConfig.file, 'utf8');
    
    // Check for form structure
    checkFormStructure(formContent, formConfig, result);
    
    // Check for form validation
    checkFormValidation(formContent, formConfig, result);
    
    // Check if the form connects to the correct endpoint
    checkEndpointConnection(formContent, formConfig, result);
    
    // Verify endpoint implementation in server routes
    await verifyEndpointImplementation(formConfig, result);
    
  } catch (error) {
    result.issues.push(`Error analyzing form: ${error.message}`);
  }
  
  formResults.push(result);
}

function checkFormStructure(content, formConfig, result) {
  // Check for form component
  if (!content.includes('useForm') && !content.includes('<Form')) {
    result.issues.push('No form component or useForm hook detected');
  } else {
    result.checks.push('Form component structure found');
  }
  
  // Check for required fields
  for (const field of formConfig.requiredFields) {
    const fieldPattern = new RegExp(`name=['"](${field}|${field}\\[)['"]`);
    if (!fieldPattern.test(content) && !content.includes(`name="${field}"`) && !content.includes(`name='${field}'`)) {
      result.issues.push(`Required field '${field}' not found in form`);
    } else {
      result.checks.push(`Required field '${field}' found`);
    }
  }
  
  // Check for form submission handler
  if (!content.includes('onSubmit') && !content.includes('handleSubmit')) {
    result.issues.push('No form submission handler detected');
  } else {
    result.checks.push('Form submission handler found');
  }
}

function checkFormValidation(content, formConfig, result) {
  // Check for validation with zod or other validation library
  if (!content.includes('zodResolver') && !content.includes('schema.') && !content.includes('validate')) {
    result.issues.push('No form validation detected');
  } else {
    result.checks.push('Form validation found');
  }
  
  // Check for error handling in form
  if (!content.includes('formState.errors') && !content.includes('error') && !content.includes('Error')) {
    result.issues.push('No form error handling detected');
  } else {
    result.checks.push('Form error handling found');
  }
}

function checkEndpointConnection(content, formConfig, result) {
  // Check if the form connects to the expected API endpoint
  const endpointPattern = new RegExp(`['"]${escapeRegExp(formConfig.endpoint)}['"]|['"]${escapeRegExp(formConfig.endpoint.replace(/^\/api\//, ''))}['"]`);
  
  if (!endpointPattern.test(content) && 
      !content.includes(`apiRequest('${formConfig.endpoint}'`) && 
      !content.includes(`fetch('${formConfig.endpoint}'`) &&
      !content.includes(`fetch('/api/${formConfig.endpoint.replace(/^\/api\//, '')}'`)) {
    result.issues.push(`Form does not connect to expected endpoint: ${formConfig.endpoint}`);
  } else {
    result.checks.push(`Form connects to expected endpoint: ${formConfig.endpoint}`);
  }
  
  // Check for the correct HTTP method
  if (!content.includes(`method: '${formConfig.method}'`) && 
      !content.includes(`method: "${formConfig.method}"`) &&
      !content.includes(`.${formConfig.method.toLowerCase()}(`)) {
    result.issues.push(`Form does not use expected HTTP method: ${formConfig.method}`);
  } else {
    result.checks.push(`Form uses expected HTTP method: ${formConfig.method}`);
  }
}

async function verifyEndpointImplementation(formConfig, result) {
  // Check if the expected endpoint is implemented in server routes
  const routesFile = path.join(SERVER_SRC, 'routes.ts');
  
  if (!(await fileExists(routesFile))) {
    result.issues.push('Server routes file not found');
    return;
  }
  
  const routesContent = await fs.readFile(routesFile, 'utf8');
  const methodLower = formConfig.method.toLowerCase();
  const endpointPattern = new RegExp(`app\\.${methodLower}\\(['"]${escapeRegExp(formConfig.endpoint)}['"]`);
  
  if (!endpointPattern.test(routesContent)) {
    result.issues.push(`Endpoint ${formConfig.method} ${formConfig.endpoint} not implemented in server routes`);
  } else {
    result.checks.push(`Endpoint ${formConfig.method} ${formConfig.endpoint} implemented in server routes`);
    
    // Check if the endpoint implementation uses proper error handling
    const endpointImplementationPattern = new RegExp(`app\\.${methodLower}\\(['"]${escapeRegExp(formConfig.endpoint)}['"].*?\\{([\\s\\S]*?)\\}\\);`, 's');
    const match = endpointImplementationPattern.exec(routesContent);
    
    if (match) {
      const implementationCode = match[1];
      
      if (!implementationCode.includes('try') || !implementationCode.includes('catch')) {
        result.issues.push(`Endpoint implementation lacks proper error handling`);
      } else {
        result.checks.push(`Endpoint implementation has proper error handling`);
      }
    }
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  console.log(`\n${BLUE}Generating form validation report...${RESET}`);
  
  let report = `Ven Me, Baby! Form Validation Report\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `===========================================\n\n`;
  
  // Add summary
  report += `SUMMARY:\n`;
  let totalForms = formResults.length;
  let formsWithIssues = formResults.filter(r => r.issues.length > 0).length;
  
  report += `  Forms analyzed: ${totalForms}\n`;
  report += `  Forms with issues: ${formsWithIssues}\n`;
  report += `  Forms without issues: ${totalForms - formsWithIssues}\n\n`;
  
  // Add detailed results by form
  for (const form of formResults) {
    report += `${form.name}\n`;
    report += `------------------------------------------\n`;
    report += `  File: ${form.file}\n`;
    report += `  Endpoint: ${form.method} ${form.endpoint}\n\n`;
    
    if (form.issues.length > 0) {
      report += `  ISSUES:\n`;
      form.issues.forEach((issue, index) => {
        report += `    [✗] ${issue}\n`;
      });
      report += `\n`;
    }
    
    if (form.checks.length > 0) {
      report += `  PASSED CHECKS:\n`;
      form.checks.forEach((check, index) => {
        report += `    [✓] ${check}\n`;
      });
    }
    
    report += `\n`;
  }
  
  await fs.writeFile(OUTPUT_FILE, report);
}

// Start the analysis
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});