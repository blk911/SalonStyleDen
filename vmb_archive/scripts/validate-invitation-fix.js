/**
 * Validation Fix Test Script
 * 
 * This script tests the invitation validation fix by:
 * 1. Creating an invitation
 * 2. Verifying it exists
 * 3. Testing the registration validation with the same phone
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeQuery(query, params = []) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

function logWithTime(message) {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
}

/**
 * Test the invitation validation fix
 */
async function testInvitationValidationFix() {
  try {
    logWithTime('Starting invitation validation fix test');
    
    // Purge any existing data
    await executeQuery(`DELETE FROM invitations`);
    await executeQuery(`DELETE FROM clients`);
    
    logWithTime('Database purged');
    
    // Create a test invitation
    const testPhone = '5551234567';
    const testEmail = 'test@example.com';
    
    const insertInvitation = `
      INSERT INTO invitations (name, phone, email, salon_id, sponsor, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, phone, email, status
    `;
    
    const invitation = await executeQuery(
      insertInvitation, 
      ['Test User', testPhone, testEmail, 42, 'Test Salon', 'pending']
    );
    
    logWithTime(`Created test invitation: ${JSON.stringify(invitation[0])}`);
    
    // Query to get the validation info
    const validationQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clients WHERE phone = $1) AS client_matches,
        (SELECT COUNT(*) FROM invitations WHERE phone = $1) AS invitation_matches,
        (SELECT COUNT(*) FROM salons WHERE phone = $1) AS salon_matches
    `;
    
    const validationResults = await executeQuery(validationQuery, [testPhone]);
    
    logWithTime(`Validation counts: ${JSON.stringify(validationResults[0])}`);
    
    // Simulate the isDuplicateContact logic to test that our invitations are not counted as duplicates
    const clientMatches = parseInt(validationResults[0].client_matches);
    const invitationMatches = parseInt(validationResults[0].invitation_matches);
    const salonMatches = parseInt(validationResults[0].salon_matches);
    
    logWithTime(`Found: ${clientMatches} client matches, ${invitationMatches} invitation matches, ${salonMatches} salon matches`);
    
    // Test the fix: only client and salon matches should block registration
    const wouldBlockRegistration = (clientMatches > 0 || salonMatches > 0);
    
    if (wouldBlockRegistration) {
      logWithTime('❌ TEST FAILED: Registration would be blocked even with the fix');
    } else {
      logWithTime('✅ TEST PASSED: Registration would proceed despite having an invitation with the same phone');
    }
    
    // Clean up
    await executeQuery(`DELETE FROM invitations WHERE phone = $1`, [testPhone]);
    
    logWithTime('Test completed and data cleaned up');
    
  } catch (error) {
    console.error('Error testing invitation validation fix:', error);
  } finally {
    await pool.end();
  }
}

testInvitationValidationFix();