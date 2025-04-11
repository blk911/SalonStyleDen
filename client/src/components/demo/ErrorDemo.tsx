import { useState } from 'react';
import { logEvent } from '@/lib/monitoring';

// Demo component to test our error tracking setup
export default function ErrorDemo() {
  const [showError, setShowError] = useState(false);

  const triggerError = () => {
    try {
      // Log an event before attempting something that will cause an error
      logEvent('error_demo_clicked', { time: new Date().toISOString() });
      
      // This will throw an error that will be caught by Sentry
      if (showError) {
        throw new Error('This is a test error for Sentry and LogRocket!');
      } else {
        setShowError(true);
        console.log('Click again to throw an error');
      }
    } catch (error) {
      // Re-throw to trigger error boundary
      throw error;
    }
  };

  return (
    <div className="my-4 py-4 px-4 border rounded-md bg-pink-50">
      <h3 className="text-lg font-semibold mb-2">Error Tracking Demo</h3>
      <p className="mb-4 text-sm text-gray-600">
        {showError 
          ? 'Click again to trigger an error that will be tracked in Sentry and LogRocket' 
          : 'Click once to prepare, then again to trigger an error'}
      </p>
      <button
        onClick={triggerError}
        className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition duration-200"
      >
        {showError ? 'Throw Error Now' : 'Prepare Error Demo'}
      </button>
    </div>
  );
}