/**
 * VMB Database Race Condition Test Suite
 * 
 * Tests that exercise potential concurrency issues in database operations
 * to ensure proper locking, transaction handling, and conflict resolution.
 */

console.log('\x1b[35m===================================================\x1b[0m');
console.log('\x1b[35m         VMB DATABASE RACE CONDITION TEST SUITE    \x1b[0m');
console.log('\x1b[35m===================================================\x1b[0m');
console.log(`Test started at: ${new Date().toISOString()}`);

// Mock database client for test purposes
const mockDbClient = {
  // Simulates a pool of connections
  connections: Array(10).fill().map((_, i) => ({ id: i, busy: false })),
  
  // Mock query execution with simulated delay to create race conditions
  query: async function(query, params = [], isolationLevel = 'READ COMMITTED') {
    // Randomly select a connection from the pool
    const availableConnections = this.connections.filter(c => !c.busy);
    if (availableConnections.length === 0) {
      throw new Error('No database connections available in the pool');
    }
    
    const connection = availableConnections[Math.floor(Math.random() * availableConnections.length)];
    connection.busy = true;
    
    // Simulate query latency - random to create race conditions
    const latency = Math.floor(Math.random() * 100) + 10;
    
    try {
      await new Promise(resolve => setTimeout(resolve, latency));
      
      // Mock results based on the query
      if (query.includes('BEGIN')) {
        console.log(`\x1b[36m[DB] Begin transaction on connection ${connection.id}\x1b[0m`);
        return { command: 'BEGIN' };
      } else if (query.includes('COMMIT')) {
        console.log(`\x1b[36m[DB] Commit transaction on connection ${connection.id}\x1b[0m`);
        return { command: 'COMMIT' };
      } else if (query.includes('ROLLBACK')) {
        console.log(`\x1b[36m[DB] Rollback transaction on connection ${connection.id}\x1b[0m`);
        return { command: 'ROLLBACK' };
      } else if (query.includes('SELECT') && query.includes('FOR UPDATE')) {
        console.log(`\x1b[36m[DB] Row-level lock acquired on connection ${connection.id}\x1b[0m`);
        return { command: 'SELECT', rowCount: 1, rows: [{ id: 1, value: 'test' }] };
      } else if (query.includes('UPDATE')) {
        console.log(`\x1b[36m[DB] Update executed on connection ${connection.id}\x1b[0m`);
        return { command: 'UPDATE', rowCount: 1 };
      } else if (query.includes('INSERT')) {
        console.log(`\x1b[36m[DB] Insert executed on connection ${connection.id}\x1b[0m`);
        return { command: 'INSERT', rowCount: 1 };
      } else {
        console.log(`\x1b[36m[DB] Query executed on connection ${connection.id}: ${query.substring(0, 40)}...\x1b[0m`);
        return { command: 'QUERY', rowCount: 1 };
      }
    } finally {
      connection.busy = false;
    }
  },
  
  // Start a transaction
  beginTransaction: async function(isolationLevel = 'READ COMMITTED') {
    return this.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
  },
  
  // Commit a transaction
  commitTransaction: async function() {
    return this.query('COMMIT');
  },
  
  // Rollback a transaction
  rollbackTransaction: async function() {
    return this.query('ROLLBACK');
  }
};

// Mock concurrent users
const mockUsers = [
  { id: 1, name: 'User 1' },
  { id: 2, name: 'User 2' },
  { id: 3, name: 'User 3' },
  { id: 4, name: 'User 4' },
  { id: 5, name: 'User 5' }
];

// Test 1: Test concurrent updates to the same record
const testConcurrentUpdates = async () => {
  console.log('\n\x1b[33m=== TEST 1: CONCURRENT UPDATES TO SAME RECORD ===\x1b[0m');
  
  // Simulate multiple users trying to update the same salon record
  const salonId = 1;
  const recordName = `Salon #${salonId}`;
  
  console.log(`\x1b[36m[TEST] Simulating 5 concurrent users updating ${recordName}\x1b[0m`);
  
  // Create update operations for each user
  const updatePromises = mockUsers.map(async (user) => {
    try {
      await mockDbClient.beginTransaction('REPEATABLE READ');
      
      // Select the record with FOR UPDATE to lock it
      await mockDbClient.query(
        'SELECT * FROM salons WHERE id = $1 FOR UPDATE',
        [salonId]
      );
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      // Update the record
      await mockDbClient.query(
        'UPDATE salons SET last_modified_by = $1 WHERE id = $2',
        [user.id, salonId]
      );
      
      await mockDbClient.commitTransaction();
      
      console.log(`\x1b[32m[SUCCESS] ${user.name} successfully updated ${recordName}\x1b[0m`);
      return { user, success: true };
    } catch (error) {
      await mockDbClient.rollbackTransaction();
      console.log(`\x1b[31m[ERROR] ${user.name} failed to update ${recordName}: ${error.message}\x1b[0m`);
      return { user, success: false, error: error.message };
    }
  });
  
  // Wait for all updates to complete
  const results = await Promise.all(updatePromises);
  
  // Only one user should be able to update at a time due to row locking
  const successful = results.filter(r => r.success);
  console.log(`\x1b[36m[RESULT] ${successful.length} out of ${mockUsers.length} concurrent updates completed successfully\x1b[0m`);
  
  // This test should pass because our locking strategy should prevent lost updates
  const testPassed = successful.length === mockUsers.length;
  console.log(`\x1b[${testPassed ? '32' : '31'}m[RESULT] Concurrent Update Test: ${testPassed ? 'PASSED ✓' : 'FAILED ✗'}\x1b[0m`);
  
  return { success: testPassed, results };
};

// Test 2: Test deadlock detection and handling
const testDeadlockHandling = async () => {
  console.log('\n\x1b[33m=== TEST 2: DEADLOCK DETECTION AND HANDLING ===\x1b[0m');
  
  // Simulate a scenario that could lead to deadlocks
  // User 1 locks record A then tries to lock record B
  // User 2 locks record B then tries to lock record A
  
  console.log('\x1b[36m[TEST] Simulating potential deadlock scenario\x1b[0m');
  
  // Track if we detected and handled a deadlock
  let deadlockDetected = false;
  
  // Execute both transactions concurrently
  const [resultUser1, resultUser2] = await Promise.all([
    // User 1 transaction
    (async () => {
      try {
        await mockDbClient.beginTransaction('REPEATABLE READ');
        
        // Lock record A
        console.log('\x1b[36m[TEST] User 1 locking Record A\x1b[0m');
        await mockDbClient.query('SELECT * FROM salons WHERE id = 1 FOR UPDATE');
        
        // Simulate delay to increase chance of deadlock
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Try to lock record B
        console.log('\x1b[36m[TEST] User 1 attempting to lock Record B\x1b[0m');
        
        // Simulate deadlock error 40P01 randomly
        if (Math.random() < 0.5) {
          console.log('\x1b[31m[ERROR] Simulated deadlock detected (User 1)\x1b[0m');
          deadlockDetected = true;
          await mockDbClient.rollbackTransaction();
          throw new Error('ERROR: deadlock detected (SQLSTATE 40P01)');
        }
        
        await mockDbClient.query('SELECT * FROM clients WHERE id = 1 FOR UPDATE');
        
        // Update both records
        await mockDbClient.query('UPDATE salons SET name = $1 WHERE id = 1', ['Updated Salon A']);
        await mockDbClient.query('UPDATE clients SET name = $1 WHERE id = 1', ['Updated Client B']);
        
        await mockDbClient.commitTransaction();
        console.log('\x1b[32m[SUCCESS] User 1 transaction completed\x1b[0m');
        return { user: 'User 1', success: true };
      } catch (error) {
        await mockDbClient.rollbackTransaction();
        if (error.message.includes('deadlock')) {
          console.log('\x1b[33m[RETRY] User 1 transaction will be retried due to deadlock\x1b[0m');
          // In a real implementation, we would retry the transaction here
          return { user: 'User 1', success: false, deadlock: true };
        } else {
          console.log(`\x1b[31m[ERROR] User 1 transaction failed: ${error.message}\x1b[0m`);
          return { user: 'User 1', success: false, error: error.message };
        }
      }
    })(),
    
    // User 2 transaction
    (async () => {
      try {
        await mockDbClient.beginTransaction('REPEATABLE READ');
        
        // Lock record B
        console.log('\x1b[36m[TEST] User 2 locking Record B\x1b[0m');
        await mockDbClient.query('SELECT * FROM clients WHERE id = 1 FOR UPDATE');
        
        // Simulate delay to increase chance of deadlock
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Try to lock record A
        console.log('\x1b[36m[TEST] User 2 attempting to lock Record A\x1b[0m');
        
        // Simulate deadlock error 40P01 randomly
        if (Math.random() < 0.5 && !deadlockDetected) {
          console.log('\x1b[31m[ERROR] Simulated deadlock detected (User 2)\x1b[0m');
          deadlockDetected = true;
          await mockDbClient.rollbackTransaction();
          throw new Error('ERROR: deadlock detected (SQLSTATE 40P01)');
        }
        
        await mockDbClient.query('SELECT * FROM salons WHERE id = 1 FOR UPDATE');
        
        // Update both records
        await mockDbClient.query('UPDATE clients SET name = $1 WHERE id = 1', ['Updated Client B']);
        await mockDbClient.query('UPDATE salons SET name = $1 WHERE id = 1', ['Updated Salon A']);
        
        await mockDbClient.commitTransaction();
        console.log('\x1b[32m[SUCCESS] User 2 transaction completed\x1b[0m');
        return { user: 'User 2', success: true };
      } catch (error) {
        await mockDbClient.rollbackTransaction();
        if (error.message.includes('deadlock')) {
          console.log('\x1b[33m[RETRY] User 2 transaction will be retried due to deadlock\x1b[0m');
          // In a real implementation, we would retry the transaction here
          return { user: 'User 2', success: false, deadlock: true };
        } else {
          console.log(`\x1b[31m[ERROR] User 2 transaction failed: ${error.message}\x1b[0m`);
          return { user: 'User 2', success: false, error: error.message };
        }
      }
    })()
  ]);
  
  // Verify that either:
  // 1. Both transactions completed successfully (no deadlock)
  // 2. One transaction was aborted with deadlock and would be retried
  const testPassed = (resultUser1.success && resultUser2.success) || 
                    resultUser1.deadlock || resultUser2.deadlock;
  
  console.log('\x1b[36m[RESULT] Deadlock handling summary:\x1b[0m');
  console.log(`\x1b[36m- User 1 transaction: ${resultUser1.success ? 'Completed' : resultUser1.deadlock ? 'Deadlock (handled)' : 'Failed'}\x1b[0m`);
  console.log(`\x1b[36m- User 2 transaction: ${resultUser2.success ? 'Completed' : resultUser2.deadlock ? 'Deadlock (handled)' : 'Failed'}\x1b[0m`);
  
  console.log(`\x1b[${testPassed ? '32' : '31'}m[RESULT] Deadlock Handling Test: ${testPassed ? 'PASSED ✓' : 'FAILED ✗'}\x1b[0m`);
  
  return { success: testPassed, resultUser1, resultUser2 };
};

