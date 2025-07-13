
import { exec } from 'child_process';
import { log } from './vite';

function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    // Use netstat instead of lsof which might not be available
    exec(`netstat -tlnp 2>/dev/null | grep :${port}`, { timeout: 3000 }, (error, stdout) => {
      if (error && error.killed) {
        log(`Timeout checking port ${port}`);
        resolve();
        return;
      }
      
      if (stdout && stdout.trim()) {
        // Extract PIDs from netstat output
        const lines = stdout.split('\n').filter(Boolean);
        const pids = lines
          .map(line => {
            const match = line.match(/(\d+)\/node/);
            return match ? match[1] : null;
          })
          .filter(Boolean);
        
        if (pids.length > 0) {
          exec(`kill -9 ${pids.join(' ')}`, { timeout: 3000 }, (killError) => {
            if (killError) {
              log(`Error killing processes on port ${port}: ${killError.message}`);
            } else {
              log(`Successfully killed processes on port ${port}`);
            }
            resolve();
          });
        } else {
          log(`No node processes found on port ${port}`);
          resolve();
        }
      } else {
        log(`No process running on port ${port}`);
        resolve();
      }
    });
  });
}

export async function ensurePortAvailable(port: number): Promise<void> {
  try {
    await killProcessOnPort(port);
  } catch (error) {
    log(`Error managing port ${port}: ${error}`);
  }
}

export function setupPortMonitoring(port: number): void {
  // Disabled automatic port monitoring to prevent conflicts
  // This was causing recursive port cleanup issues
  log(`Port monitoring disabled for port ${port}`);
}
