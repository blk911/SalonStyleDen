/**
 * Migration Script for adding sponsor_name to clients table
 * 
 * This script adds the sponsor_name column to the clients table
 * to support properly tracking which client invited another client.
 */

import pg from 'pg';
const { Pool } = pg;

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Add sponsor_name column to clients table
 */
async function migrateSponsorNameColumn() {
  logWithTimestamp('Starting migration to add sponsor_name column to clients table');

  try {
    // Check if the column already exists
    const checkResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND column_name = 'sponsor_name'
    `);

    if (checkResult.rowCount > 0) {
      logWithTimestamp('sponsor_name column already exists in clients table');
      return;
    }

    // Add the sponsor_name column
    await executeQuery(`
      ALTER TABLE clients 
      ADD COLUMN sponsor_name TEXT
    `);

    logWithTimestamp('Successfully added sponsor_name column to clients table');

    // Verify the column was added
    const verifyResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND column_name = 'sponsor_name'
    `);

    if (verifyResult.rowCount > 0) {
      logWithTimestamp('Verified that sponsor_name column exists in clients table');
    } else {
      throw new Error('Failed to add sponsor_name column to clients table');
    }

    // Initialize the sponsor_name column based on the existing sponsor column
    await executeQuery(`
      UPDATE clients
      SET sponsor_name = sponsor
      WHERE sponsor IS NOT NULL AND sponsor != ''
    `);

    logWithTimestamp('Initialized sponsor_name values from existing sponsor values');

  } catch (error) {
    logWithTimestamp(`Error during migration: ${error}`);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
migrateSponsorNameColumn()
  .then(() => {
    logWithTimestamp('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logWithTimestamp(`Migration failed: ${error}`);
    process.exit(1);
  });