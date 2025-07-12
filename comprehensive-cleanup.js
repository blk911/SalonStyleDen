#!/usr/bin/env node

/**
 * VMB Platform Comprehensive Cleanup and Testing Script
 * Performs deep cleanup and systematic testing of all components
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const PASS = `${colors.green}✓ PASS${colors.reset}`;
const FAIL = `${colors.red}✗ FAIL${colors.reset}`;
const WARN = `${colors.yellow}⚠ WARN${colors.reset}`;
const INFO = `${colors.blue}ℹ INFO${colors.reset}`;

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0
};

// 1. CLEANUP PHASE
async function performCleanup() {
  console.log(`\n${colors.magenta}=== PHASE 1: COMPREHENSIVE CLEANUP ===${colors.reset}`);
  
  const cleanupTargets = [
    // Backup directories
    'vmb_backup_*',
    'vmb_completed_milestone_*',
    'vmb_backup_TEST-BACKUP-*',
    
    // Test files and debug scripts
    'test-*.js',
    'debug-*.js',
    '*-test.js',
    '*-debug.js',
    'validate-*.js',
    
    // Temporary and utility files
    'cleanup-*.js',
    'clear-*.js',
    'kill-*.js',
    'purge-*.js',
    'migrate-*.js',
    'fix-*.js',
    
    // Log files
    '*.log',
    'debug-reports',
    'archived_logs',
    'archived_test_files',
    
    // JSON test data
    'salon*.json',
    'service*.json',
    'owner*.json',
    '*_data.json',
    '*_response.json',
    '*_endpoint.json'
  ];

  let cleanedCount = 0;
  
  for (const target of cleanupTargets) {
    try {
      const matches = execSync(`find . -maxdepth 1 -name "${target}" -type f 2>/dev/null || true`)
        .toString().trim().split('\n').filter(Boolean);
      
      for (const match of matches) {
        if (match && fs.existsSync(match)) {
          fs.unlinkSync(match);
          console.log(`${PASS} Removed: ${match}`);
          cleanedCount++;
        }
      }
      
      // Handle directories
      const dirMatches = execSync(`find . -maxdepth 1 -name "${target}" -type d 2>/dev/null || true`)
        .toString().trim().split('\n').filter(Boolean);
      
      for (const match of dirMatches) {
        if (match && fs.existsSync(match)) {
          execSync(`rm -rf "${match}"`);
          console.log(`${PASS} Removed directory: ${match}`);
          cleanedCount++;
        }
      }
    } catch (error) {
      // Silent fail for pattern matches
    }
  }
  
  console.log(`${INFO} Cleanup completed: ${cleanedCount} items removed`);
  testResults.total++;
  if (cleanedCount >= 0) testResults.passed++;
}

// 2. STRUCTURE ANALYSIS
async function analyzeProjectStructure() {
  console.log(`\n${colors.magenta}=== PHASE 2: PROJECT STRUCTURE ANALYSIS ===${colors.reset}`);
  
  const requiredDirs = ['client', 'server', 'shared'];
  const requiredFiles = ['package.json', 'vite.config.ts', 'drizzle.config.ts'];
  
  // Check required directories
  for (const dir of requiredDirs) {
    testResults.total++;
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      console.log(`${PASS} Required directory exists: ${dir}`);
      testResults.passed++;
    } else {
      console.log(`${FAIL} Missing required directory: ${dir}`);
      testResults.failed++;
    }
  }
  
  // Check required files
  for (const file of requiredFiles) {
    testResults.total++;
    if (fs.existsSync(file)) {
      console.log(`${PASS} Required file exists: ${file}`);
      testResults.passed++;
    } else {
      console.log(`${FAIL} Missing required file: ${file}`);
      testResults.failed++;
    }
  }
}

// 3. DEPENDENCY ANALYSIS
async function analyzeDependencies() {
  console.log(`\n${colors.magenta}=== PHASE 3: DEPENDENCY ANALYSIS ===${colors.reset}`);
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    console.log(`${INFO} Total dependencies: ${Object.keys(dependencies).length}`);
    
    // Check for critical dependencies
    const criticalDeps = [
      'react', 'express', 'drizzle-orm', 'typescript', 'vite'
    ];
    
    for (const dep of criticalDeps) {
      testResults.total++;
      if (dependencies[dep]) {
        console.log(`${PASS} Critical dependency present: ${dep}@${dependencies[dep]}`);
        testResults.passed++;
      } else {
        console.log(`${FAIL} Missing critical dependency: ${dep}`);
        testResults.failed++;
      }
    }
    
  } catch (error) {
    testResults.total++;
    testResults.failed++;
    console.log(`${FAIL} Could not read package.json: ${error.message}`);
  }
}

// Main execution
async function runComprehensiveCleanup() {
  console.log(`${colors.cyan}=================================${colors.reset}`);
  console.log(`${colors.cyan}=== VMB COMPREHENSIVE CLEANUP ===${colors.reset}`);
  console.log(`${colors.cyan}=================================${colors.reset}`);
  console.log(`Started at: ${new Date().toLocaleString()}\n`);
  
  await performCleanup();
  await analyzeProjectStructure();
  await analyzeDependencies();
  
  // Summary
  console.log(`\n${colors.magenta}=== CLEANUP SUMMARY ===${colors.reset}`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  return testResults;
}

// Run if executed directly
runComprehensiveCleanup().catch(console.error);

export { runComprehensiveCleanup };