// This is a temporary file to fix sponsorName fields in server/storage.ts
// Run with: node sponsor-name-fix.js

const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(process.cwd(), 'server/storage.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of 'sponsorName: null,' with the correct value
content = content.replace(/sponsorName: null,/g, 'sponsorName: row.sponsor_name || row.sponsor || "",');

// Write the updated content back
fs.writeFileSync(filePath, content);

console.log('Successfully updated sponsorName fields in server/storage.ts');