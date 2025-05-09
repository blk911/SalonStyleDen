/**
 * This script updates all sponsorName mappings in storage.ts to use the getValidSponsorName helper.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageFilePath = path.join(__dirname, 'server', 'storage.ts');

console.log('Updating sponsorName mappings in storage.ts...');

// Read the current storage.ts file
let content = fs.readFileSync(storageFilePath, 'utf8');

// Add the helper function if it doesn't exist already
if (!content.includes('function getValidSponsorName')) {
  const helperFunction = `
// Helper function to ensure sponsorName is always provided
function getValidSponsorName(row) {
  // Try to get sponsor_name first, then fall back to sponsor, then use default
  return row.sponsor_name || row.sponsor || "VMB LTD";
}`;

  // Find the insert position after the imports
  const importEndPos = content.indexOf('export interface IStorage');
  
  // Insert the helper function before the interface
  content = content.slice(0, importEndPos) + helperFunction + '\n\n' + content.slice(importEndPos);
}

// Replace all sponsorName: null with our helper function
content = content.replace(/sponsorName: null,/g, 'sponsorName: getValidSponsorName(row),');

// Write the updated content back to the file
fs.writeFileSync(storageFilePath, content, 'utf8');

console.log('Successfully updated sponsorName mappings in storage.ts');