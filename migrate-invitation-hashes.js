/**
 * Invitation Hash Migration Script
 * 
 * This script updates existing invitations to add unique hash identifiers
 * following the format VMB-INV-{random}-{timestamp}
 */

const { Pool } = require('pg');

// Generate a unique invitation hash in the format VMB-INV-{random}-{timestamp}
function generateInviteHash() {
  // Generate a random alphanumeric string (6 characters, uppercase)
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Get current timestamp in base36 (more compact representation)
  const timestamp = Date.now().toString(36);
  
  // Combine into the required format
  return `VMB-INV-${randomPart}-${timestamp}`;
}

async function migrateInvitationHashes() {
  // Create a PostgreSQL client using the same database URL as the application
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting invitation hash migration...');
    
    // Check if the invite_hash column exists
    try {
      const columnCheckResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='invitations' AND column_name='invite_hash'
      `);
      
      if (columnCheckResult.rows.length === 0) {
        console.log('Adding invite_hash column to invitations table...');
        await pool.query(`
          ALTER TABLE invitations 
          ADD COLUMN invite_hash TEXT UNIQUE
        `);
        console.log('Added invite_hash column successfully');
      } else {
        console.log('invite_hash column already exists');
      }
    } catch (error) {
      console.error('Error checking/adding column:', error);
      throw error;
    }
    
    // Get all invitations that don't have a hash yet
    const { rows: invitations } = await pool.query(`
      SELECT id FROM invitations 
      WHERE invite_hash IS NULL
    `);
    
    console.log(`Found ${invitations.length} invitations to update`);
    
    // Update each invitation with a unique hash
    for (const invitation of invitations) {
      const hash = generateInviteHash();
      console.log(`Updating invitation ${invitation.id} with hash: ${hash}`);
      
      await pool.query(
        'UPDATE invitations SET invite_hash = $1 WHERE id = $2',
        [hash, invitation.id]
      );
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateInvitationHashes();