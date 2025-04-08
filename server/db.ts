import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import { log } from "./vite";

// Create postgres connection
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString, { ssl: 'require', max: 1 });

if (!connectionString) {
  log('DATABASE_URL environment variable is not set', 'db');
}

// Create drizzle db instance
export const db = drizzle(client, { schema });

// Export a function to check if the database is connected
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}