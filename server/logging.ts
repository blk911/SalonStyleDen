/**
 * VMB Platform Logging System
 * 
 * This provides centralized logging with severity levels, timestamps and component tracking
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

// In-memory log storage
const logEntries: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

/**
 * Add a log entry to the system
 */
export function addLogEntry(level: LogLevel, component: string, message: string, data?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    data
  };
  
  logEntries.unshift(entry); // Add to the beginning for newest first
  
  // Trim log if it gets too large
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.pop();
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    const colorize = getColorForLevel(level);
    console.log(`[${colorize(level.toUpperCase())}][${component}] ${message}`, data || '');
  }
  
  return entry;
}

/**
 * Get all log entries, optionally filtered
 */
export function getLogEntries(options?: {
  level?: LogLevel;
  component?: string;
  limit?: number;
}): LogEntry[] {
  let filtered = [...logEntries];
  
  if (options?.level) {
    filtered = filtered.filter(entry => entry.level === options.level);
  }
  
  if (options?.component) {
    filtered = filtered.filter(entry => entry.component === options.component);
  }
  
  if (options?.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }
  
  return filtered;
}

/**
 * Clear all logs
 */
export function clearLogs() {
  logEntries.length = 0;
}

/**
 * Helper for console colors
 */
function getColorForLevel(level: LogLevel): (text: string) => string {
  switch (level) {
    case 'debug':
      return text => `\x1b[34m${text}\x1b[0m`; // Blue
    case 'info':
      return text => `\x1b[32m${text}\x1b[0m`; // Green
    case 'warn':
      return text => `\x1b[33m${text}\x1b[0m`; // Yellow
    case 'error':
      return text => `\x1b[31m${text}\x1b[0m`; // Red
    default:
      return text => text;
  }
}

// Logger instances for different components
export const logger = {
  debug: (component: string, message: string, data?: any) => 
    addLogEntry('debug', component, message, data),
  
  info: (component: string, message: string, data?: any) => 
    addLogEntry('info', component, message, data),
  
  warn: (component: string, message: string, data?: any) => 
    addLogEntry('warn', component, message, data),
  
  error: (component: string, message: string, data?: any) => 
    addLogEntry('error', component, message, data),
};

// Seed some initial logs for testing
if (process.env.NODE_ENV !== 'production') {
  logger.info('System', 'Logging system initialized');
  logger.info('API Service', 'API server started successfully');
  logger.info('Database', 'Database connection established');
  logger.info('Authentication', 'Authentication service ready');
  logger.info('Gift System', 'Gift processing system online');
  logger.info('Invitation System', 'Invitation system initialized');
  logger.warn('Invitation System', 'High latency detected in invitation processing');
}