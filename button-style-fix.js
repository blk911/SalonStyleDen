const fs = require('fs');
const path = require('path');

const filePath = 'client/src/pages/ClientDashboard.tsx';

try {
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find and replace the button container and styling
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
  const pattern = /{\/\* Create VMB Invite card.*?<Button[\s\S]*?Send Invitation[\s\S]*?<\/Button>/;
  
  // Replace the pattern with new button style
  const updatedContent = content.replace(pattern, newButtonStyle);
  
  // Write back to file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  
  console.log('Button style has been updated successfully!');
} catch (err) {
  console.error('Error updating button style:', err);
}
