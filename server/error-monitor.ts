
import { log } from './vite';

interface ErrorLog {
  timestamp: string;
  type: 'frontend' | 'backend' | 'network';
  message: string;
  stack?: string;
}

class ErrorMonitor {
  private logs: ErrorLog[] = [];
  private static instance: ErrorMonitor;

  static getInstance() {
    if (!this.instance) {
      this.instance = new ErrorMonitor();
    }
    return this.instance;
  }

  logError(type: ErrorLog['type'], error: Error | string) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    };
    
    this.logs.push(errorLog);
    log(`[ERROR] ${errorLog.type}: ${errorLog.message}`);
  }

  getRecentErrors(minutes: number = 5): ErrorLog[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.logs.filter(log => new Date(log.timestamp).getTime() > cutoff);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorMonitor = ErrorMonitor.getInstance();
