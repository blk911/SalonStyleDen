import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "../shared/schema";
import { log } from "./vite";

// Create SQLite database connection
const dbPath = './salonstylden.db';
log(`Initializing SQLite database at: ${dbPath}`, 'db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

log('SQLite database initialized successfully', 'db');

// Function to test SQLite connection
export async function getConnection() {
  try {
    return {
      query: (sql: string, params?: any[]) => {
        const stmt = sqlite.prepare(sql);
        return params ? stmt.all(params) : stmt.all();
      },
      release: () => {} // No-op for SQLite
    };
  } catch (error) {
    log(`Failed to get SQLite connection: ${error}`, 'db');
    throw error;
  }
}

// Function to ensure SQLite connection
export async function ensureConnection() {
  try {
    log('Testing SQLite database connection...', 'db');
    const result = sqlite.prepare('SELECT 1 as test').get();
    log('SQLite database connection successfully verified', 'db');
    return true;
  } catch (error) {
    log(`SQLite database connection error: ${error}`, 'db');
    return false;
  }
}

// Create drizzle db instance with SQLite
export const db = drizzle(sqlite, { schema });

// Export a function to check if the database is connected
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const result = sqlite.prepare('SELECT 1 as test').get();
    log('SQLite database health check passed', 'db');
    return true;
  } catch (error) {
    log(`SQLite database connection error: ${error}`, 'db');
    return false;
  }
}
