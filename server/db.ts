import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";
import { log } from "./vite";

// Configure websockets for Neon serverless
neonConfig.webSocketConstructor = ws;

// Create postgres connection
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  log('DATABASE_URL environment variable is not set', 'db');
}

// Create a connection pool with more resilient settings
export const pool = new Pool({ 
  connectionString,
  max: 3, // Reduce max connections to avoid hitting rate limits
  connectionTimeoutMillis: 15000, // Increase timeout for slower connections
  idleTimeoutMillis: 10000, // Reduce idle timeout to release connections faster
  allowExitOnIdle: true // Allow the pool to exit when idle
});

// Add robust error handling to pool connections
pool.on('error', (err) => {
  log(`Unexpected error on idle client: ${err}`, 'db');
  // Don't crash the server on connection errors
});

// Create connection management system
let isConnecting = false;
let lastConnectAttempt = 0;
const RECONNECT_INTERVAL = 5000; // 5 seconds between reconnection attempts

// Function to safely get a connection with retries
export async function getConnection() {
  try {
    return await pool.connect();
  } catch (error) {
    log(`Failed to get connection: ${error}`, 'db');
    throw error;
  }
}

// Function to reconnect the pool if needed
export async function ensureConnection() {
  const now = Date.now();
  if (isConnecting || (now - lastConnectAttempt < RECONNECT_INTERVAL)) {
    return; // Avoid multiple simultaneous reconnection attempts
  }
  
  isConnecting = true;
  lastConnectAttempt = now;
  
  try {
    log('Testing database connection...', 'db');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    log('Database connection successfully verified', 'db');
  } catch (error) {
    log(`Database connection error: ${error}. Will retry in ${RECONNECT_INTERVAL}ms.`, 'db');
  } finally {
    isConnecting = false;
  }
}

// Setup periodic connection check
setInterval(ensureConnection, 30000);

// Create drizzle db instance with enhanced error handling
export const db = drizzle({ client: pool, schema });

// Export a function to check if the database is connected
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    // Replace console.error with log to maintain consistency
    log(`Database connection error: ${error}`, 'db');
    return false;
  }
}