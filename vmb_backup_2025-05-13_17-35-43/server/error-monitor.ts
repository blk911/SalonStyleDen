
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
    
    // Console error logging with visual distinction
    console.error(`🚨 [${errorLog.type.toUpperCase()}] ERROR 🚨`);
    console.error(`Time: ${errorLog.timestamp}`);
    console.error(`Message: ${errorLog.message}`);
    if (errorLog.stack) {
      console.error(`Stack: ${errorLog.stack}`);
    }
    console.error('-------------------');

    // Show toast notification in UI
    if (typeof window !== 'undefined') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 9999;
        max-width: 350px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      toast.innerHTML = `
        <strong>${errorLog.type} Error</strong><br/>
        ${errorLog.message}
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
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