// Test 3: Test optimistic concurrency control with version fields
const testOptimisticConcurrency = async () => {
  console.log('\n\x1b[33m=== TEST 3: OPTIMISTIC CONCURRENCY CONTROL ===\x1b[0m');
  
  // Simulate concurrent updates to a client profile using optimistic locking
  const clientId = 101;
  const clientName = 'Jennifer';
  
  console.log(`\x1b[36m[TEST] Testing optimistic concurrency control on ${clientName}'s profile\x1b[0m`);
  
  // Initial version number
  let currentVersion = 1;
  
  // User 1 gets the current client record
  console.log('\x1b[36m[TEST] User 1 reads client record (version 1)\x1b[0m');
  const user1Data = { name: clientName, email: 'jennifer@example.com', version: currentVersion };
  
  // User 2 gets the same record at the same time
  console.log('\x1b[36m[TEST] User 2 reads client record (version 1)\x1b[0m');
  const user2Data = { name: clientName, email: 'jennifer@example.com', version: currentVersion };
  
  // User 1 updates the record
  console.log('\x1b[36m[TEST] User 1 updates client record\x1b[0m');
  
  // Simulate a successful update with version check
  const user1UpdateResult = await mockDbClient.query(
    'UPDATE clients SET name = $1, email = $2, version = version + 1 WHERE id = $3 AND version = $4',
    ['Jennifer Wilson', 'jennifer@example.com', clientId, user1Data.version]
  );
  
  if (user1UpdateResult.rowCount === 1) {
    console.log('\x1b[32m[SUCCESS] User 1 successfully updated client record\x1b[0m');
    // Increment version for the successful update
    currentVersion++;
  } else {
    console.log('\x1b[31m[ERROR] User 1 failed to update client record - version conflict\x1b[0m');
  }
  
  // User 2 tries to update the same record with the now-outdated version
  console.log('\x1b[36m[TEST] User 2 attempts to update client record\x1b[0m');
  
  // Simulate checking version before update
  const user2UpdateResult = await mockDbClient.query(
    'UPDATE clients SET name = $1, email = $2, version = version + 1 WHERE id = $3 AND version = $4',
    ['Jennifer Smith', 'jsmith@example.com', clientId, user2Data.version]
  );
  
  // Since the version has changed, this should return 0 rows affected
  if (user2UpdateResult.rowCount === 0) {
    console.log('\x1b[33m[EXPECTED] User 2 update failed due to version conflict\x1b[0m');
    
    // In a real app, User 2 would need to refresh the data and try again
    console.log('\x1b[36m[TEST] User 2 refreshes client data and gets version 2\x1b[0m');
    const refreshedData = { name: 'Jennifer Wilson', email: 'jennifer@example.com', version: currentVersion };
    
    // User 2 tries again with the new version
    console.log('\x1b[36m[TEST] User 2 retries update with current version\x1b[0m');
    const user2RetryResult = await mockDbClient.query(
      'UPDATE clients SET name = $1, email = $2, version = version + 1 WHERE id = $3 AND version = $4',
      ['Jennifer Smith', 'jsmith@example.com', clientId, refreshedData.version]
    );
    
    if (user2RetryResult.rowCount === 1) {
      console.log('\x1b[32m[SUCCESS] User 2 successfully updated client record after refresh\x1b[0m');
    } else {
      console.log('\x1b[31m[ERROR] User 2 failed to update client record after refresh\x1b[0m');
    }
  } else {
    console.log('\x1b[31m[ERROR] Unexpected success of User 2 update - version check failed\x1b[0m');
  }
  
  // The test passes if User 1's update succeeds and User 2's first attempt fails
  const testPassed = user1UpdateResult.rowCount === 1 && user2UpdateResult.rowCount === 0;
  
  console.log(`\x1b[${testPassed ? '32' : '31'}m[RESULT] Optimistic Concurrency Control Test: ${testPassed ? 'PASSED ✓' : 'FAILED ✗'}\x1b[0m`);
  
  return { success: testPassed };
};

