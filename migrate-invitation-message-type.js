/**
 * Migration Script for adding message and type fields to invitations table
 * 
 * This script adds:
 * 1. message column to the invitations table to support custom messages
 * 2. type column to the invitations table to differentiate invitation types
 */

import pkg from 'pg';
const { Pool } = pkg;

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Add message and type columns to invitations table
 */
async function migrateMessageAndTypeColumns() {
  logWithTimestamp('Starting migration - Adding message and type columns to invitations table');
  
  try {
    // Check if message column exists
    const messageCheckResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invitations' 
      AND column_name = 'message'
    `);
    
    const messageColumnExists = messageCheckResult.rowCount > 0;
    
    if (!messageColumnExists) {
      logWithTimestamp('Message column does not exist, adding it...');
      await executeQuery(`
        ALTER TABLE invitations
        ADD COLUMN message TEXT
      `);
      logWithTimestamp('Successfully added message column to invitations table');
    } else {
      logWithTimestamp('Message column already exists, skipping...');
    }
    
    // Check if type column exists
    const typeCheckResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invitations' 
      AND column_name = 'type'
    `);
    
    const typeColumnExists = typeCheckResult.rowCount > 0;
    
    if (!typeColumnExists) {
      logWithTimestamp('Type column does not exist, adding it...');
      await executeQuery(`
        ALTER TABLE invitations
        ADD COLUMN type TEXT
      `);
      logWithTimestamp('Successfully added type column to invitations table');
    } else {
      logWithTimestamp('Type column already exists, skipping...');
    }
    
    logWithTimestamp('Migration completed successfully');
  } catch (error) {
    logWithTimestamp(`Error during migration: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateMessageAndTypeColumns();