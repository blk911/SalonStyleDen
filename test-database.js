// Database Testing Script for Ven Me, Baby!
// Run with: node test-database.js

const { Pool } = require('pg');
const assert = require('assert');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test stats
let passed = 0;
let failed = 0;
let total = 0;

// Utility functions
const logSuccess = (message) => console.log(`✅ ${message}`);
const logFailure = (message) => console.log(`❌ ${message}`);
const logInfo = (message) => console.log(`ℹ️ ${message}`);

// Run a test and update counters
async function runTest(testFn, description) {
  total++;
  logInfo(`Running test: ${description}`);
  
  try {
    await testFn();
    logSuccess(`Passed: ${description}`);
    passed++;
  } catch (error) {
    logFailure(`Failed: ${description}`);
    logFailure(`   Error: ${error.message}`);
    failed++;
  }
  
  console.log('-----------------------------------');
}

async function runDatabaseTests() {
  console.log('\n🔍 Starting Ven Me, Baby! Database Tests');
  console.log('=======================================\n');
  
  try {
    // Test database connection
    await runTest(testDatabaseConnection, 'Database connection');
    
    // Test salon table
    await runTest(testSalonTable, 'Salon table exists and has correct schema');
    await runTest(testSalonRecords, 'Salon records exist');
    await runTest(testVenMeBabySalon, 'Ven Me, Baby! LTD salon exists');
    
    // Test client table
    await runTest(testClientTable, 'Client table exists and has correct schema');
    await runTest(testClientRecords, 'Client records exist');
    
    // Test relationships
    await runTest(testClientSalonRelationship, 'Client-salon relationship');
    
    // Test service and promo data within salons
    await runTest(testSalonServices, 'Salon services JSONB data');
    await runTest(testSalonPromos, 'Salon promotions JSONB data');
    
  } catch (error) {
    logFailure(`Unexpected error in test suite: ${error.message}`);
  } finally {
    // Print test summary
    console.log('\n=======================================');
    console.log('🧪 Test Summary:');
    console.log(`   Total: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('=======================================\n');
    
    // Close the database connection pool
    await pool.end();
  }
}

// Individual test implementations

async function testDatabaseConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    assert(result.rows.length === 1, 'Database connection should return a timestamp');
  } finally {
    client.release();
  }
}

async function testSalonTable() {
  const client = await pool.connect();
  try {
    // Check if salons table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'salons'
      );
    `);
    assert(tableCheck.rows[0].exists, 'Salons table should exist');
    
    // Check if columns match our schema
    const columnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'salons';
    `);
    
    const columns = columnsCheck.rows.map(row => row.column_name);
    const requiredColumns = [
      'id', 'name', 'owner_name', 'phone', 'email', 'social_media', 
      'type', 'address', 'city', 'state', 'zip_code', 
      'services', 'promos', 'owner_photo_url', 'created_at'
    ];
    
    for (const col of requiredColumns) {
      assert(columns.includes(col), `Salons table should have column: ${col}`);
    }
  } finally {
    client.release();
  }
}

async function testSalonRecords() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) FROM salons');
    assert(parseInt(result.rows[0].count) > 0, 'Salons table should have records');
  } finally {
    client.release();
  }
}

async function testVenMeBabySalon() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM salons 
      WHERE name LIKE '%Ven Me%'
    `);
    assert(result.rows.length > 0, 'Ven Me, Baby! LTD salon should exist');
    
    const venMeSalon = result.rows[0];
    assert(venMeSalon.name.includes('Ven Me'), 'Salon name should include "Ven Me"');
    assert(venMeSalon.services !== null, 'Ven Me salon should have services');
    assert(venMeSalon.promos !== null, 'Ven Me salon should have promotions');
  } finally {
    client.release();
  }
}

async function testClientTable() {
  const client = await pool.connect();
  try {
    // Check if clients table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clients'
      );
    `);
    assert(tableCheck.rows[0].exists, 'Clients table should exist');
    
    // Check if columns match our schema
    const columnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients';
    `);
    
    const columns = columnsCheck.rows.map(row => row.column_name);
    const requiredColumns = [
      'id', 'name', 'phone', 'email', 'is_current_client', 
      'notes', 'favorite_services', 'salon_id', 'salon_name', 
      'type', 'created_at'
    ];
    
    for (const col of requiredColumns) {
      assert(columns.includes(col), `Clients table should have column: ${col}`);
    }
  } finally {
    client.release();
  }
}

async function testClientRecords() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) FROM clients');
    const clientCount = parseInt(result.rows[0].count);
    logInfo(`Found ${clientCount} client records`);
    // We don't assert a minimum number as we might be testing with an empty database
  } finally {
    client.release();
  }
}

async function testClientSalonRelationship() {
  const client = await pool.connect();
  try {
    // Test the relationship between clients and salons
    const result = await client.query(`
      SELECT c.id, c.name, c.salon_id, s.id as actual_salon_id, s.name as salon_name
      FROM clients c
      LEFT JOIN salons s ON c.salon_id = s.id
      WHERE c.salon_id IS NOT NULL
      LIMIT 5;
    `);
    
    // We just check if the query runs successfully
    // We don't assert anything about the results because a newly initialized 
    // database might not have any clients with salon_id set
    logInfo(`Found ${result.rows.length} clients with salon relationships`);
  } finally {
    client.release();
  }
}

async function testSalonServices() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, services
      FROM salons
      WHERE services IS NOT NULL AND jsonb_array_length(services) > 0
      LIMIT 5;
    `);
    
    if (result.rows.length > 0) {
      const salonWithServices = result.rows[0];
      assert(Array.isArray(salonWithServices.services), 'Services should be an array');
      
      if (salonWithServices.services.length > 0) {
        const firstService = salonWithServices.services[0];
        assert(firstService.name, 'Service should have a name');
        assert('price' in firstService, 'Service should have a price');
        assert('description' in firstService, 'Service should have a description');
      }
    } else {
      logInfo('No salons with services found, skipping detailed service checks');
    }
  } finally {
    client.release();
  }
}

async function testSalonPromos() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, promos
      FROM salons
      WHERE promos IS NOT NULL AND jsonb_array_length(promos) > 0
      LIMIT 5;
    `);
    
    if (result.rows.length > 0) {
      const salonWithPromos = result.rows[0];
      assert(Array.isArray(salonWithPromos.promos), 'Promotions should be an array');
      
      if (salonWithPromos.promos.length > 0) {
        const firstPromo = salonWithPromos.promos[0];
        assert(firstPromo.title, 'Promotion should have a title');
        assert('description' in firstPromo, 'Promotion should have a description');
      }
    } else {
      logInfo('No salons with promotions found, skipping detailed promotion checks');
    }
  } finally {
    client.release();
  }
}

// Run all tests
runDatabaseTests().catch(console.error);