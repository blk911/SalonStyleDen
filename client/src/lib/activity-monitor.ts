/**
 * Activity Monitor
 * 
 * Tracks UI interactions, keystroke events, and form interactions with
 * detailed logging to help with debugging and testing.
 */

// Types for monitoring system
export interface KeystrokeEvent {
  timestamp: number;
  component: string;
  fieldName: string;
  keyCode: number;
  value: string;
  isModified: boolean;
}

export interface ApiEvent {
  timestamp: number;
  requestId: string;
  endpoint: string;
  method: string;
  requestData: any;
  responseData?: any;
  status?: number;
  duration?: number;
  error?: string;
}

export interface ActivityEvent {
  timestamp: number;
  type: 'navigation' | 'click' | 'submit' | 'render' | 'error' | 'api' | 'keystroke' | 'health-check' | 'status-check';
  component: string;
  details: any;
}

// History tracking
const HISTORY_LIMIT = 1000;
const keystrokeHistory: KeystrokeEvent[] = [];
const apiHistory: ApiEvent[] = [];
const activityHistory: ActivityEvent[] = [];

// Create a unique ID for each API request for tracing
let requestCounter = 0;
function generateRequestId(): string {
  return `req-${Date.now()}-${requestCounter++}`;
}

// Keystroke tracking on any input element
export function trackKeystroke(
  component: string,
  fieldName: string,
  event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  oldValue: string
): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const newEvent: KeystrokeEvent = {
    timestamp: Date.now(),
    component,
    fieldName,
    keyCode: event.keyCode,
    value: target.value,
    isModified: target.value !== oldValue
  };
  
  keystrokeHistory.push(newEvent);
  if (keystrokeHistory.length > HISTORY_LIMIT) {
    keystrokeHistory.shift();
  }
  
  console.log(`[KEYSTROKE] ${component}:${fieldName} - Key: ${event.key}, Value: ${target.value}`);
}

// API Request/Response Tracking
export async function trackApiRequest<T>(
  endpoint: string,
  method: string,
  requestData: any,
  apiCall: () => Promise<T>
): Promise<T> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Create initial API event
  const apiEvent: ApiEvent = {
    timestamp: startTime,
    requestId,
    endpoint,
    method,
    requestData
  };
  
  console.log(`[API-REQ] ${method} ${endpoint} - ID: ${requestId}`, requestData);
  
  try {
    // Execute the API call
    const response = await apiCall();
    
    // Update API event with response
    const endTime = Date.now();
    apiEvent.responseData = response;
    apiEvent.status = 200; // Assuming success
    apiEvent.duration = endTime - startTime;
    
    console.log(`[API-RES] ${method} ${endpoint} - ID: ${requestId} - Duration: ${apiEvent.duration}ms`, response);
    
    return response;
  } catch (error: any) {
    // Update API event with error
    const endTime = Date.now();
    apiEvent.error = error.message || 'Unknown error';
    apiEvent.duration = endTime - startTime;
    
    console.error(`[API-ERR] ${method} ${endpoint} - ID: ${requestId} - Duration: ${apiEvent.duration}ms`, error);
    
    throw error;
  } finally {
    // Store the API event in history
    apiHistory.push(apiEvent);
    if (apiHistory.length > HISTORY_LIMIT) {
      apiHistory.shift();
    }
    
    // Also add to general activity history
    activityHistory.push({
      timestamp: apiEvent.timestamp,
      type: 'api',
      component: endpoint,
      details: apiEvent
    });
    if (activityHistory.length > HISTORY_LIMIT) {
      activityHistory.shift();
    }
  }
}

// General activity tracking (clicks, navigation, etc)
export function trackActivity(
  type: 'navigation' | 'click' | 'submit' | 'render' | 'error' | 'api' | 'keystroke' | 'health-check' | 'status-check',
  component: string,
  details: any
): void {
  const activityEvent: ActivityEvent = {
    timestamp: Date.now(),
    type,
    component,
    details
  };
  
  activityHistory.push(activityEvent);
  if (activityHistory.length > HISTORY_LIMIT) {
    activityHistory.shift();
  }
  
  console.log(`[ACTIVITY-${type.toUpperCase()}] ${component}`, details);
}

// Get history for analysis
export function getKeystrokeHistory(): KeystrokeEvent[] {
  return [...keystrokeHistory];
}

export function getApiHistory(): ApiEvent[] {
  return [...apiHistory];
}

export function getActivityHistory(): ActivityEvent[] {
  return [...activityHistory];
}

// Clear history if needed
export function clearHistory(): void {
  keystrokeHistory.length = 0;
  apiHistory.length = 0;
  activityHistory.length = 0;
  console.log('[ACTIVITY-MONITOR] History cleared');
}

// Export a monitor object for global access
export const activityMonitor = {
  trackKeystroke,
  trackApiRequest,
  trackActivity,
  getKeystrokeHistory,
  getApiHistory,
  getActivityHistory,
  clearHistory
};

// Attach to window for console debugging
if (typeof window !== 'undefined') {
  (window as any).vmbActivityMonitor = activityMonitor;
}

export default activityMonitor;