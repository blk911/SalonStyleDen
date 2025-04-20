/**
 * Monitoring Context
 * 
 * Provides application-wide access to the activity monitoring system
 * for tracking user interactions, API requests, and system events.
 */
import React, { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
import activityMonitor, { 
  KeystrokeEvent, 
  ApiEvent, 
  ActivityEvent, 
  trackKeystroke, 
  trackApiRequest, 
  trackActivity
} from '@/lib/activity-monitor';

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

const defaultContext: MonitoringContextType = {
  isMonitoringEnabled: false,
  enableMonitoring: () => {},
  disableMonitoring: () => {},
  keystrokeHistory: [],
  apiHistory: [],
  activityHistory: [],
  clearHistory: () => {},
  trackKeystroke,
  trackApiRequest,
  trackActivity
};

const MonitoringContext = createContext<MonitoringContextType>(defaultContext);

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(false);
  const [keystrokeHistory, setKeystrokeHistory] = useState<KeystrokeEvent[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiEvent[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityEvent[]>([]);
  
  // Load monitoring state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('vmbMonitoringEnabled');
    if (savedState === 'true') {
      setIsMonitoringEnabled(true);
      console.log('[VMB Monitoring] Monitoring enabled from saved state');
    }
  }, []);
  
  // Update state with current history every 1 second
  useEffect(() => {
    if (!isMonitoringEnabled) return;
    
    const interval = setInterval(() => {
      setKeystrokeHistory(activityMonitor.getKeystrokeHistory());
      setApiHistory(activityMonitor.getApiHistory());
      setActivityHistory(activityMonitor.getActivityHistory());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isMonitoringEnabled]);
  
  const enableMonitoring = useCallback(() => {
    setIsMonitoringEnabled(true);
    localStorage.setItem('vmbMonitoringEnabled', 'true');
    console.log('[VMB Monitoring] Monitoring enabled');
  }, []);
  
  const disableMonitoring = useCallback(() => {
    setIsMonitoringEnabled(false);
    localStorage.setItem('vmbMonitoringEnabled', 'false');
    console.log('[VMB Monitoring] Monitoring disabled');
  }, []);
  
  const clearHistory = useCallback(() => {
    activityMonitor.clearHistory();
    setKeystrokeHistory([]);
    setApiHistory([]);
    setActivityHistory([]);
  }, []);
  
  const value = {
    isMonitoringEnabled,
    enableMonitoring,
    disableMonitoring,
    keystrokeHistory,
    apiHistory,
    activityHistory,
    clearHistory,
    trackKeystroke,
    trackApiRequest,
    trackActivity
  };
  
  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}