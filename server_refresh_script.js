/**
 * Server Auto-Refresh Script
 * This script will send a health check request to the server every 2 minutes
 * for a total of 100 cycles to keep the connection alive.
 */

import fetch from 'node-fetch';

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
const MAX_CYCLES = 100;
let currentCycle = 0;

// We need the full URL for Node.js to make the request
const BASE_URL = 'https://3c4c1f5a-f7ae-45ac-b429-aa7ee2d81d5e-00-3gv27ws8i144z.riker.replit.dev';
const HEALTH_CHECK_URL = `${BASE_URL}/api/health`;

async function checkServerHealth() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Cycle ${currentCycle + 1}/${MAX_CYCLES}: Refreshing server connection...`);
    
    const response = await fetch(HEALTH_CHECK_URL);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[${new Date().toLocaleTimeString()}] Server health check successful:`, data);
    } else {
      console.error(`[${new Date().toLocaleTimeString()}] Server health check failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error checking server health:`, error);
  }
  
  currentCycle++;
  
  if (currentCycle < MAX_CYCLES) {
    setTimeout(checkServerHealth, REFRESH_INTERVAL);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] Completed all ${MAX_CYCLES} refresh cycles.`);
  }
}

// Start the refresh cycle
console.log(`[${new Date().toLocaleTimeString()}] Starting server refresh cycle: Will check every ${REFRESH_INTERVAL/1000} seconds for ${MAX_CYCLES} cycles.`);
checkServerHealth();