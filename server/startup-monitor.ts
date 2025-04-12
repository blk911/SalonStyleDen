
import { log } from './vite';

interface HealthCheck {
  service: string;
  status: 'ok' | 'error';
  message?: string;
}

class StartupMonitor {
  private checks: HealthCheck[] = [];
  
  async checkPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      server.once('error', () => {
        resolve(false);
      });
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port, '0.0.0.0');
    });
  }

  async verifyService(service: string, checkFn: () => Promise<boolean>) {
    try {
      const success = await checkFn();
      this.checks.push({
        service,
        status: success ? 'ok' : 'error',
        message: success ? 'Service started successfully' : 'Service failed to start'
      });
      return success;
    } catch (error) {
      this.checks.push({
        service,
        status: 'error',
        message: error.message
      });
      return false;
    }
  }

  getStatus() {
    const allOk = this.checks.every(check => check.status === 'ok');
    return {
      status: allOk ? 'ok' : 'error',
      checks: this.checks,
      timestamp: new Date().toISOString()
    };
  }

  logStatus() {
    const status = this.getStatus();
    log(`Startup Status: ${status.status.toUpperCase()}`);
    this.checks.forEach(check => {
      log(`${check.service}: ${check.status.toUpperCase()} ${check.message ? '- ' + check.message : ''}`);
    });
  }
}

export const startupMonitor = new StartupMonitor();
