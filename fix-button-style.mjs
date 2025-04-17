#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = 'client/src/pages/ClientDashboard.tsx';

try {
  // Read file content
  let content = readFileSync(filePath, 'utf8');
  
  // Create new button style
  const newButtonStyle = `{/* Create VMB Invite card - empty with full-width button */}
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100 flex flex-col h-full justify-between">
                                  <Button 
                                    className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-md flex items-center justify-center"
                                    style={{ 
                                      padding: "0.5rem 1rem",
                                      fontSize: "0.875rem",
                                      fontWeight: "500",
                                      height: "2.5rem"
                                    }}
                                    onClick={() => {
                                      console.log("Create VMB Invite clicked");
                                      // This would open the invite creation flow
                                    }}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Invitation
                                  </Button>`;
  
  // Define a regex pattern to find the button container
  const buttonRegex = /\{\/\* Create VMB Invite card.*?\<Button[\s\S]*?Send Invitation[\s\S]*?\<\/Button\>/;
  
  // Replace the matched content with new button style
  if (buttonRegex.test(content)) {
    const updatedContent = content.replace(buttonRegex, newButtonStyle);
    
    // Write back to file
    writeFileSync(filePath, updatedContent, 'utf8');
    console.log('Button style has been updated successfully!');
  } else {
    console.error('Button pattern not found in the file.');
  }
} catch (err) {
  console.error('Error updating button style:', err);
}
