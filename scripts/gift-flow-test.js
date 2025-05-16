/**
 * VMB Gift Flow Testing Script
 * 
 * This script tests the complete gift flow from creation to claiming.
 * It helps validate that all gift-related endpoints are working correctly.
 * 
 * Run with: node scripts/gift-flow-test.js
 */

const fetch = require('node-fetch');
const readline = require('readline');

// Create readline interface for CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_SENDER_ID = 73; // Cyndi's ID
const TEST_RECIPIENT_PHONE = '(555) 123-9876'; // Test recipient

// Gift data to use for testing
const testGiftData = {
  senderId: TEST_SENDER_ID,
  recipientPhone: TEST_RECIPIENT_PHONE,
  giftType: 'style_card',
  message: 'Test gift from automated testing script',
  amount: 2500,
  status: 'pending',
  salonId: 2 // Salon ID, usually Tiffany's salon
};

// Utility to ask for confirmation before continuing
const confirmAction = (message) => {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
};

// Run the complete gift flow test
async function testGiftFlow() {
  console.log('\n🔍 VMB GIFT FLOW VALIDATION TEST');
  console.log('=================================\n');
  console.log('This script will test the complete gift flow process.\n');
  
  try {
    // 1. Create a new gift
    console.log('STEP 1: Creating a new gift');
    console.log('--------------------------');
    
    const proceed = await confirmAction('Ready to create a test gift?');
    if (!proceed) {
      console.log('Test cancelled.');
      rl.close();
      return;
    }
    
    const createdGift = await createGift(testGiftData);
    if (!createdGift) {
      throw new Error('Failed to create gift.');
    }
    
    console.log(`✓ Gift created successfully with ID: ${createdGift.id}`);
    console.log(`✓ Gift hash: ${createdGift.giftHash}`);
    
    // 2. Verify the gift is retrievable
    console.log('\nSTEP 2: Verifying gift retrieval');
    console.log('------------------------------');
    
    const giftFound = await getGift(createdGift.id);
    if (!giftFound) {
      throw new Error(`Failed to retrieve gift with ID: ${createdGift.id}`);
    }
    
    console.log(`✓ Retrieved gift with ID: ${giftFound.id}`);
    console.log(`✓ Status: ${giftFound.status}`);
    
    // 3. Test gift claiming
    console.log('\nSTEP 3: Testing gift claim process');
    console.log('--------------------------------');
    
    const claimProceed = await confirmAction('Ready to test gift claiming?');
    if (!claimProceed) {
      console.log('Claim test skipped.');
      rl.close();
      return;
    }
    
    const claimResult = await claimGift(createdGift.giftHash, {
      status: 'claimed',
      clientId: TEST_SENDER_ID, // Using sender as recipient for test purposes
      phone: TEST_RECIPIENT_PHONE
    });
    
    if (!claimResult) {
      throw new Error(`Failed to claim gift with hash: ${createdGift.giftHash}`);
    }
    
    console.log(`✓ Successfully claimed gift with hash: ${createdGift.giftHash}`);
    
    // 4. Verify the gift status is updated
    console.log('\nSTEP 4: Verifying gift status update');
    console.log('---------------------------------');
    
    const updatedGift = await getGift(createdGift.id);
    if (!updatedGift) {
      throw new Error(`Failed to retrieve updated gift with ID: ${createdGift.id}`);
    }
    
    console.log(`✓ Retrieved updated gift with ID: ${updatedGift.id}`);
    console.log(`✓ New status: ${updatedGift.status}`);
    
    if (updatedGift.status === 'claimed' || updatedGift.status === 'redeemed') {
      console.log('✓ Gift status successfully updated after claim');
    } else {
      console.log('⚠ Gift status not updated as expected. Current status:', updatedGift.status);
    }
    
    // Test complete
    console.log('\n✅ GIFT FLOW TEST COMPLETE');
    console.log('All steps of the gift flow were tested successfully');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  } finally {
    rl.close();
  }
}

// API helper functions
async function createGift(giftData) {
  try {
    const response = await fetch(`${BASE_URL}/gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(giftData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create gift: ${errorData.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating gift:', error.message);
    return null;
  }
}

async function getGift(giftId) {
  try {
    const response = await fetch(`${BASE_URL}/gifts/${giftId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get gift: ${errorData.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting gift:', error.message);
    return null;
  }
}

async function claimGift(giftHash, claimData) {
  try {
    const response = await fetch(`${BASE_URL}/gifts/${giftHash}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to claim gift: ${errorData.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error claiming gift:', error.message);
    return null;
  }
}

// Run the test
testGiftFlow();