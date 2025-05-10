// Fix sponsorship in getInvitationByHash method
// ES module syntax
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'server', 'storage.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Find specific getInvitationByHash method section
const targetMethodBefore = `  async getInvitationByHash(hash: string): Promise<Invitation | undefined> {`;
const methodStartIndex = fileContent.indexOf(targetMethodBefore);

// Find the problematic line
const targetSponsorNameLine = `          sponsorName: null,`;
// This line follows the style lines
const targetLine = `          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          sponsorName: null,`;

const fixedLine = `          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          sponsorName: row.sponsor_name || row.sponsor || "",`;

// Only replace within the getInvitationByHash method
const updatedContent = fileContent.substring(0, methodStartIndex) + 
                      fileContent.substring(methodStartIndex).replace(targetLine, fixedLine);

fs.writeFileSync(filePath, updatedContent);
console.log('Sponsorship fix applied to getInvitationByHash method');