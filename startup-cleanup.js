#!/usr/bin/env node

/**
 * Startup Cleanup Script for VMB Platform
 * Ensures clean application startup by killing existing processes
 */

import { execSync } from 'child_process';

async function cleanupProcesses() {
  console.log('[STARTUP] Starting cleanup process...');
  
  try {
    // Kill any existing tsx/node processes
    execSync('pkill -f "tsx.*server" || true', { stdio: 'ignore' });
    execSync('pkill -f "node.*server" || true', { stdio: 'ignore' });
    execSync('pkill -f "npm.*dev" || true', { stdio: 'ignore' });
    
    console.log('[STARTUP] Killed existing processes');
    
    // Wait for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[STARTUP] Cleanup completed successfully');
    
  } catch (error) {
    console.log('[STARTUP] Cleanup completed (some processes may not have existed)');
  }
}

// Run cleanup when script is executed directly
cleanupProcesses();