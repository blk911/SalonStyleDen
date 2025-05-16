import { Router } from 'express';
import { db, pool } from '../db';
import { createInsertSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';
import { getLogEntries } from '../logging';

export const systemMetricsRouter = Router();

/**
 * System health component statuses
 */
interface ComponentStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

/**
 * System metrics response structure
 */
interface SystemMetricsResponse {
  cpu: number;
  memory: number;
  storage: number;
  requests: number; 
  errors: number;
  componentStatuses: ComponentStatus[];
}

// Maintain a rolling window of response times for each component
const responseTimeHistory: Record<string, number[]> = {
  'API Service': [],
  'Database': [],
  'Authentication': [],
  'Gift System': [],
  'Invitation System': [],
  'Client Management': [],
  'Activity Logging': []
};

// Track API request counts
let requestCount = 0;
let errorCount = 0;
let startTime = Date.now();

/**
 * Reset the metrics every hour to prevent unbounded growth
 */
setInterval(() => {
  requestCount = 0;
  errorCount = 0;
  startTime = Date.now();
  
  // Trim response time history to keep only the last 100 entries
  Object.keys(responseTimeHistory).forEach(key => {
    responseTimeHistory[key] = responseTimeHistory[key].slice(-100);
  });
}, 60 * 60 * 1000);

/**
 * Helper to record response times
 */
export function recordResponseTime(component: string, responseTime: number) {
  if (!responseTimeHistory[component]) {
    responseTimeHistory[component] = [];
  }
  responseTimeHistory[component].push(responseTime);
  
  // Keep only the last 100 measurements
  if (responseTimeHistory[component].length > 100) {
    responseTimeHistory[component].shift();
  }
}

/**
 * Helper to record API requests and errors
 */
export function recordApiRequest(isError: boolean = false) {
  requestCount++;
  if (isError) {
    errorCount++;
  }
}

/**
 * Get average response time for a component
 */
function getAverageResponseTime(component: string): number {
  const times = responseTimeHistory[component];
  if (!times || times.length === 0) {
    return 0;
  }
  
  const sum = times.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / times.length);
}

/**
 * Determine component status based on response times and error logs
 */
function determineComponentStatus(component: string): 'healthy' | 'warning' | 'critical' | 'unknown' {
  const avgResponseTime = getAverageResponseTime(component);
  
  // Get recent error logs related to this component
  const recentLogs = getLogEntries()
    .filter(log => log.message.toLowerCase().includes(component.toLowerCase()) && 
            log.level === 'error' &&
            Date.now() - new Date(log.timestamp).getTime() < 30 * 60 * 1000); // Last 30 minutes
  
  if (recentLogs.length >= 5) {
    return 'critical';
  }
  
  if (recentLogs.length >= 2 || avgResponseTime > 1500) {
    return 'warning';
  }
  
  if (avgResponseTime === 0) {
    return 'unknown';
  }
  
  return 'healthy';
}

/**
 * Calculate simulated uptime percentage based on error rate
 */
function calculateUptime(component: string): number {
  const now = Date.now();
  const hoursElapsed = (now - startTime) / (60 * 60 * 1000);
  
  // Get error count for this component
  const recentLogs = getLogEntries()
    .filter(log => log.message.toLowerCase().includes(component.toLowerCase()) && 
            log.level === 'error');
  
  // Simulate some downtime based on errors
  const componentErrorCount = recentLogs.length;
  const downtimeMinutes = componentErrorCount * 2; // Assume 2 minutes of downtime per error
  const uptimePercentage = 100 - (downtimeMinutes / (hoursElapsed * 60) * 100);
  
  // Cap uptime between 95% and 100%
  return Math.min(100, Math.max(95, uptimePercentage));
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth(): Promise<{ responseTime: number, status: 'healthy' | 'warning' | 'critical' }> {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - start;
    
    recordResponseTime('Database', responseTime);
    
    if (responseTime > 1000) {
      return { responseTime, status: 'warning' };
    }
    
    return { responseTime, status: 'healthy' };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { responseTime: 3000, status: 'critical' };
  }
}

/**
 * GET /api/system/metrics
 * Returns system performance metrics
 */
systemMetricsRouter.get('/metrics', async (req, res) => {
  try {
    // Record API request for metrics
    recordApiRequest();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Get current resource usage
    const metrics: SystemMetricsResponse = {
      // CPU usage - simulated between 30-70%
      cpu: Math.floor(30 + Math.random() * 40),
      
      // Memory usage - simulated between 40-80%
      memory: Math.floor(40 + Math.random() * 40),
      
      // Storage usage - simulated between 30-60%
      storage: Math.floor(30 + Math.random() * 30),
      
      // API request count
      requests: requestCount,
      
      // Error count
      errors: errorCount,
      
      // Component statuses
      componentStatuses: [
        {
          name: 'API Service',
          status: determineComponentStatus('API Service'),
          responseTime: getAverageResponseTime('API Service'),
          uptime: calculateUptime('API Service'),
          lastChecked: new Date().toISOString()
        },
        {
          name: 'Database',
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
          uptime: calculateUptime('Database'),
          lastChecked: new Date().toISOString()
        },
        {
          name: 'Authentication',
          status: determineComponentStatus('Authentication'),
          responseTime: getAverageResponseTime('Authentication'),
          uptime: calculateUptime('Authentication'),
          lastChecked: new Date().toISOString()
        },
        {
          name: 'Gift System',
          status: determineComponentStatus('Gift System'),
          responseTime: getAverageResponseTime('Gift System'),
          uptime: calculateUptime('Gift System'),
          lastChecked: new Date().toISOString()
        },
        {
          name: 'Invitation System',
          status: determineComponentStatus('Invitation System'),
          responseTime: getAverageResponseTime('Invitation System'),
          uptime: calculateUptime('Invitation System'),
          lastChecked: new Date().toISOString()
        },
        {
          name: 'Client Management',
          status: determineComponentStatus('Client Management'),
          responseTime: getAverageResponseTime('Client Management'),
          uptime: calculateUptime('Client Management'),
          lastChecked: new Date().toISOString()
        },
        {
          name: 'Activity Logging',
          status: determineComponentStatus('Activity Logging'),
          responseTime: getAverageResponseTime('Activity Logging'),
          uptime: calculateUptime('Activity Logging'),
          lastChecked: new Date().toISOString()
        }
      ]
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error generating system metrics:', error);
    recordApiRequest(true);
    res.status(500).json({ error: 'Failed to generate system metrics' });
  }
});