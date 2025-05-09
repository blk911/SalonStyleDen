/**
 * This script updates all invitation-related SQL queries to include the sponsor_name field
 * and fixes the mapping code to properly handle sponsorName in the results.
 * 
 * After running the SQL migration (fix-database.sql), run this script to update the code.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageFilePath = path.join(__dirname, 'server', 'storage.ts');

// Read the current storage.ts file
let content = fs.readFileSync(storageFilePath, 'utf8');

// Fix SQL queries to include sponsor_name in all SELECT statements
content = content.replace(
  /salon_id, sponsor, invite_hash/g, 
  'salon_id, sponsor, sponsor_name, invite_hash'
);

// Fix the mapping of sponsorName in results
content = content.replace(
  /sponsorName: null/g, 
  'sponsorName: row.sponsor_name || row.sponsor || "VMB LTD"'
);

// Write the updated content back to the file
fs.writeFileSync(storageFilePath, content, 'utf8');

console.log('Updated storage.ts file with sponsor_name fixes.');