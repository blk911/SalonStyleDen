/**
 * Clear Corrupted Storage Script
 * Removes all localStorage items that might contain corrupted JSON data
 */

console.log('🧹 Starting localStorage cleanup...');

// Keys that might contain corrupted data
const keysToCheck = [
  'vmb_debug_config',
  'vmb-style-section-open',
  'vmb-schedule-section-open',
  'vmb-invitation-section-open',
  'vmb-account-section-open',
  'vmb-invite-style-section-open',
  'vmb-completed-tours',
  'vmb-dismissed-help',
  'vmbMonitoringEnabled'
];

let clearedCount = 0;

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  // Clear all VMB-related localStorage keys
  keysToCheck.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`Clearing ${key}: ${value}`);
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  // Clear any other keys that might contain "[object Object]"
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value && value.includes('[object Object]')) {
      console.log(`Clearing corrupted key ${key}: ${value}`);
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`✅ Cleared ${clearedCount} corrupted localStorage items`);
} else {
  console.log('❌ localStorage not available');
}

console.log('🎉 Storage cleanup complete!');