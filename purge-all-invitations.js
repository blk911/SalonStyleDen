/**
 * Purge All Invitations Script
 * 
 * This script will delete all client invitation records from the database.
 * Use this to reset the invitation system for fresh development testing.
 */

import pg from 'pg';
import { config } from 'dotenv';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Configure environment
config();

// Create PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(query, params);
  } finally {
    client.release();
  }
}

function logWithTime(message) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Purge all invitations from the database
 */
async function purgeAllInvitations() {
  logWithTime('Starting invitation purge process...');

  try {
    // Get count before deletion
    const countResult = await executeQuery(
      'SELECT COUNT(*) FROM invitations'
    );
    const invitationCount = parseInt(countResult.rows[0].count);
    logWithTime(`Found ${invitationCount} invitations to purge`);

    if (invitationCount === 0) {
      logWithTime('No invitations to purge. Database is already clean.');
      return;
    }

    // Create activity log entry for the purge with timestamp
    await executeQuery(
      'INSERT INTO activity_logs (type, description, timestamp) VALUES ($1, $2, $3)',
      ['system_maintenance', 'Purged all invitations for development testing', new Date()]
    );
    logWithTime('Created activity log entry for the purge operation');

    // Delete all invitations
    const deleteResult = await executeQuery('DELETE FROM invitations');
    logWithTime(`Successfully purged all invitations from database`);

    // Reset the id sequence to avoid large gaps in IDs
    await executeQuery('ALTER SEQUENCE invitations_id_seq RESTART WITH 1');
    logWithTime('Reset invitation ID sequence to 1');

    logWithTime('Invitation purge completed successfully!');
  } catch (error) {
    logWithTime(`ERROR: ${error.message}`);
    console.error(error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Execute the purge function
purgeAllInvitations();