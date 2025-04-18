#!/usr/bin/env node

/**
 * Deep Validation Master Script - VMB Error Tracing Utility
 * 
 * This master script runs all validators and combines the results into
 * a single comprehensive report with line-by-line analysis of all components.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const APP_ROOT = '.';
const LOGS_DIR = path.join(APP_ROOT, 'logs/error-tracing');
const MASTER_REPORT = path.join(LOGS_DIR, 'master-validation-report.log');
const LINE_BY_LINE_REPORT = path.join(LOGS_DIR, 'line-by-line-validation.log');

// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

async function main() {
  console.log(`${CYAN}=== Ven Me, Baby! Deep Validation ====${RESET}`);
  console.log(`Running comprehensive validation and error tracing...`);
  
  try {
    await ensureDirectoryExists(LOGS_DIR);
    
    // Run all validators
    console.log(`\n${BLUE}Step 1: Running component scanner${RESET}`);
    await runValidator('scan-components.js');
    
    console.log(`\n${BLUE}Step 2: Running form validator${RESET}`);
    await runValidator('validate-forms.js');
    
    console.log(`\n${BLUE}Step 3: Running route validator${RESET}`);
    await runValidator('validate-routes.js');
    
    console.log(`\n${BLUE}Step 4: Performing line-by-line analysis${RESET}`);
    await performLineByLineAnalysis();
    
    console.log(`\n${BLUE}Step 5: Generating master report${RESET}`);
    await generateMasterReport();
    
    console.log(`\n${GREEN}✓ Deep validation complete!${RESET}`);
    console.log(`Master report generated at: ${MASTER_REPORT}`);
    console.log(`Line-by-line report generated at: ${LINE_BY_LINE_REPORT}`);
    
  } catch (error) {
    console.error(`${RED}Error during validation:${RESET}`, error);
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

async function runValidator(scriptName) {
  try {
    console.log(`Running ${scriptName}...`);
    execSync(`node ${scriptName}`, { stdio: 'inherit' });
    console.log(`${GREEN}✓ ${scriptName} completed successfully${RESET}`);
  } catch (error) {
    console.error(`${RED}✗ ${scriptName} failed:${RESET}`, error.message);
    // Continue execution even if a validator fails
  }
}

async function performLineByLineAnalysis() {
  console.log(`Performing detailed line-by-line analysis of all source files...`);
  
  const fileTypes = [
    { dir: 'client/src', ext: '.tsx', type: 'client' },
    { dir: 'client/src', ext: '.ts', type: 'client' },
    { dir: 'server', ext: '.ts', type: 'server' },
    { dir: 'shared', ext: '.ts', type: 'shared' },
  ];
  
  const results = [];
  
  for (const fileType of fileTypes) {
    const files = await findFilesRecursively(fileType.dir, fileType.ext);
    
    for (const file of files) {
      const relativePath = path.relative(APP_ROOT, file);
      console.log(`Analyzing ${relativePath}...`);
      
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
          continue;
        }
        
        const issues = [];
        
        // Check for TypeScript 'any' type
        if (line.includes(': any') || line.includes('as any')) {
          issues.push('Uses TypeScript "any" type');
        }
        
        // Check for console.log statements
        if (line.includes('console.log') && fileType.type !== 'client') {
          issues.push('Contains console.log statement');
        }
        
        // Check for hardcoded values that should be configurable
        if ((line.includes('http://') || line.includes('https://')) && 
            !line.includes('import') && !line.includes('//')) {
          issues.push('Contains hardcoded URL');
        }
        
        // Check for setTimeout without cleanup
        if (line.includes('setTimeout(') && !content.includes('clearTimeout(')) {
          issues.push('Uses setTimeout without clearTimeout');
        }
        
        // Check for React antipatterns
        if (fileType.type === 'client') {
          if (line.includes('useState(') && line.includes('[]') && content.includes('useEffect')) {
            // This is a simplistic check for potential dependency array issues
            issues.push('Potential missing dependency in useState/useEffect pattern');
          }
          
          // Check for inline styles
          if (line.includes('style={{') && line.length > 30) {
            issues.push('Uses large inline style');
          }
          
          // Check for element array without keys
          if (line.includes('.map(') && !line.includes('key=') && 
              !lines[i+1]?.includes('key=') && !lines[i+2]?.includes('key=')) {
            issues.push('Mapped array elements may be missing key prop');
          }
        }
        
        // Check for server issues
        if (fileType.type === 'server') {
          // Catch blocks that don't do proper error handling
          if (line === 'catch (error) {' || line === 'catch(error) {') {
            const nextLines = lines.slice(i+1, i+5).join(' ');
            if (!nextLines.includes('log') && !nextLines.includes('throw') && 
                !nextLines.includes('return') && !nextLines.includes('res.status')) {
              issues.push('Catch block may not properly handle error');
            }
          }
          
          // Database queries without error handling
          if ((line.includes('db.query(') || line.includes('await db.')) && 
              !content.includes('try') && !content.includes('catch')) {
            issues.push('Database query without try/catch error handling');
          }
        }
        
        if (issues.length > 0) {
          results.push({
            file: relativePath,
            line: lineNumber,
            content: line,
            issues
          });
        }
      }
    }
  }
  
  // Generate line-by-line report
  let report = `Ven Me, Baby! Line-by-Line Validation Report\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `===========================================\n\n`;
  
  let currentFile = '';
  for (const result of results) {
    if (currentFile !== result.file) {
      currentFile = result.file;
      report += `\n${currentFile}\n`;
      report += `------------------------------------------\n`;
    }
    
    report += `  Line ${result.line.toString().padStart(4)}: ${result.content.substring(0, 80)}${result.content.length > 80 ? '...' : ''}\n`;
    for (const issue of result.issues) {
      report += `    [✗] ${issue}\n`;
    }
    report += `\n`;
  }
  
  await fs.writeFile(LINE_BY_LINE_REPORT, report);
  console.log(`${GREEN}✓ Line-by-line analysis complete. Found ${results.length} potential issues.${RESET}`);
}

async function findFilesRecursively(dir, extension) {
  const results = [];
  
  try {
    const entries = await fs.readdir(path.join(APP_ROOT, dir), { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(APP_ROOT, dir, entry.name);
      
      if (entry.isDirectory()) {
        const nestedFiles = await findFilesRecursively(path.join(dir, entry.name), extension);
        results.push(...nestedFiles);
      } else if (entry.name.endsWith(extension)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

async function generateMasterReport() {
  console.log(`Generating master validation report...`);
  
  const reports = [
    { name: 'Component Analysis', file: path.join(LOGS_DIR, 'component-scan-results.log') },
    { name: 'Form Validation', file: path.join(LOGS_DIR, 'form-validation-results.log') },
    { name: 'Route Validation', file: path.join(LOGS_DIR, 'route-validation-results.log') },
    { name: 'Line-by-Line Analysis', file: LINE_BY_LINE_REPORT }
  ];
  
  let masterReport = `Ven Me, Baby! Master Validation Report\n`;
  masterReport += `Generated: ${new Date().toISOString()}\n`;
  masterReport += `===========================================\n\n`;
  
  // Add executive summary section
  masterReport += `EXECUTIVE SUMMARY:\n`;
  masterReport += `------------------------------------------\n`;
  masterReport += `This report combines the results of multiple validation tools to provide a comprehensive\n`;
  masterReport += `analysis of the Ven Me, Baby! application. It includes component analysis, form validation,\n`;
  masterReport += `route validation, and a detailed line-by-line analysis of all source files.\n\n`;
  
  let totalIssues = 0;
  
  // Include summaries from each report
  for (const report of reports) {
    try {
      if (await fileExists(report.file)) {
        const content = await fs.readFile(report.file, 'utf8');
        
        // Extract the summary section from each report
        const summaryPattern = /SUMMARY:([^=]*?)(?=(?:\n[A-Z]+:|\n=))/s;
        const match = summaryPattern.exec(content);
        
        if (match) {
          masterReport += `${report.name} Summary:\n`;
          const summary = match[1].trim();
          masterReport += `${summary}\n\n`;
          
          // Count issues
          const issueMatch = /Issues found: (\d+)/.exec(summary) || 
                            /Forms with issues: (\d+)/.exec(summary) ||
                            /errors: (\d+)/.exec(summary);
          
          if (issueMatch) {
            totalIssues += parseInt(issueMatch[1], 10);
          }
        } else {
          masterReport += `${report.name}: Unable to extract summary\n\n`;
        }
      } else {
        masterReport += `${report.name}: Report file not found\n\n`;
      }
    } catch (error) {
      masterReport += `${report.name}: Error reading report - ${error.message}\n\n`;
    }
  }
  
  masterReport += `Total Issues Found: ${totalIssues}\n\n`;
  
  // Add critical issues section
  masterReport += `CRITICAL ISSUES:\n`;
  masterReport += `------------------------------------------\n`;
  
  try {
    // Extract critical issues from line-by-line report
    if (await fileExists(LINE_BY_LINE_REPORT)) {
      const content = await fs.readFile(LINE_BY_LINE_REPORT, 'utf8');
      const lines = content.split('\n');
      let foundIssues = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('[✗]') && (
            line.includes('TypeScript "any" type') ||
            line.includes('Database query without try/catch') ||
            line.includes('Catch block may not properly handle error') ||
            line.includes('Mapped array elements may be missing key prop')
        )) {
          // Find the file name from preceding lines
          let fileContext = '';
          for (let j = i - 5; j < i; j++) {
            if (j >= 0 && lines[j].trim() !== '' && !lines[j].startsWith(' ')) {
              fileContext = lines[j];
              break;
            }
          }
          
          masterReport += `${fileContext ? fileContext + ' - ' : ''}${lines[i-2].trim()} - ${line.trim()}\n`;
          foundIssues = true;
        }
      }
      
      if (!foundIssues) {
        masterReport += `No critical issues identified\n\n`;
      }
    } else {
      masterReport += `Line-by-line report not found, cannot extract critical issues\n\n`;
    }
  } catch (error) {
    masterReport += `Error extracting critical issues: ${error.message}\n\n`;
  }
  
  masterReport += `\nFor complete detailed results, please refer to the individual reports in logs/error-tracing/\n`;
  
  await fs.writeFile(MASTER_REPORT, masterReport);
  console.log(`${GREEN}✓ Master report generated${RESET}`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Start the validation
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});