#!/usr/bin/env node

/**
 * VMB Platform Cleanup Script
 * Kills all processes using port 5000 and cleans up resources
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function cleanupPort5000() {
  console.log('🧹 Starting port 5000 cleanup...');
  
  try {
    // Kill processes using port 5000
    const commands = [
      'pkill -f "tsx server/index.ts" 2>/dev/null || true',
      'pkill -f "node.*server/index.ts" 2>/dev/null || true',
      'fuser -k 5000/tcp 2>/dev/null || true',
      'lsof -ti:5000 | xargs kill -9 2>/dev/null || true'
    ];

    for (const cmd of commands) {
      try {
        await execAsync(cmd);
        console.log(`✅ Executed: ${cmd}`);
      } catch (error) {
        // Ignore errors - these commands are expected to fail sometimes
      }
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Port 5000 cleanup completed');
    
    // Check if port is free
    try {
      const { stdout } = await execAsync('netstat -tulpn | grep :5000 || echo "Port 5000 is free"');
      console.log('Port status:', stdout.trim());
    } catch (error) {
      console.log('✅ Port 5000 appears to be free');
    }
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

export { cleanupPort5000 };