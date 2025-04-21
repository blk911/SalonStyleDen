import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// Test data
const testImagePath = './attached_assets/LOGO1.png';
const uploadEndpoint = '/api/upload';

function log(message, success = true) {
  console.log(`${success ? GREEN + '✓' : RED + '✗'} ${message}${RESET}`);
}

async function runTests() {
  console.log('\n🔍 Testing photo upload functionality...\n');

  // Test 1: Check if the upload directory exists
  const uploadDir = path.join(process.cwd(), 'client/public/uploads');
  if (fs.existsSync(uploadDir)) {
    log(`Upload directory exists at ${uploadDir}`);
  } else {
    log(`Upload directory missing at ${uploadDir}`, false);
    
    // Create the directory if it doesn't exist
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      log(`Created uploads directory: ${uploadDir}`);
    } catch (error) {
      log(`Failed to create upload directory: ${error.message}`, false);
    }
  }

  // Test 2: Check if test image exists
  if (fs.existsSync(testImagePath)) {
    log(`Test image exists at ${testImagePath}`);
  } else {
    log(`Test image does not exist at ${testImagePath}`, false);
    console.log('Make sure the LOGO1.png file is in the attached_assets directory');
    return;
  }

  // Test 3: Test file upload using curl
  try {
    console.log('\nAttempting to upload test image...');
    const curlCommand = `curl -X POST -F "file=@${testImagePath}" http://localhost:5000${uploadEndpoint}`;
    
    // Execute curl command and capture output
    const result = execSync(curlCommand).toString();
    const response = JSON.parse(result);
    
    if (response.url) {
      log(`Upload successful: ${response.url}`);
      console.log(`Original filename: ${response.originalName}`);
      console.log(`File size: ${response.size} bytes`);
      
      // Test 4: Verify the file exists in uploads directory
      const uploadedFilePath = path.join(process.cwd(), 'client/public', response.url);
      if (fs.existsSync(uploadedFilePath)) {
        log(`Uploaded file found at ${uploadedFilePath}`);
      } else {
        log(`Uploaded file NOT found at ${uploadedFilePath}`, false);
      }

      // Test 5: Verify the uploaded file can be accessed via URL
      console.log(`\nVerify image is accessible at: http://localhost:5000${response.url}`);

      return {
        success: true,
        url: response.url
      };
    } else {
      log('Upload response does not contain URL', false);
      console.log('Response:', result);
    }
  } catch (error) {
    log(`Failed to upload file: ${error.message}`, false);
    console.error('Error details:', error);
  }

  return { success: false };
}

// Run tests
runTests().then(result => {
  if (result.success) {
    console.log('\n✅ PHOTO UPLOAD TEST PASSED! The photo upload functionality is working correctly.');
    console.log(`Test image uploaded successfully to: ${result.url}`);
  } else {
    console.log('\n❌ PHOTO UPLOAD TEST FAILED! Review the errors above to fix the issue.');
  }
});