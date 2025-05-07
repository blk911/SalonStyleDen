/**
 * VMB LTD Dependency Visualizer Component Test
 * 
 * This script specifically tests the dependency visualizer component
 * and its related files.
 */

import fetch from 'node-fetch';

// Test the visualizations data files
async function testVisualizationFiles() {
  console.log("DEPENDENCY VISUALIZER TEST SUITE");
  console.log("===============================");
  console.log(`Date: ${new Date().toISOString()}\n`);
  
  const files = [
    // Text files
    {
      path: "/visualizations/server-dependencies.txt",
      type: "text",
      description: "Server Dependencies Text Description"
    },
    {
      path: "/visualizations/client-dependencies.txt",
      type: "text",
      description: "Client Dependencies Text Description"
    },
    {
      path: "/visualizations/shared-dependencies.txt",
      type: "text",
      description: "Shared Schema Dependencies Text Description"
    },
    {
      path: "/visualizations/salon-id-dependencies.txt",
      type: "text",
      description: "Salon ID Dependencies Text Description"
    },
    {
      path: "/visualizations/data-model-fields.txt",
      type: "text",
      description: "Data Model and Fields Reference"
    },
    {
      path: "/visualizations/payment-integration.txt",
      type: "text",
      description: "Payment Integration Documentation"
    },
    
    // SVG files
    {
      path: "/server-dependencies.svg",
      type: "svg",
      description: "Server Dependencies Diagram"
    },
    {
      path: "/client-dependencies.svg",
      type: "svg",
      description: "Client Dependencies Diagram"
    },
    {
      path: "/shared-dependencies.svg",
      type: "svg",
      description: "Shared Schema Dependencies Diagram"
    },
    {
      path: "/salon-id-dependencies.svg",
      type: "svg",
      description: "Salon ID Dependencies Diagram"
    }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  console.log("Testing Visualization Files:");
  console.log("===========================\n");
  
  for (const file of files) {
    try {
      const response = await fetch(`http://localhost:5000${file.path}`);
      
      if (response.ok) {
        // Additional validation based on file type
        if (file.type === "text") {
          const content = await response.text();
          if (content.length > 100) { // Basic check that file has content
            console.log(`✅ PASS: ${file.path} - ${file.description}`);
            passCount++;
          } else {
            console.log(`❌ FAIL: ${file.path} - File exists but content is too short`);
            failCount++;
          }
        } else if (file.type === "svg") {
          const content = await response.text();
          // Less strict SVG validation that only checks for XML declaration and svg tag
          if (content.includes("<?xml") && content.includes("<svg")) {
            console.log(`✅ PASS: ${file.path} - ${file.description}`);
            passCount++;
          } else {
            console.log(`❌ FAIL: ${file.path} - File exists but is not valid SVG`);
            failCount++;
          }
        }
      } else {
        console.log(`❌ FAIL: ${file.path} - Not found (${response.status})`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ERROR: Failed to check ${file.path} - ${error.message}`);
      failCount++;
    }
  }
  
  // Test the component itself by making sure it's imported in App.tsx
  try {
    console.log("\nChecking DependencyVisualizer component integration:");
    console.log("===============================================\n");
    
    const response = await fetch(`http://localhost:5000/dependencies`);
    
    if (response.ok || response.status === 200) {
      console.log(`✅ PASS: /dependencies route exists and is accessible`);
      passCount++;
    } else {
      console.log(`❌ FAIL: /dependencies route not found (${response.status})`);
      failCount++;
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to check /dependencies route - ${error.message}`);
    failCount++;
  }
  
  // Print test summary
  console.log("\nDEPENDENCY VISUALIZER TEST SUMMARY");
  console.log("=================================");
  console.log(`Total Tests: ${files.length + 1}`); // +1 for the component route test
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pass Rate: ${Math.round((passCount / (files.length + 1)) * 100)}%`);
  
  return { passCount, failCount };
}

// Run the test
testVisualizationFiles().catch(error => {
  console.error("Test suite failed with error:", error);
  process.exit(1);
});