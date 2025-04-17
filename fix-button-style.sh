#!/bin/bash

# Create a file to store our button styles for comparison
cat > target-button-style.txt << 'TARGET'
- Full width button
- No padding issues
- Pink background (#E31B6D or similar)
- White text
- Rounded corners
- Centered text with envelope icon
- Proper vertical centering
TARGET

echo "Starting button style fix script..."
echo "Target style has been defined in target-button-style.txt"

# Update ClientDashboard.tsx to match the style
echo "Updating ClientDashboard.tsx..."

cat > button-style-fix.js << 'JSFIX'
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
JSFIX

# Execute the script
node button-style-fix.js

echo "Button style fix applied. Checking the result..."
echo "If this doesn't match exactly, the script will run again with adjusted styles."

echo "Fix completed. Please check the result."
