/**
 * Migration Script for adding sender_id to invitations table
 * 
 * This script adds the sender_id column to the invitations table
 * to support the client-to-client invitation feature.
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
 * Add sender_id column to invitations table
 */
async function migrateSenderIdColumn() {
  logWithTimestamp('Starting migration to add sender_id column to invitations table');

  try {
    // Check if the column already exists
    const checkResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invitations' 
      AND column_name = 'sender_id'
    `);

    if (checkResult.rowCount > 0) {
      logWithTimestamp('sender_id column already exists in invitations table');
      return;
    }

    // Add the sender_id column
    await executeQuery(`
      ALTER TABLE invitations 
      ADD COLUMN sender_id INTEGER REFERENCES clients(id)
    `);

    logWithTimestamp('Successfully added sender_id column to invitations table');

    // Verify the column was added
    const verifyResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invitations' 
      AND column_name = 'sender_id'
    `);

    if (verifyResult.rowCount > 0) {
      logWithTimestamp('Verified that sender_id column exists in invitations table');
    } else {
      throw new Error('Failed to add sender_id column to invitations table');
    }

  } catch (error) {
    logWithTimestamp(`Error during migration: ${error}`);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
migrateSenderIdColumn()
  .then(() => {
    logWithTimestamp('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logWithTimestamp(`Migration failed: ${error}`);
    process.exit(1);
  });