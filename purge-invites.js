/**
 * VMB Quick Invitation Purge Script
 * 
 * This script runs without prompts and:
 * 1. Resets all invitations to 'pending' status
 * 2. Logs the invitation data before and after the operation
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  console.log('VMB QUICK INVITATION PURGE SCRIPT');
  console.log('================================');
  
  try {
    // Step 1: Get current invitation data
    const initialQuery = await pool.query('SELECT id, name, email, phone, status FROM invitations');
    console.log('\nCurrent invitations:');
    console.table(initialQuery.rows);
    console.log(`Total: ${initialQuery.rows.length} invitation(s)`);
    
    // Step 2: Reset all invitations to 'pending'
    const updateResult = await pool.query(`
      UPDATE invitations 
      SET status = 'pending' 
      RETURNING id, name, status
    `);
    
    console.log('\nSuccessfully reset invitations to "pending" status:');
    console.table(updateResult.rows);
    console.log(`${updateResult.rows.length} invitation(s) updated.`);
    
    // Optional: Clear style selections if needed
    const styleResult = await pool.query('DELETE FROM style_selections RETURNING *');
    console.log('\nCleared style selections:');
    if (styleResult.rows.length > 0) {
      console.table(styleResult.rows);
    } else {
      console.log('No style selections found.');
    }
    console.log(`${styleResult.rows.length} style selection(s) deleted.`);
    
    console.log('\nOperation completed successfully.');
  } catch (error) {
    console.error('Error during invitation purge:', error);
  } finally {
    // Close the pool connection
    await pool.end();
  }
}

// Execute the script
run();