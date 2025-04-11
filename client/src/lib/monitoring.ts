import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';

// Initialize Sentry
export const initSentry = () => {
  try {
    Sentry.init({
      dsn: "https://5a59501e4c2214d841b1794ee7983c41@o4509136870834176.ingest.us.sentry.io/4509136882040832",
      // Simplified configuration to avoid compatibility issues
      environment: import.meta.env.MODE || 'development', // Will be 'development' or 'production'
      release: 'ven-me-baby@1.0.0',
      beforeSend(event) {
        // Check if we're in development mode and log the event to console
        if (import.meta.env.DEV) {
          console.log('Sentry event:', event);
        }
        return event;
      },
    });
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

// Initialize LogRocket
export const initLogRocket = () => {
  // Only initialize if an app ID is provided
  if (import.meta.env.VITE_LOGROCKET_APP_ID) {
    LogRocket.init(import.meta.env.VITE_LOGROCKET_APP_ID);
    
    // Integration with Sentry
    LogRocket.getSessionURL(sessionURL => {
      Sentry.addBreadcrumb({
        category: 'logrocket',
        message: 'LogRocket session URL',
        data: { sessionURL },
        level: 'info'
      });
    });
  }
};

// Custom error logger that sends to both services
export const logError = (error: Error, context?: Record<string, any>) => {
  console.error(error);
  
  // Log to Sentry with context
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

// Custom event logger
export const logEvent = (eventName: string, data?: Record<string, any>) => {
  // Log to LogRocket if available
  if (import.meta.env.VITE_LOGROCKET_APP_ID) {
    LogRocket.track(eventName, data);
  }
  
  // Log to Sentry
  Sentry.captureMessage(`EVENT: ${eventName}`, {
    level: 'info',
    extra: data,
  });
};

// Initialize all monitoring tools
export const initMonitoring = () => {
  initSentry();
  initLogRocket();
};

// Error boundary component for React
export { ErrorBoundary } from '@sentry/react';