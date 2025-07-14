#!/usr/bin/env node

/**
 * Port Backup Script for VMB Platform
 * This script handles persistent port issues by cleaning up and restarting the server
 * on an available port automatically.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_PORT = 5000;
const LOCK_FILE = path.join(__dirname, '.server.lock');
const MAX_ATTEMPTS = 10;

// Clean up any existing lock file
if (fs.existsSync(LOCK_FILE)) {
  fs.unlinkSync(LOCK_FILE);
}

// Clean up function
function cleanup() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Create lock file
fs.writeFileSync(LOCK_FILE, process.pid.toString());

console.log('🔧 Port Backup Script: Starting server with automatic port selection');

// Kill any existing server processes
const killExisting = spawn('pkill', ['-f', 'tsx server/index.ts'], { stdio: 'inherit' });

killExisting.on('close', () => {
  setTimeout(() => {
    // Start the server
    const server = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      env: { ...process.env, PORT: BASE_PORT }
    });

    server.on('error', (err) => {
      console.error('❌ Server startup error:', err);
      cleanup();
    });

    server.on('close', (code) => {
      console.log(`🔄 Server exited with code ${code}`);
      cleanup();
    });
  }, 2000);
});