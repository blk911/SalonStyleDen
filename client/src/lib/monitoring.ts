/**
 * Client-side monitoring and error tracking
 * 
 * This module provides comprehensive monitoring for:
 * - Error tracking and reporting
 * - Keystroke monitoring
 * - API request/response tracking
 * - User interaction monitoring
 */
import activityMonitor from './activity-monitor';

// Log errors to console and server
export function logError(type: 'frontend' | 'api' | 'network', error: Error | string): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${type.toUpperCase()} ERROR] ${errorMessage}`);

  // Track in activity monitor
  activityMonitor.trackActivity('error', 'global', {
    type,
    message: errorMessage,
    stack: errorStack
  });

  // Send error to server for logging
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type, 
      message: errorMessage, 
      stack: errorStack,
      timestamp: new Date().toISOString()
    })
  }).catch(err => {
    console.error('Failed to send error to server:', err);
  });
}

// Initialize monitoring tools
export function initMonitoring(): void {
  console.log('[VMB Monitoring] Initializing monitoring system');

  // Check server status
  fetch('/api/status')
    .then(res => {
      if (res.headers.get('content-type')?.includes('application/json')) {
        return res.json();
      } else {
        // Handle non-JSON responses gracefully
        return { status: 'ok' };
      }
    })
    .then(data => {
      console.log('[VMB Monitoring] Server status:', data);
      activityMonitor.trackActivity('api', 'status-check', { 
        status: 'connected',
        data
      });
    })
    .catch(err => {
      console.debug('Server status check failed - this is expected during development');
      activityMonitor.trackActivity('api', 'status-check', { 
        status: 'failed',
        error: err.message
      });
    });

  // Periodic health checks disabled to prevent reload loops

  // Track page navigation
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    activityMonitor.trackActivity('navigation', 'history.pushState', {
      from: window.location.pathname,
      to: args[2]
    });
    return originalPushState.apply(this, args);
  };

  // Add keystroke listeners to all input fields
  document.addEventListener('keydown', (event) => {
    if (
      event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const componentName = findComponentName(target);
      const fieldName = target.name || target.id || 'unknown';
      
      activityMonitor.trackActivity('keystroke', componentName, {
        fieldName,
        key: event.key,
        keyCode: event.keyCode,
        value: target.value
      });
    }
  });

  // Track click events
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element) {
      const target = event.target as Element;
      const componentName = findComponentName(target);
      
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        activityMonitor.trackActivity('click', componentName, {
          element: target.tagName,
          text: target.textContent?.trim() || 'unknown',
          id: target.id || 'unknown',
          className: target.className || 'unknown'
        });
      }
    }
  });

  // Track form submissions
  document.addEventListener('submit', (event) => {
    if (event.target instanceof HTMLFormElement) {
      const form = event.target as HTMLFormElement;
      const componentName = findComponentName(form);
      
      activityMonitor.trackActivity('submit', componentName, {
        formId: form.id || 'unknown',
        action: form.action || 'unknown',
        method: form.method || 'unknown'
      });
    }
  });

  // Add global error handlers
  window.addEventListener('error', (event) => {
    logError('frontend', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError('frontend', event.reason || 'Unhandled Promise Rejection');
  });

  // Initialize network request monitoring
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    const method = init?.method || (typeof input === 'string' ? 'GET' : input instanceof Request ? input.method : 'GET');
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`[API-REQ] ${method} ${url} - ID: ${requestId}`, init?.body || 'No Body');
    
    try {
      const response = await originalFetch.apply(this, [input, init]);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[API-RES] ${method} ${url} - ID: ${requestId} - Duration: ${duration}ms - Status: ${response.status}`);
      
      activityMonitor.trackActivity('api', url, {
        requestId,
        method,
        url,
        status: response.status,
        duration,
        requestData: init?.body,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (err) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const error = err as Error;
      
      console.error(`[API-ERR] ${method} ${url} - ID: ${requestId} - Duration: ${duration}ms`, error);
      
      activityMonitor.trackActivity('api', url, {
        requestId,
        method,
        url,
        error: error.message || String(error),
        duration,
        requestData: init?.body,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  };

  console.log('[VMB Monitoring] Monitoring system initialized');
}

// Helper function to find React component name from DOM element
function findComponentName(element: Element): string {
  // Try to find data-component attribute
  const componentAttr = element.closest('[data-component]');
  if (componentAttr) {
    return componentAttr.getAttribute('data-component') || 'unknown';
  }
  
  // Try to find by class names with common React patterns
  const reactComponent = element.closest('[class*="component-"], [class*="-component"], [id*="component-"], [id*="-component"]');
  if (reactComponent) {
    const classOrId = reactComponent.className || reactComponent.id;
    const match = /(?:^|\s)([\w-]+(?:component|Component)[\w-]*)(?:\s|$)/.exec(classOrId);
    if (match) return match[1];
  }
  
  // Fallback: use closest parent with an id or distinct class
  let parent = element.closest('[id]');
  if (parent && parent.id) return `element-${parent.id}`;
  
  // If all else fails, generate path from tag hierarchy
  let path = '';
  let current: Element | null = element;
  let depth = 0;
  while (current && depth < 3) {
    path = `${current.tagName.toLowerCase()}${path ? '>' + path : ''}`;
    current = current.parentElement;
    depth++;
  }
  
  return `dom-${path}`;
}