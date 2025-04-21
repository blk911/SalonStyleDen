
const fetch = require('node-fetch');

async function testSponsorRules() {
  console.log('Testing sponsor rules for client invitations...');
  
  // Test data
  const testInvitation1 = {
    name: "Test Client 1",
    phone: "(303) 555-1111",
    email: "test1@example.com", 
    salonId: 1,
    sponsor: "1",
    notes: "Test client 1",
    favoriteServices: ["French Tips", "Gel Manicure"]
  };

  const testInvitation2 = {
    name: "Test Client 2",
    phone: "(303) 555-2222", 
    email: "test2@example.com",
    salonId: 1,
    sponsor: "1", // Same sponsor as test1 - should fail
    notes: "Test client 2",
    favoriteServices: ["Acrylics"]
  };

  try {
    // Test 1: Create first invitation
    console.log('\nTest 1: Creating first invitation');
    const res1 = await fetch('http://localhost:5000/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInvitation1)
    });
    const data1 = await res1.json();
    console.log('Response:', data1);

    // Test 2: Try to create second invitation with same sponsor
    console.log('\nTest 2: Attempting duplicate sponsor');
    const res2 = await fetch('http://localhost:5000/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInvitation2)
    });
    const data2 = await res2.json();
    console.log('Response:', data2);

    // Test 3: Fetch all invitations
    console.log('\nTest 3: Fetching all invitations');
    const res3 = await fetch('http://localhost:5000/api/invitations');
    const data3 = await res3.json();
    console.log('Retrieved invitations:', data3);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSponsorRules();
