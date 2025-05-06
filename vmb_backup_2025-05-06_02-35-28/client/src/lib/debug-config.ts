/**
 * VMB Debug Configuration
 * 
 * This file controls the visibility of debugging features.
 * Modify these settings to show/hide development tool messages.
 */

// These get saved to localStorage for persistence
export const DEBUG_CONFIG_KEY = 'vmb_debug_config';

// Default configuration
export const defaultDebugConfig = {
  showConsoleMessages: false,  // Controls console messages
  showFlowTesting: false,      // Controls flow testing messages
  showDevTools: false,         // Controls developer tool messages
  showMonitoringDashboard: false  // Controls VMB Testing Monitor visibility
};

// Get current debug configuration from localStorage
export function getDebugConfig() {
  try {
    const saved = localStorage.getItem(DEBUG_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to parse debug config', err);
  }
  
  return { ...defaultDebugConfig };
}

// Save debug configuration to localStorage
export function saveDebugConfig(config: typeof defaultDebugConfig) {
  localStorage.setItem(DEBUG_CONFIG_KEY, JSON.stringify(config));
}

// Use this to conditionally display console messages
export function shouldLog() {
  const config = getDebugConfig();
  return config.showConsoleMessages;
}

// Enable console messages
export function enableConsoleMessages() {
  const config = getDebugConfig();
  config.showConsoleMessages = true;
  saveDebugConfig(config);
}

// Disable console messages
export function disableConsoleMessages() {
  const config = getDebugConfig();
  config.showConsoleMessages = false;
  saveDebugConfig(config);
}

// Toggle console messages
export function toggleConsoleMessages() {
  const config = getDebugConfig();
  config.showConsoleMessages = !config.showConsoleMessages;
  saveDebugConfig(config);
  return config.showConsoleMessages;
}

// Check if monitoring dashboard should be shown
export function shouldShowMonitoringDashboard() {
  const config = getDebugConfig();
  return config.showMonitoringDashboard;
}

// Enable monitoring dashboard
export function enableMonitoringDashboard() {
  const config = getDebugConfig();
  config.showMonitoringDashboard = true;
  saveDebugConfig(config);
}

// Disable monitoring dashboard
export function disableMonitoringDashboard() {
  const config = getDebugConfig();
  config.showMonitoringDashboard = false;
  saveDebugConfig(config);
}

// Toggle monitoring dashboard visibility
export function toggleMonitoringDashboard() {
  const config = getDebugConfig();
  config.showMonitoringDashboard = !config.showMonitoringDashboard;
  saveDebugConfig(config);
  return config.showMonitoringDashboard;
}