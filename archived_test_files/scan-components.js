#!/usr/bin/env node

/**
 * Component Scanner - VMB Error Tracing Utility
 * 
 * This utility performs a comprehensive line-by-line analysis of components,
 * pages, and endpoints to detect issues in the Ven Me, Baby! application.
 * It traces both forward from UI elements and backward from API endpoints.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const APP_ROOT = '.';
const CLIENT_SRC = path.join(APP_ROOT, 'client/src');
const SERVER_SRC = path.join(APP_ROOT, 'server');
const SHARED_SRC = path.join(APP_ROOT, 'shared');
const OUTPUT_FILE = path.join(APP_ROOT, 'logs/error-tracing/component-scan-results.log');

// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

// Result Tracking
const results = {
  components: { success: [], errors: [] },
  pages: { success: [], errors: [] },
  endpoints: { success: [], errors: [] },
  schema: { success: [], errors: [] },
  routes: { success: [], errors: [] },
  storage: { success: [], errors: [] }
};

async function main() {
  console.log(`${CYAN}=== Ven Me, Baby! Component Analysis ====${RESET}`);
  console.log(`Scanning project for issues...`);
  
  try {
    await ensureDirectoryExists(path.dirname(OUTPUT_FILE));
    
    // 1. Scan client components
    await scanClientComponents();
    
    // 2. Scan pages
    await scanPages();
    
    // 3. Scan API endpoints
    await scanAPIEndpoints();
    
    // 4. Scan database schema
    await scanDatabaseSchema();
    
    // 5. Generate comprehensive report
    await generateReport();
    
    console.log(`\n${GREEN}✓ Analysis complete!${RESET}`);
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

async function scanClientComponents() {
  console.log(`\n${BLUE}Scanning client components...${RESET}`);
  const componentsDir = path.join(CLIENT_SRC, 'components');
  await scanDirectory(componentsDir, 'components');
}

async function scanPages() {
  console.log(`\n${BLUE}Scanning pages...${RESET}`);
  const pagesDir = path.join(CLIENT_SRC, 'pages');
  await scanDirectory(pagesDir, 'pages');
}

async function scanAPIEndpoints() {
  console.log(`\n${BLUE}Scanning API endpoints...${RESET}`);
  
  // Scan route files
  const routesFile = path.join(SERVER_SRC, 'routes.ts');
  await analyzeFile(routesFile, 'routes');
  
  // Analyze API endpoint handlers
  try {
    const routesContent = await fs.readFile(routesFile, 'utf8');
    const endpointPattern = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = endpointPattern.exec(routesContent)) !== null) {
      const method = match[1].toUpperCase();
      const endpoint = match[2];
      logResult(`API Endpoint: ${method} ${endpoint}`, 'endpoints', true);
    }
  } catch (error) {
    logResult(`Error analyzing API endpoints: ${error.message}`, 'endpoints', false);
  }
}

async function scanDatabaseSchema() {
  console.log(`\n${BLUE}Scanning database schema...${RESET}`);
  
  // Schema definition
  const schemaFile = path.join(SHARED_SRC, 'schema.ts');
  await analyzeFile(schemaFile, 'schema');
  
  // Storage implementation
  const storageFile = path.join(SERVER_SRC, 'storage.ts');
  await analyzeFile(storageFile, 'storage');
  
  // Database connection
  const dbFile = path.join(SERVER_SRC, 'db.ts');
  if (await fileExists(dbFile)) {
    await analyzeFile(dbFile, 'storage');
  }
}

async function scanDirectory(dirPath, category) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, category);
      } else if (isRelevantFile(entry.name)) {
        await analyzeFile(fullPath, category);
      }
    }
  } catch (error) {
    logResult(`Error scanning directory ${dirPath}: ${error.message}`, category, false);
  }
}

async function analyzeFile(filePath, category) {
  try {
    if (!(await fileExists(filePath))) {
      logResult(`File not found: ${filePath}`, category, false);
      return;
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let fileError = false;
    
    console.log(`\nAnalyzing ${path.relative(APP_ROOT, filePath)}`);
    
    // Perform TypeScript type checking
    try {
      // We're using grep to check for type errors in comments or code
      const typeErrors = execSync(`grep -n "any\\|unknown\\|Error:" "${filePath}" || echo "No type errors"`, { encoding: 'utf8' });
      
      if (!typeErrors.includes('No type errors')) {
        fileError = true;
        logResult(`TypeScript type issues in ${filePath}:\n${typeErrors}`, category, false);
      }
    } catch (error) {
      // Grep returns non-zero exit code if nothing matches, which is fine for us
    }
    
    // Check for common React component issues
    if (filePath.includes('/components/') || filePath.includes('/pages/')) {
      // Check for conditional hooks
      const hookPattern = /^\s*(use[A-Z][a-zA-Z]+)/;
      const conditionalPattern = /^\s*(if|for|while|switch|catch)/;
      let foundConditional = false;
      let insideComponentFunction = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect component function start
        if (line.includes('function') && (line.includes('export default') || line.includes('return ('))) {
          insideComponentFunction = true;
        }
        
        // Check for conditional statements
        if (insideComponentFunction && conditionalPattern.test(line)) {
          foundConditional = true;
        }
        
        // Check if hook follows a conditional
        if (insideComponentFunction && foundConditional && hookPattern.test(line)) {
          fileError = true;
          logResult(`Potential conditional hook at line ${i+1}: ${line.trim()}`, category, false);
        }
        
        // Reset conditional flag if we've found a closing brace
        if (foundConditional && line.trim() === '}') {
          foundConditional = false;
        }
        
        // End of component function
        if (insideComponentFunction && line.trim() === '}') {
          insideComponentFunction = false;
        }
      }
    }
    
    // Check for API endpoint implementation issues in routes.ts
    if (filePath.includes('routes.ts')) {
      const handlerPattern = /async\s*\(req,\s*res(?:,\s*next)?\)\s*=>\s*{/g;
      let match;
      
      while ((match = handlerPattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        
        // Check if handler catches errors
        const handlerCode = content.substring(match.index);
        const closingBraceIndex = findClosingBrace(handlerCode);
        
        if (closingBraceIndex > -1) {
          const handler = handlerCode.substring(0, closingBraceIndex + 1);
          
          if (!handler.includes('try') || !handler.includes('catch')) {
            logResult(`API handler at line ${lineNum} lacks proper error handling`, category, false);
            fileError = true;
          }
        }
      }
    }
    
    // Check for database model issues in schema.ts
    if (filePath.includes('schema.ts')) {
      // Check for missing relations
      const tableDefPattern = /export\s+const\s+(\w+)\s*=\s*pgTable/g;
      let tableMatch;
      const definedTables = [];
      
      while ((tableMatch = tableDefPattern.exec(content)) !== null) {
        definedTables.push(tableMatch[1]);
      }
      
      let foundRelations = 0;
      const relationsPattern = /export\s+const\s+\w+Relations\s*=\s*relations/g;
      
      while (relationsPattern.exec(content) !== null) {
        foundRelations++;
      }
      
      if (definedTables.length > 1 && foundRelations === 0) {
        logResult(`Schema defines multiple tables but no relations are defined`, category, false);
        fileError = true;
      }
    }
    
    if (!fileError) {
      logResult(`✓ ${path.relative(APP_ROOT, filePath)}`, category, true);
    }
  } catch (error) {
    logResult(`Error analyzing file ${filePath}: ${error.message}`, category, false);
  }
}

function findClosingBrace(code) {
  let braceCount = 0;
  let foundOpening = false;
  
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      foundOpening = true;
    } else if (code[i] === '}') {
      braceCount--;
      if (foundOpening && braceCount === 0) {
        return i;
      }
    }
  }
  
  return -1;
}

function isRelevantFile(filename) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  return extensions.some(ext => filename.endsWith(ext));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function logResult(message, category, success) {
  const statusText = success ? `${GREEN}[✓]${RESET}` : `${RED}[✗]${RESET}`;
  console.log(`${statusText} ${message}`);
  
  if (results[category]) {
    if (success) {
      results[category].success.push(message);
    } else {
      results[category].errors.push(message);
    }
  }
}

async function generateReport() {
  console.log(`\n${BLUE}Generating report...${RESET}`);
  
  let report = `Ven Me, Baby! Component Analysis Report\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `===========================================\n\n`;
  
  // Add summary
  report += `SUMMARY:\n`;
  let totalSuccesses = 0;
  let totalErrors = 0;
  
  for (const [category, data] of Object.entries(results)) {
    totalSuccesses += data.success.length;
    totalErrors += data.errors.length;
    report += `  ${category}: ${data.success.length} passed, ${data.errors.length} errors\n`;
  }
  
  report += `\nTOTAL: ${totalSuccesses} passed, ${totalErrors} errors\n`;
  report += `===========================================\n\n`;
  
  // Add detailed results by category
  for (const [category, data] of Object.entries(results)) {
    report += `${category.toUpperCase()}\n`;
    report += `------------------------------------------\n`;
    
    if (data.errors.length > 0) {
      report += `ERRORS:\n`;
      data.errors.forEach((error, index) => {
        report += `  [✗] ${error}\n`;
      });
      report += `\n`;
    }
    
    if (data.success.length > 0) {
      report += `PASSED:\n`;
      data.success.forEach((success, index) => {
        report += `  [✓] ${success}\n`;
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