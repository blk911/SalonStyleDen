import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      const envLines = envContent.split('\n');
      for (const line of envLines) {
        if (line.startsWith('DATABASE_URL=')) {
          connectionString = line.split('=')[1];
          break;
        }
      }
    } catch (error) {
      console.error('Could not read .env file:', error);
    }
  }
  
  if (!connectionString) {
    console.error('DATABASE_URL not found in environment or .env file');
    process.exit(1);
  }
  
  console.log('Using database connection string:', connectionString.substring(0, 20) + '...');

  const sql = postgres(connectionString, {
    ssl: 'require'
  });
  const db = drizzle(sql);

  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'add-payment-tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sql.unsafe(statement);
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