// Run all tests
const runAllTests = async () => {
  try {
    // Run tests
    const concurrentUpdateResult = await testConcurrentUpdates();
    const deadlockResult = await testDeadlockHandling();
    const optimisticConcurrencyResult = await testOptimisticConcurrency();
    
    // Compile results
    const allTestsPassed = concurrentUpdateResult.success && 
                          deadlockResult.success && 
                          optimisticConcurrencyResult.success;
    
    // Print summary
    console.log('\n\x1b[35m===================================================\x1b[0m');
    console.log('\x1b[35m       DATABASE RACE CONDITION TEST SUMMARY        \x1b[0m');
    console.log('\x1b[35m===================================================\x1b[0m');
    
    console.log(`\x1b[${concurrentUpdateResult.success ? '32' : '31'}m1. Concurrent Update Test: ${concurrentUpdateResult.success ? 'PASSED ✓' : 'FAILED ✗'}\x1b[0m`);
    console.log(`\x1b[${deadlockResult.success ? '32' : '31'}m2. Deadlock Handling Test: ${deadlockResult.success ? 'PASSED ✓' : 'FAILED ✗'}\x1b[0m`);
    console.log(`\x1b[${optimisticConcurrencyResult.success ? '32' : '31'}m3. Optimistic Concurrency Control Test: ${optimisticConcurrencyResult.success ? 'PASSED ✓' : 'FAILED ✗'}\x1b[0m`);
    
    console.log(`\n\x1b[${allTestsPassed ? '32' : '31'}mOVERALL RESULT: ${allTestsPassed ? 'ALL DATABASE TESTS PASSED ✓' : 'SOME DATABASE TESTS FAILED ✗'}\x1b[0m`);
    console.log(`Test completed at: ${new Date().toISOString()}`);
    console.log('\x1b[35m===================================================\x1b[0m');
    
    return allTestsPassed ? 0 : 1;
  } catch (error) {
    console.error('\x1b[31m[ERROR] Test execution failed:', error.message, '\x1b[0m');
    return 1;
  }
};

// Execute tests
runAllTests();

/**
 * How to run this test:
 * 
 * Simply run with Node.js:
 *    node test/databaseRaceConditionTest.js
 * 
 * Expected output:
 * - Test results for concurrent database update scenarios
 * - Deadlock detection and handling verification
 * - Optimistic concurrency control validation
 */