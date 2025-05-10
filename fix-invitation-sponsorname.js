/**
 * This is a simple script to fix the sponsorName field in getInvitationByHash
 * Run it with Node.js: node fix-invitation-sponsorname.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server', 'storage.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Find the getInvitationByHash method
const methodStart = fileContent.indexOf('async getInvitationByHash');
if (methodStart === -1) {
  console.error('Could not find getInvitationByHash method');
  process.exit(1);
}

// Find the line with sponsorName: null inside this method
const searchFrom = fileContent.slice(methodStart);
const lineToReplace = 'sponsorName: null,';
const replaceWith = 'sponsorName: row.sponsor_name || row.sponsor || "",';

// Make the replacement only within this method
const updatedMethod = searchFrom.replace(lineToReplace, replaceWith);

// Create the updated file content
const updatedContent = 
  fileContent.slice(0, methodStart) + 
  updatedMethod;

// Write it back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Successfully updated sponsorName in getInvitationByHash method');