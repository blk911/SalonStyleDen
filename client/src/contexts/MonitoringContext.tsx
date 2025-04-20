/**
 * Monitoring Context
 * 
 * Provides application-wide access to the activity monitoring system
 * for tracking user interactions, API requests, and system events.
 */
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import activityMonitor, { ActivityEvent, ApiEvent, KeystrokeEvent } from '@/lib/activity-monitor';

interface MonitoringContextType {
  isMonitoringEnabled: boolean;
  enableMonitoring: () => void;
  disableMonitoring: () => void;
  keystrokeHistory: KeystrokeEvent[];
  apiHistory: ApiEvent[];
  activityHistory: ActivityEvent[];
  clearHistory: () => void;
  trackKeystroke: typeof activityMonitor.trackKeystroke;
  trackApiRequest: typeof activityMonitor.trackApiRequest;
  trackActivity: typeof activityMonitor.trackActivity;
}

// Create context with default values
const MonitoringContext = createContext<MonitoringContextType>({
  isMonitoringEnabled: false,
  enableMonitoring: () => {},
  disableMonitoring: () => {},
  keystrokeHistory: [],
  apiHistory: [],
  activityHistory: [],
  clearHistory: () => {},
  trackKeystroke: activityMonitor.trackKeystroke,
  trackApiRequest: activityMonitor.trackApiRequest,
  trackActivity: activityMonitor.trackActivity
});

// Provider component
export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState<boolean>(false);
  const [keystrokeHistory, setKeystrokeHistory] = useState<KeystrokeEvent[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiEvent[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityEvent[]>([]);
  
  // Enable monitoring
  const enableMonitoring = () => {
    setIsMonitoringEnabled(true);
    console.log('[MONITORING] Enabled');
  };
  
  // Disable monitoring
  const disableMonitoring = () => {
    setIsMonitoringEnabled(false);
    console.log('[MONITORING] Disabled');
  };
  
  // Clear all history
  const clearHistory = () => {
    activityMonitor.clearHistory();
    setKeystrokeHistory([]);
    setApiHistory([]);
    setActivityHistory([]);
  };
  
  // Update history periodically when monitoring is enabled
  useEffect(() => {
    if (!isMonitoringEnabled) return;
    
    const intervalId = setInterval(() => {
      setKeystrokeHistory(activityMonitor.getKeystrokeHistory());
      setApiHistory(activityMonitor.getApiHistory());
      setActivityHistory(activityMonitor.getActivityHistory());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isMonitoringEnabled]);
  
  return (
    <MonitoringContext.Provider
      value={{
        isMonitoringEnabled,
        enableMonitoring,
        disableMonitoring,
        keystrokeHistory,
        apiHistory,
        activityHistory,
        clearHistory,
        trackKeystroke: activityMonitor.trackKeystroke,
        trackApiRequest: activityMonitor.trackApiRequest,
        trackActivity: activityMonitor.trackActivity
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
}

// Custom hook for using the monitoring context
export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}

export default MonitoringContext;