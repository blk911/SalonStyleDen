/**
 * Test Data Purge Script
 * 
 * This script purges test clients and invitations while preserving salon data
 * for development testing of the registration flow.
 */

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

async function purgeTestData() {
  try {
    console.log('Starting test data purge...');
    
    // Begin transaction
    await executeQuery('BEGIN');
    
    // 1. Remove all activity logs related to clients and invitations
    console.log('Removing activity logs related to clients and invitations...');
    const activityLogResult = await executeQuery(
      `DELETE FROM activity_logs 
       WHERE description LIKE '%client%' OR 
             description LIKE '%invitation%' OR 
             description LIKE '%invite%' OR 
             description LIKE '%VMB-INV-%'`
    );
    console.log(`Removed ${activityLogResult.rowCount} activity logs`);
    
    // 2. Remove all style selections
    console.log('Removing style selections...');
    const styleSelectionsResult = await executeQuery('DELETE FROM style_selections');
    console.log(`Removed ${styleSelectionsResult.rowCount} style selections`);
    
    // 3. Remove all invitations
    console.log('Removing invitations...');
    const invitationResult = await executeQuery('DELETE FROM invitations');
    console.log(`Removed ${invitationResult.rowCount} invitations`);
    
    // 4. Remove all clients
    console.log('Removing clients...');
    const clientResult = await executeQuery('DELETE FROM clients');
    console.log(`Removed ${clientResult.rowCount} clients`);
    
    // Commit transaction
    await executeQuery('COMMIT');
    console.log('Test data purge completed successfully');
    
  } catch (error) {
    // Rollback transaction on error
    await executeQuery('ROLLBACK');
    console.error('Error during data purge:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the purge operation
purgeTestData();