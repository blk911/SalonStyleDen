/**
 * Migration Script for making email optional in invitations table
 * 
 * This script alters the invitations table to make the email column optional
 * to support phone-only invitations for client-to-client invitations.
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
 * Make email column optional in invitations table
 */
async function migrateOptionalEmail() {
  logWithTimestamp('Starting migration to make email optional in invitations table');

  try {
    // Check if the email column exists and is not null
    const checkResult = await executeQuery(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invitations' 
      AND column_name = 'email'
    `);

    if (checkResult.rowCount === 0) {
      logWithTimestamp('email column does not exist in invitations table');
      return;
    }

    const isNullable = checkResult.rows[0].is_nullable === 'YES';
    
    if (isNullable) {
      logWithTimestamp('email column is already nullable in invitations table');
      return;
    }

    // Alter the email column to be nullable
    await executeQuery(`
      ALTER TABLE invitations 
      ALTER COLUMN email DROP NOT NULL
    `);

    logWithTimestamp('Successfully made email column optional in invitations table');

    // Verify the column was updated
    const verifyResult = await executeQuery(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invitations' 
      AND column_name = 'email'
    `);

    if (verifyResult.rowCount > 0 && verifyResult.rows[0].is_nullable === 'YES') {
      logWithTimestamp('Verified that email column is now nullable in invitations table');
    } else {
      throw new Error('Failed to make email column nullable in invitations table');
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
migrateOptionalEmail()
  .then(() => {
    logWithTimestamp('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logWithTimestamp(`Migration failed: ${error}`);
    process.exit(1);
  });