/**
 * VMB Full System Line-by-Line Review
 * 
 * This master script performs a comprehensive validation of the entire system,
 * running all test suites and generating a consolidated report.
 */

import * as fs from 'fs/promises';
import { exec as execCallback } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promise-based exec
const exec = (command) => {
  return new Promise((resolve, reject) => {
    execCallback(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

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
const MASTER_REPORT_FILE = 'vmb_full_system_validation_report.md';
const TEST_SCRIPTS = [
  { name: 'Full System Test', script: 'run-full-system-test.js', outputFile: 'full_system_test_results.log' },
  { name: 'Client Form Flow Trace', script: 'trace-client-form-flow.js', outputFile: 'client_form_trace_results.md' },
  { name: 'Client Journey Validation', script: 'validate-client-journey.js', outputFile: 'client_journey_validation.log' },
  { name: 'Client Invite Form Test', script: 'test-client-invite-form.js', outputFile: 'client_invite_form_test.log' }
];

// Utility functions
function logMessage(message, type = 'info') {
  let color;
  let prefix;
  
  switch (type) {
    case 'success':
      color = colors.green;
      prefix = `${CHECK} `;
      break;
    case 'error':
      color = colors.red;
      prefix = `${FAIL} `;
      break;
    case 'warning':
      color = colors.yellow;
      prefix = '⚠ ';
      break;
    case 'info':
    default:
      color = colors.blue;
      prefix = 'ℹ ';
      break;
  }
  
  console.log(`${color}${prefix}${message}${colors.reset}`);
}

function logHeader(title) {
  const line = '='.repeat(title.length + 4);
  console.log(`\n${colors.bold}${colors.magenta}${line}${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}  ${title}  ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}${line}${colors.reset}\n`);
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function runTestScript(script) {
  logMessage(`Running ${script.name}...`, 'info');
  
  try {
    const scriptPath = path.join(__dirname, script.script);
    const { stdout, stderr } = await executeCommand(`node ${scriptPath}`);
    
    if (stderr) {
      logMessage(`Warnings/errors from ${script.name}:`, 'warning');
      console.log(stderr);
    }
    
    logMessage(`${script.name} completed successfully`, 'success');
    return true;
  } catch (err) {
    logMessage(`${script.name} failed to run properly`, 'error');
    console.error(err.stderr || err.error);
    return false;
  }
}

async function generateMasterReport() {
  logHeader('Generating Master Report');
  
  const timestamp = new Date().toISOString();
  let reportContent = `# VMB Full System Validation Report\n\n`;
  reportContent += `Generated: ${timestamp}\n\n`;
  reportContent += `## Test Suite Results\n\n`;
  
  // Process each test's output file
  for (const testScript of TEST_SCRIPTS) {
    reportContent += `### ${testScript.name}\n\n`;
    
    try {
      const outputPath = path.join(__dirname, testScript.outputFile);
      const outputContent = await fs.readFile(outputPath, 'utf8');
      
      // Count passes and failures
      const passCount = (outputContent.match(/✓/g) || []).length;
      const failCount = (outputContent.match(/✗/g) || []).length;
      
      reportContent += `- Total Tests: ${passCount + failCount}\n`;
      reportContent += `- Passed: ${passCount}\n`;
      reportContent += `- Failed: ${failCount}\n\n`;
      
      // Extract and include key findings
      reportContent += `#### Key Findings\n\n`;
      reportContent += '```\n';
      
      // Get first 10 lines after each section header
      const sectionMatches = outputContent.match(/={3,}\s*\n\s*[^=]+\s*\n={3,}\s*\n([\s\S]*?)(?=\n={3,}|\n$)/g) || [];
      
      for (const section of sectionMatches) {
        const lines = section.split('\n');
        const sectionHeader = lines[1].trim();
        reportContent += `${sectionHeader}:\n`;
        
        // Include first failure or first few results from each section
        let relevantLines = [];
        let failureFound = false;
        
        for (let i = 3; i < Math.min(lines.length, 15); i++) {
          if (lines[i].includes('✗')) {
            relevantLines.push(lines[i]);
            failureFound = true;
            break;
          } else if (lines[i].includes('✓')) {
            relevantLines.push(lines[i]);
          }
        }
        
        // Limit to 5 relevant lines if no failure was found
        if (!failureFound) {
          relevantLines = relevantLines.slice(0, 5);
        }
        
        reportContent += relevantLines.join('\n') + '\n\n';
      }
      
      reportContent += '```\n\n';
      
      // Add separator between test results
      reportContent += '---\n\n';
    } catch (err) {
      reportContent += `**Error:** Could not read output file for ${testScript.name}.\n\n`;
    }
  }
  
  // Add system summary
  reportContent += `## System Summary\n\n`;
  reportContent += `### Component Analysis\n\n`;
  
  try {
    // Count files by type
    const clientDir = path.join(__dirname, 'client', 'src');
    const serverDir = path.join(__dirname, 'server');
    
    const countFilesByType = async (dir, extensions) => {
      let count = 0;
      
      async function countFiles(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await countFiles(fullPath);
          } else if (extensions.includes(path.extname(fullPath))) {
            count++;
          }
        }
      }
      
      await countFiles(dir);
      return count;
    };
    
    const componentCount = await countFilesByType(clientDir, ['.tsx', '.jsx']);
    const serverFileCount = await countFilesByType(serverDir, ['.ts', '.js']);
    
    reportContent += `- Client-side Components: ${componentCount}\n`;
    reportContent += `- Server-side Files: ${serverFileCount}\n\n`;
  } catch (err) {
    reportContent += `**Error:** Could not analyze component counts.\n\n`;
  }
  
  // Save the report
  await fs.writeFile(MASTER_REPORT_FILE, reportContent);
  logMessage(`Master report saved to ${MASTER_REPORT_FILE}`, 'success');
}

// Main function to run all test suites
async function runAllSystemTests() {
  logHeader('VMB FULL SYSTEM LINE-BY-LINE REVIEW');
  console.log(`${colors.cyan}This script will run all test suites to perform a comprehensive validation of the entire system.${colors.reset}\n`);
  
  let allTestsSuccessful = true;
  
  // Run each test script
  for (const testScript of TEST_SCRIPTS) {
    const success = await runTestScript(testScript);
    if (!success) {
      allTestsSuccessful = false;
    }
  }
  
  // Generate master report
  await generateMasterReport();
  
  // Final summary
  logHeader('TEST EXECUTION SUMMARY');
  
  if (allTestsSuccessful) {
    logMessage('All test scripts executed successfully', 'success');
  } else {
    logMessage('Some test scripts encountered errors', 'error');
  }
  
  console.log(`\n${colors.cyan}A comprehensive report has been generated in ${MASTER_REPORT_FILE}${colors.reset}`);
  console.log(`${colors.cyan}Individual test results are available in their respective output files.${colors.reset}\n`);
}

// Run the tests
runAllSystemTests().catch(err => {
  console.error('Fatal error while running tests:', err);
  process.exit(1);
});