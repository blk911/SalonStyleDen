
import { exec } from 'child_process';
import { log } from './vite';

function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`lsof -i :${port} -t`, (error, stdout) => {
      if (stdout) {
        exec(`kill -9 ${stdout.split('\n').filter(Boolean).join(' ')}`, (killError) => {
          if (killError) {
            log(`Error killing processes on port ${port}: ${killError}`);
          } else {
            log(`Successfully killed processes on port ${port}`);
          }
          resolve();
        });
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
  setInterval(async () => {
    try {
      await ensurePortAvailable(port);
    } catch (error) {
      log(`Port monitoring error: ${error}`);
    }
  }, 5000);
}
