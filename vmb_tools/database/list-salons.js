/**
 * Simple script to list all salons in the database
 */

import pg from 'pg';
const { Pool } = pg;

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

// Use simple SQL query to list salons
const query = `
SELECT id, name, owner_name as "ownerName", created_at as "createdAt" 
FROM salons 
ORDER BY id ASC;
`;

// Execute the query
async function listSalons() {
  try {
    const result = await pool.query(query);
    
    console.log('All salons in the database:');
    console.table(result.rows);
    
    // Highlight the ones to keep
    console.log('\nSalons to KEEP:');
    for (const salon of result.rows) {
      if (
        salon.name.toLowerCase().includes('tiffany') ||
        salon.name.toLowerCase().includes('deb dazzle') ||
        salon.name.toLowerCase().includes('jenna') ||
        salon.name.toLowerCase().includes('ven me')
      ) {
        console.log(`* ID: ${salon.id}, Name: ${salon.name} *`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error querying database:', error.message);
    process.exit(1);
  }
}

// Run the function
listSalons().catch(console.error);