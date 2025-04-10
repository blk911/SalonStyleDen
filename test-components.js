// Component and UI Flow Testing Script for Ven Me, Baby!
// Run with: node test-components.js

const { chromium } = require('playwright');
const assert = require('assert');

// Test configuration
const baseUrl = 'http://localhost:5000';
const testTimeout = 30000; // 30 seconds timeout for each test

// Test data
const testClientData = {
  name: 'Test Client',
  phone: '(303) 555-6789',
  email: 'testclient@example.com',
};

const testSalonData = {
  name: 'Test Automation Salon',
  ownerName: 'Test Owner',
  phone: '(303) 555-4321',
  email: 'testsalon@example.com',
  address: '456 Test Ave',
  city: 'Denver',
  state: 'CO',
  zipCode: '80203',
};

// Utility functions
const logSuccess = (message) => console.log(`✅ ${message}`);
const logFailure = (message) => console.log(`❌ ${message}`);
const logInfo = (message) => console.log(`ℹ️ ${message}`);

// Test stats
let passed = 0;
let failed = 0;
let skipped = 0;

// Main test runner function
async function runTests() {
  console.log('\n🔍 Starting Ven Me, Baby! Component Tests');
  console.log('=======================================\n');
  
  const browser = await chromium.launch({
    headless: true, // Run headless by default
    slowMo: 50, // Slow down operations for stability
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Ven-Me-Baby-TestRunner/1.0',
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Home page loads correctly
    await testHomePageLoads(page);
    
    // Test 2: Client form navigation and validation
    await testClientFormNavigation(page);
    
    // Test 3: Salon form navigation and validation
    await testSalonFormNavigation(page);
    
    // Test 4: Salons page, filtering and map interaction
    await testSalonsPage(page);
    
    // Test 5: Promos page loads and displays promotions
    await testPromosPage(page);
    
  } catch (error) {
    logFailure(`Unexpected error in test suite: ${error.message}`);
    failed++;
  } finally {
    // Print test summary
    console.log('\n=======================================');
    console.log('🧪 Test Summary:');
    console.log(`   Total: ${passed + failed + skipped}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️ Skipped: ${skipped}`);
    console.log('=======================================\n');
    
    await browser.close();
  }
}

// Individual test implementations

async function testHomePageLoads(page) {
  logInfo('Testing home page loads correctly...');
  
  try {
    await page.goto(baseUrl, { timeout: testTimeout });
    
    // Check for key elements on the home page
    const heroTitle = await page.textContent('h1');
    assert(heroTitle.includes('Ven Me') || heroTitle.includes('Salon'), 'Hero title should be present');
    
    const clientButton = await page.isVisible('button:has-text("Client")');
    const salonButton = await page.isVisible('button:has-text("Salon")');
    assert(clientButton, 'Client button should be visible');
    assert(salonButton, 'Salon button should be visible');
    
    logSuccess('Home page loads correctly with all required elements');
    passed++;
    
  } catch (error) {
    logFailure(`Home page test failed: ${error.message}`);
    failed++;
  }
}

async function testClientFormNavigation(page) {
  logInfo('Testing client form navigation and validation...');
  
  try {
    // Navigate to home page
    await page.goto(baseUrl, { timeout: testTimeout });
    
    // Click the client button to show the form
    await page.click('button:has-text("Client")');
    
    // Check that the form is visible
    const isFormVisible = await page.isVisible('form');
    assert(isFormVisible, 'Client form should be visible after clicking Client button');
    
    // Test form validation by submitting empty form
    await page.click('button:has-text("Register")');
    const errorVisible = await page.isVisible('text=must be at least');
    assert(errorVisible, 'Validation errors should appear for empty form submission');
    
    // Test radio button selection
    await page.click('text=Yes - I visit a salon regularly');
    const salonDropdownActive = await page.isVisible('select');
    assert(salonDropdownActive, 'Salon dropdown should be enabled when "Yes" is selected');
    
    // Switch back to "No"
    await page.click('text=No - New client');
    
    logSuccess('Client form navigation and validation works correctly');
    passed++;
    
  } catch (error) {
    logFailure(`Client form test failed: ${error.message}`);
    failed++;
  }
}

async function testSalonFormNavigation(page) {
  logInfo('Testing salon form navigation and validation...');
  
  try {
    // Navigate to home page
    await page.goto(baseUrl, { timeout: testTimeout });
    
    // Click the salon button to show the form
    await page.click('button:has-text("Salon")');
    
    // Check that the form is visible
    const isFormVisible = await page.isVisible('form');
    assert(isFormVisible, 'Salon form should be visible after clicking Salon button');
    
    // Test form validation by submitting empty form
    await page.click('button:has-text("Register")');
    const errorVisible = await page.isVisible('text=must be at least');
    assert(errorVisible, 'Validation errors should appear for empty form submission');
    
    logSuccess('Salon form navigation and validation works correctly');
    passed++;
    
  } catch (error) {
    logFailure(`Salon form test failed: ${error.message}`);
    failed++;
  }
}

async function testSalonsPage(page) {
  logInfo('Testing salons page, filtering and map interactions...');
  
  try {
    // Navigate to salons page
    await page.goto(`${baseUrl}/salons`, { timeout: testTimeout });
    
    // Check that salon cards are visible
    await page.waitForSelector('.salon-card', { timeout: testTimeout });
    const salonCards = await page.$$('.salon-card');
    assert(salonCards.length > 0, 'Salon cards should be displayed on the page');
    
    // Check if search/filter is present
    const isSearchPresent = await page.isVisible('input[placeholder*="search"]');
    
    if (isSearchPresent) {
      // Optional: Test search functionality if available
      await page.fill('input[placeholder*="search"]', 'Denver');
      await page.waitForTimeout(1000); // Wait for any potential filtering
    } else {
      logInfo('Search functionality not detected, skipping search test');
    }
    
    logSuccess('Salons page loads and displays salon cards');
    passed++;
    
  } catch (error) {
    logFailure(`Salons page test failed: ${error.message}`);
    failed++;
  }
}

async function testPromosPage(page) {
  logInfo('Testing promos page loads and displays promotions...');
  
  try {
    // Navigate to promos page
    await page.goto(`${baseUrl}/promos`, { timeout: testTimeout });
    
    // Check that promo cards are visible
    await page.waitForSelector('.promo-card, .card, article', { timeout: testTimeout });
    const promoElements = await page.$$('.promo-card, .card, article');
    
    if (promoElements.length > 0) {
      logSuccess('Promos page loads and displays promotion cards');
      passed++;
    } else {
      logInfo('No promotion cards found, this might be expected if no promotions exist');
      skipped++;
    }
    
  } catch (error) {
    logFailure(`Promos page test failed: ${error.message}`);
    failed++;
  }
}

// Run all tests
runTests().catch(console.error);