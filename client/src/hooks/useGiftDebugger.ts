/**
 * Gift Transaction Debugging Hook
 * 
 * This hook provides consistent logging and debugging for gift-related 
 * transactions throughout the application. It helps identify issues
 * in the gift sending/claiming process by tracking state and API calls.
 */
import { useCallback } from 'react';
import { processApiUrl } from '@/lib/utils';

interface DebugOptions {
  enabled: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
}

// Default to enabled in development, disabled in production
const defaultOptions: DebugOptions = {
  enabled: process.env.NODE_ENV !== 'production',
  logToConsole: true,
  logToServer: false
};

export const useGiftDebugger = (customOptions?: Partial<DebugOptions>) => {
  const options = { ...defaultOptions, ...customOptions };
  
  const trackGiftAction = useCallback((action: string, giftData: any, error?: any) => {
    if (!options.enabled) return;
    
    const timestamp = new Date().toISOString();
    const transactionId = `gift-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const logData = {
      action,
      timestamp,
      transactionId,
      giftData,
      error: error || null
    };
    
    if (options.logToConsole) {
      if (error) {
        console.error(`[GIFT-DEBUG] ${action} FAILED:`, logData);
      } else {
        console.log(`[GIFT-DEBUG] ${action}:`, logData);
      }
    }
    
    if (options.logToServer) {
      // Send to server-side logging endpoint
      fetch(processApiUrl('/api/log-error'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'gift-debugger',
          level: error ? 'error' : 'info',
          data: logData
        })
      }).catch(err => {
        console.error('[GIFT-DEBUG] Failed to log to server:', err);
      });
    }
    
    return transactionId;
  }, [options]);
  
  return {
    trackGiftCreation: (giftData: any) => trackGiftAction('GIFT_CREATION', giftData),
    trackGiftSend: (giftData: any) => trackGiftAction('GIFT_SEND', giftData),
    trackGiftClaim: (giftData: any) => trackGiftAction('GIFT_CLAIM', giftData),
    trackGiftError: (action: string, giftData: any, error: any) => 
      trackGiftAction(`${action}_ERROR`, giftData, error),
    isEnabled: options.enabled
  };
};
