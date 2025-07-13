/**
 * VMB Debug Configuration
 * 
 * This file controls the visibility of debugging features.
 * Simplified version that maintains the same interface.
 */

import { safeParse } from "@shared/utils/json";

// Local storage key for configuration persistence
export const DEBUG_CONFIG_KEY = 'vmb_debug_config';

// Default configuration (development mode only)
export const defaultDebugConfig = {
  showConsoleMessages: false,    // Controls console messages
  showFlowTesting: false,        // Controls flow testing messages (disabled)
  showDevTools: false,           // Controls developer tool messages (disabled)
  showMonitoringDashboard: false // Controls monitoring dashboard visibility (disabled)
};

// Simplified get configuration function
export function getDebugConfig() {
  // Only try to load from localStorage in browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(DEBUG_CONFIG_KEY);
      if (saved) {
        return safeParse<typeof defaultDebugConfig>(saved) ?? { ...defaultDebugConfig };
      }
    } catch (err) {
      console.error('Failed to parse debug config', err);
    }
  }
  
  return { ...defaultDebugConfig };
}

// Simplified save configuration function
export function saveDebugConfig(config: typeof defaultDebugConfig) {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(DEBUG_CONFIG_KEY, JSON.stringify(config));
  }
}

// Simplified shouldLog function - determines if logs should be shown
export function shouldLog() {
  // Only log in development mode and if showConsoleMessages is true
  if (!import.meta.env.DEV) {
    return false;
  }
  const config = getDebugConfig();
  return config.showConsoleMessages;
}

// The following functions are kept for interface compatibility
// but with simplified implementations

export function enableConsoleMessages() {
  const config = getDebugConfig();
  config.showConsoleMessages = true;
  saveDebugConfig(config);
}

export function disableConsoleMessages() {
  const config = getDebugConfig();
  config.showConsoleMessages = false;
  saveDebugConfig(config);
}

export function toggleConsoleMessages() {
  const config = getDebugConfig();
  config.showConsoleMessages = !config.showConsoleMessages;
  saveDebugConfig(config);
  return config.showConsoleMessages;
}

export function shouldShowMonitoringDashboard() {
  return false; // Monitoring dashboard is disabled in this version
}

export function enableMonitoringDashboard() {
  // Monitoring dashboard is disabled in this version
}

export function disableMonitoringDashboard() {
  // Monitoring dashboard is disabled in this version
}

export function toggleMonitoringDashboard() {
  return false; // Monitoring dashboard is disabled in this version
}