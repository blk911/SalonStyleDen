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
  max: 20, // maximum number of clients the pool should contain
  connectionTimeoutMillis: 10000, // throw error if client has not connected after 10 seconds
  idleTimeoutMillis: 30000 // close & remove clients which have been idle > 30 seconds
});

// Add error handling to pool connections
pool.on('error', (err) => {
  log(`Unexpected error on idle client: ${err}`, 'db');
  // Don't crash the server on connection errors
});

// Create drizzle db instance
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