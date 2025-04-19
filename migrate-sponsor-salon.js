/**
 * Migration Script for sponsorSalonId
 * 
 * This script adds the sponsor_salon_id column to the clients table
 * to support the salon sponsorship tracking feature.
 */

import pg from 'pg';
const { Pool } = pg;

async function migrateSponsorSalon() {
  // Connect to database using environment variable
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if the column already exists
    console.log('Checking if sponsor_salon_id column exists...');
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='clients' AND column_name='sponsor_salon_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log('sponsor_salon_id column already exists, no migration needed');
      return;
    }

    console.log('Adding sponsor_salon_id column to clients table...');
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS sponsor_salon_id INTEGER
    `);
    
    console.log('Setting up foreign key constraint to salons table...');
    await pool.query(`
      ALTER TABLE clients
      ADD CONSTRAINT fk_sponsor_salon
      FOREIGN KEY (sponsor_salon_id)
      REFERENCES salons(id)
    `);

    // Migrate data - set sponsor_salon_id equal to salon_id where not null
    console.log('Migrating existing data - setting sponsor_salon_id equal to salon_id where available...');
    await pool.query(`
      UPDATE clients
      SET sponsor_salon_id = salon_id
      WHERE salon_id IS NOT NULL AND sponsor_salon_id IS NULL
    `);

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateSponsorSalon().catch(console.error);