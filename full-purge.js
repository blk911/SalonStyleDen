/**
 * Full Purge Script
 * 
 * This script performs a complete purge of all client data, invitations,
 * style selections, and related artifacts while preserving salon data.
 * Use this to reset the application to a clean state for testing.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Configure websockets for Neon serverless
neonConfig.webSocketConstructor = ws;

// Configure database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper function to execute database queries
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper to log with timestamp
function logWithTime(message) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

// Execute the full purge
async function fullPurge() {
  try {
    logWithTime('Starting full purge operation...');
    
    // Begin transaction
    await executeQuery('BEGIN');
    
    // 1. Check database tables before purge
    logWithTime('Checking database state before purge...');
    
    const tables = [
      'clients', 
      'invitations', 
      'style_selections', 
      'activity_logs',
      'salons'
    ];
    
    for (const table of tables) {
      const countResult = await executeQuery(`SELECT COUNT(*) FROM ${table}`);
      logWithTime(`${table}: ${countResult.rows[0].count} records`);
    }
    
    // 2. Remove all style selections
    logWithTime('Purging style selections...');
    const styleResult = await executeQuery('DELETE FROM style_selections');
    logWithTime(`Removed ${styleResult.rowCount} style selections`);
    
    // 3. Remove all VMB invitation logs and other activity logs
    logWithTime('Purging activity logs...');
    
    // Let's check the structure of the activity_logs table first
    const activityLogsStructure = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs'
    `);
    
    logWithTime(`Activity logs table columns: ${activityLogsStructure.rows.map(r => r.column_name).join(', ')}`);
    
    // Use a simpler query that should work with any structure
    const activityLogResult = await executeQuery(`
      DELETE FROM activity_logs 
      WHERE description LIKE '%client%' 
         OR description LIKE '%invitation%' 
         OR description LIKE '%invite%'
         OR description LIKE '%VMB-INV-%'
    `);
    
    logWithTime(`Removed ${activityLogResult.rowCount} activity logs`);
    
    // 5. Remove all invitations
    logWithTime('Purging invitations...');
    const invitationResult = await executeQuery('DELETE FROM invitations');
    logWithTime(`Removed ${invitationResult.rowCount} invitations`);
    
    // 6. Remove all clients
    logWithTime('Purging clients...');
    const clientResult = await executeQuery('DELETE FROM clients');
    logWithTime(`Removed ${clientResult.rowCount} clients`);
    
    // Optional: Remove uploaded client photos from the uploads directory
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsDir)) {
        logWithTime('Cleaning uploaded files...');
        const files = fs.readdirSync(uploadsDir);
        
        // Only remove client-related uploads (assuming they follow a naming pattern)
        const clientUploads = files.filter(file => 
          file.startsWith('client-') || 
          file.includes('profile-') ||
          file.includes('-client-')
        );
        
        for (const file of clientUploads) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
        
        logWithTime(`Removed ${clientUploads.length} client upload files`);
      }
    } catch (fileError) {
      logWithTime(`Warning: Could not clean upload directory: ${fileError.message}`);
      // Continue with purge even if file cleanup fails
    }
    
    // Commit all changes
    await executeQuery('COMMIT');
    
    // Verify purge was successful
    logWithTime('Verifying purge results...');
    
    for (const table of ['clients', 'invitations', 'style_selections']) {
      const verifyResult = await executeQuery(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(verifyResult.rows[0].count);
      
      if (count === 0) {
        logWithTime(`✅ ${table} successfully purged`);
      } else {
        logWithTime(`⚠️ ${table} purge incomplete - ${count} records remain`);
      }
    }
    
    // Check salons are preserved
    const salonVerifyResult = await executeQuery('SELECT COUNT(*) FROM salons');
    logWithTime(`Salons preserved: ${salonVerifyResult.rows[0].count} records`);
    
    logWithTime('Full purge completed successfully');
    
  } catch (error) {
    // Rollback in case of error
    try {
      await executeQuery('ROLLBACK');
      logWithTime('Transaction rolled back due to error');
    } catch (rollbackError) {
      logWithTime(`Error during rollback: ${rollbackError.message}`);
    }
    
    logWithTime(`Error during purge operation: ${error.message}`);
    console.error(error);
  } finally {
    // Close the pool
    await pool.end();
    logWithTime('Database connection closed');
  }
}

// Execute the purge
fullPurge();