/**
 * Client-side monitoring and error tracking
 */

// This function can be expanded to integrate with Sentry, LogRocket, etc.
export function logError(type: 'frontend' | 'api' | 'network', error: Error | string): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${type.toUpperCase()} ERROR] ${errorMessage}`);

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

// Initialize monitoring tools if available
export function initMonitoring(): void {
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
      .catch(err => {
        // Don't log network errors to reduce console noise
        console.debug('Server status check failed - this is expected during development');
      });

    // Setup periodic health checks
    setInterval(() => {
      fetch('/api/health')
        .then(res => {
          if (res.headers.get('content-type')?.includes('application/json')) {
            return res.json();
          } else {
            // Handle non-JSON responses gracefully
            return { status: 'ok' };
          }
        })
        .catch(err => {
          // Silently handle expected health check errors
        });
    }, 30000);

  // Check for Sentry DSN
  const sentrySdnExists = false; // TODO: Check if SENTRY_DSN is configured

  // Check for LogRocket app ID
  const logRocketAppIdExists = false; // TODO: Check if LOGROCKET_APP_ID is configured

  if (sentrySdnExists) {
    console.log('Sentry initialized for error monitoring');
  }

  if (logRocketAppIdExists) {
    console.log('LogRocket initialized for session replay');
  }

  // Add global error handlers
  window.addEventListener('error', (event) => {
    logError('frontend', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError('frontend', event.reason || 'Unhandled Promise Rejection');
  });
}