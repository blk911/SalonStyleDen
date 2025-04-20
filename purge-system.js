/**
 * Full System Purge Script
 * 
 * This script performs a complete purge of all application data except for:
 * - Ven Me, Baby! LTD (ID 43)
 * - TIFFANY_5280 NAILS STUDIO (ID 42)
 *
 * It will remove:
 * 1. All clients
 * 2. All invitations
 * 3. All salons except the two specified
 * 4. All style selections
 * 5. All activity logs 
 * 6. Reset all sequence counters
 */

import pg from 'pg';
import { config } from 'dotenv';

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
 * Perform full system purge
 */
async function purgeSystem() {
  logWithTime('Starting full system purge process...');

  try {
    // Check database structure
    const tableResult = await executeQuery(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    const tables = tableResult.rows.map(row => row.tablename);
    logWithTime(`Found tables: ${tables.join(', ')}`);

    // Begin transaction
    await executeQuery('BEGIN');

    // Temporarily disable foreign key constraints
    await executeQuery('SET CONSTRAINTS ALL DEFERRED');
    logWithTime('Temporarily disabled foreign key constraints');

    // 5. First purge all activity logs to remove foreign key constraints
    const activityLogCount = await executeQuery('SELECT COUNT(*) FROM activity_logs');
    logWithTime(`Found ${activityLogCount.rows[0].count} activity logs to purge`);
    await executeQuery('DELETE FROM activity_logs');
    logWithTime('Successfully purged all activity logs');
    
    // Add new system purge activity log
    await executeQuery(
      'INSERT INTO activity_logs (type, description, timestamp) VALUES ($1, $2, $3)',
      ['system_maintenance', 'Full system purge for development testing', new Date()]
    );
    logWithTime('Created new activity log entry for the purge operation');

    // 1. Purge all invitations
    const invitationsResult = await executeQuery('SELECT COUNT(*) FROM invitations');
    const invitationCount = parseInt(invitationsResult.rows[0].count);
    logWithTime(`Found ${invitationCount} invitations to purge`);
    
    if (invitationCount > 0) {
      await executeQuery('DELETE FROM invitations');
      await executeQuery('ALTER SEQUENCE invitations_id_seq RESTART WITH 1');
      logWithTime('Successfully purged all invitations');
    }

    // 2. Purge all style selections
    const styleSelectionsResult = await executeQuery('SELECT COUNT(*) FROM style_selections');
    const styleSelectionCount = parseInt(styleSelectionsResult.rows[0].count);
    logWithTime(`Found ${styleSelectionCount} style selections to purge`);
    
    if (styleSelectionCount > 0) {
      await executeQuery('DELETE FROM style_selections');
      await executeQuery('ALTER SEQUENCE style_selections_id_seq RESTART WITH 1');
      logWithTime('Successfully purged all style selections');
    }

    // 3. Purge all clients
    const clientsResult = await executeQuery('SELECT COUNT(*) FROM clients');
    const clientCount = parseInt(clientsResult.rows[0].count);
    logWithTime(`Found ${clientCount} clients to purge`);
    
    if (clientCount > 0) {
      await executeQuery('DELETE FROM clients');
      await executeQuery('ALTER SEQUENCE clients_id_seq RESTART WITH 1');
      logWithTime('Successfully purged all clients');
    }

    // 4. Purge all salons except Ven Me, Baby! LTD and TIFFANY_5280 NAILS STUDIO
    const salonsResult = await executeQuery(
      "SELECT COUNT(*) FROM salons WHERE id NOT IN (43, 42)"
    );
    const salonCount = parseInt(salonsResult.rows[0].count);
    logWithTime(`Found ${salonCount} salons to purge (excluding Ven Me, Baby! LTD and TIFFANY_5280 NAILS STUDIO)`);
    
    if (salonCount > 0) {
      await executeQuery('DELETE FROM salons WHERE id NOT IN (43, 42)');
      logWithTime('Successfully purged all salons except Ven Me, Baby! LTD and TIFFANY_5280 NAILS STUDIO');
    }

    // 6. Reset sequence counters
    await executeQuery('ALTER SEQUENCE salons_id_seq RESTART WITH 100');
    logWithTime('Reset salon ID sequence to 100');

    // Create verification log
    await executeQuery(
      'INSERT INTO activity_logs (type, description, timestamp) VALUES ($1, $2, $3)',
      ['system_maintenance', 'System purge completed successfully', new Date()]
    );

    // Commit the transaction
    await executeQuery('COMMIT');
    logWithTime('Transaction committed successfully');

    logWithTime('System purge completed successfully!');
  } catch (error) {
    // Rollback transaction on error
    try {
      await executeQuery('ROLLBACK');
      logWithTime('Transaction rolled back due to error');
    } catch (rollbackError) {
      logWithTime(`ERROR during rollback: ${rollbackError.message}`);
    }
    
    logWithTime(`ERROR: ${error.message}`);
    console.error(error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Execute the purge function
purgeSystem();