/**
 * Simple script to list all salons in the database
 */

const { exec } = require('child_process');

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Use simple SQL query to list salons
const query = `
SELECT id, name, "ownerName", "createdAt" 
FROM salons 
ORDER BY id ASC;
`;

// Execute the query using psql
const command = `echo "${query}" | PGPASSWORD=${databaseUrl.split(':')[2].split('@')[0]} psql -h ${databaseUrl.split('@')[1].split(':')[0]} -p ${databaseUrl.split(':')[3].split('/')[0]} -U ${databaseUrl.split(':')[1].split('//')[1]} -d ${databaseUrl.split('/')[3]}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing query: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Query stderr: ${stderr}`);
    return;
  }
  
  console.log('All salons in the database:');
  console.log(stdout);
  
  // Highlight the ones to keep
  console.log('\nSalons to KEEP:');
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (
      line.toLowerCase().includes('tiffany') ||
      line.toLowerCase().includes('deb dazzle') ||
      line.toLowerCase().includes('jenna') ||
      line.toLowerCase().includes('ven me')
    ) {
      console.log(`* ${line} *`);
    }
  }
});