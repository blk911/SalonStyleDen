/**
 * Verify Invitations Script
 * 
 * This script checks the invitations table to ensure all invitations were purged.
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

async function verifyInvitations() {
  try {
    // Count remaining invitations
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM invitations');
    console.log('Remaining invitations:', result.rows[0].count);
    
    // Count clients for reference
    const clientResult = await client.query('SELECT COUNT(*) FROM clients');
    console.log('Total clients:', clientResult.rows[0].count);
    
    client.release();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute verification
verifyInvitations();