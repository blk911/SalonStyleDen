/**
 * Port Cleanup Script
 * 
 * This script uses process.kill() directly for more reliable port cleanup.
 */

import { execSync } from 'child_process';

const PORT = 5000;

try {
  console.log(`Finding process using port ${PORT}...`);
  
  // Try using lsof (works on Linux/macOS)
  try {
    const pid = execSync(`lsof -i :${PORT} -t`).toString().trim();
    if (pid) {
      console.log(`Found process with PID ${pid}`);
      console.log(`Killing process...`);
      execSync(`kill -9 ${pid}`);
      console.log(`Process killed successfully`);
    } else {
      console.log(`No process found using port ${PORT}`);
    }
  } catch (e) {
    console.log(`Error with lsof: ${e.message}`);
    
    // Try using fuser as a fallback
    try {
      const fuserpid = execSync(`fuser -n tcp ${PORT} 2>/dev/null`).toString().trim();
      if (fuserpid) {
        console.log(`Found process with PID ${fuserpid}`);
        console.log(`Killing process...`);
        execSync(`kill -9 ${fuserpid}`);
        console.log(`Process killed successfully`);
      } else {
        console.log(`No process found using port ${PORT} with fuser`);
      }
    } catch (e2) {
      console.log(`Error with fuser: ${e2.message}`);
    }
  }

  // Final verification
  try {
    const testConnection = execSync(`nc -z localhost ${PORT} 2>/dev/null || echo "Port available"`).toString().trim();
    console.log(`Port check result: ${testConnection || "Port is being used"}`);
  } catch (e) {
    console.log(`Port appears to be available now`);
  }
} catch (error) {
  console.error(`Error during port cleanup: ${error.message}`);
}