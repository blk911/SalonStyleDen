
// Database cleanup script
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearData() {
  const client = await pool.connect();
  try {
    console.log('Starting database cleanup...');
    
    await client.query('DELETE FROM invitations');
    console.log('Cleared invitations table');
    
    await client.query('DELETE FROM clients');
    console.log('Cleared clients table');
    
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

clearData();
