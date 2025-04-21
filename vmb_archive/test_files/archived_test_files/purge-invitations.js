/**
 * Client Invitation Purge Script
 * 
 * This script will delete all client invitation records while preserving salons,
 * and can be run whenever a fresh start is needed for the invitation system.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// PostgreSQL connection
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

/**
 * Purge invitations and related data
 */
async function purgeInvitations() {
  try {
    console.log('Starting invitation purge process...');
    
    // Count invitations before purge
    const countResult = await executeQuery('SELECT COUNT(*) FROM invitations');
    const invitationCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${invitationCount} invitations to purge`);

    if (invitationCount === 0) {
      console.log('No invitations to purge. Database is already clean.');
      return;
    }

    // Remove all activity logs related to invitations first
    console.log('Removing activity logs related to invitations...');
    const activityLogResult = await executeQuery(
      `DELETE FROM activity_logs 
       WHERE description LIKE '%invitation%' OR description LIKE '%invite%'`
    );
    console.log(`Removed ${activityLogResult.rowCount} activity logs related to invitations`);

    // Remove all invitations
    console.log('Removing all invitations...');
    const invitationResult = await executeQuery('DELETE FROM invitations');
    console.log(`Successfully removed ${invitationResult.rowCount} invitations`);

    // Verify purge was successful
    const verifyResult = await executeQuery('SELECT COUNT(*) FROM invitations');
    const remainingCount = parseInt(verifyResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log('✅ Invitation purge completed successfully');
    } else {
      console.error(`❌ Purge incomplete - ${remainingCount} invitations still remain`);
    }

  } catch (error) {
    console.error('Error during invitation purge:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Execute the purge function
purgeInvitations();