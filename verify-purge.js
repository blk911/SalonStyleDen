/**
 * Verify Purge Script
 * 
 * This script checks the database to ensure purge was successful
 * and only the specified salons remain.
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

async function verifyPurge() {
  try {
    const client = await pool.connect();
    
    // Check remaining salons
    const salonResult = await client.query('SELECT id, name FROM salons ORDER BY id');
    console.log('Remaining salons:');
    salonResult.rows.forEach(salon => {
      console.log(`  ${salon.id}: ${salon.name}`);
    });
    
    // Check client count
    const clientResult = await client.query('SELECT COUNT(*) FROM clients');
    console.log(`\nRemaining clients: ${clientResult.rows[0].count}`);
    
    // Check invitation count
    const invitationResult = await client.query('SELECT COUNT(*) FROM invitations');
    console.log(`Remaining invitations: ${invitationResult.rows[0].count}`);
    
    // Check style selection count
    const styleResult = await client.query('SELECT COUNT(*) FROM style_selections');
    console.log(`Remaining style selections: ${styleResult.rows[0].count}`);
    
    // Check activity log count
    const logResult = await client.query('SELECT COUNT(*) FROM activity_logs');
    console.log(`Remaining activity logs: ${logResult.rows[0].count}`);
    
    client.release();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute verification
verifyPurge();