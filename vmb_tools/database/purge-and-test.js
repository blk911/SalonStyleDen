/**
 * VMB System Cleanup and Component Testing
 * 
 * This script will:
 * 1. Purge all invitations, clients, and salons (except salon #2)
 * 2. Run tests on all components and endpoints
 * 3. Generate a comprehensive report of results
 */

import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Terminal colors for nice output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Icons for test results
const icons = {
  success: '✅',
  failure: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

/**
 * Database Purge Operations
 */
async function purgeDatabase() {
  console.log(`${colors.magenta}${colors.bold}=== STARTING DATABASE PURGE ===${colors.reset}`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Log current counts
    const beforeCounts = await getTableCounts(client);
    console.log(`${colors.cyan}Current database state:${colors.reset}`);
    Object.entries(beforeCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    // 1. Delete all invitations
    const deleteInvitationsResult = await client.query('DELETE FROM invitations');
    console.log(`${icons.success} Deleted ${deleteInvitationsResult.rowCount} invitations`);
    
    // 2. Delete all style_selections
    const deleteStyleSelectionsResult = await client.query('DELETE FROM style_selections');
    console.log(`${icons.success} Deleted ${deleteStyleSelectionsResult.rowCount} style selections`);
    
    // 3. Delete all clients
    const deleteClientsResult = await client.query('DELETE FROM clients');
    console.log(`${icons.success} Deleted ${deleteClientsResult.rowCount} clients`);
    
    // 4. Delete all salons except salon #2
    const deleteSalonsResult = await client.query('DELETE FROM salons WHERE id != 2 AND id != 42');
    console.log(`${icons.success} Deleted ${deleteSalonsResult.rowCount} salons (keeping salon #2 and #42)`);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Log final counts
    const afterCounts = await getTableCounts(client);
    console.log(`${colors.cyan}Database state after purge:${colors.reset}`);
    Object.entries(afterCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
    console.log(`${colors.green}${colors.bold}=== DATABASE PURGE COMPLETED SUCCESSFULLY ===${colors.reset}`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`${icons.failure} ${colors.red}Database purge failed:${colors.reset}`, error);
    return false;
  } finally {
    client.release();
  }
}

async function getTableCounts(client) {
  const tables = ['invitations', 'style_selections', 'clients', 'salons', 'users'];
  const counts = {};
  
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
    counts[table] = parseInt(result.rows[0].count);
  }
  
  return counts;
}

/**
 * Component and Endpoint Testing
 */
async function testComponents() {
  console.log(`${colors.magenta}${colors.bold}=== STARTING COMPONENT TESTS ===${colors.reset}`);
  
  const results = {
    components: {},
    routes: {},
    scripts: {}
  };
  
  // Test database connection
  results.database = await testDatabase();
  
  // Test API endpoints
  results.routes = await testAPIEndpoints();
  
  // Test essential client components
  results.components = await testClientComponents();
  
  // Print test results report
  printTestReport(results);
  
  return results;
}

async function testDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    return {
      status: 'success',
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    };
  } catch (error) {
    return {
      status: 'failure',
      message: `Database connection failed: ${error.message}`
    };
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { name: '/api/health', method: 'GET', expectedStatus: 200 },
    { name: '/api/status', method: 'GET', expectedStatus: 200 },
    { name: '/api/salons', method: 'GET', expectedStatus: 200 },
    { name: '/api/salons/42', method: 'GET', expectedStatus: 200 },
    { name: '/api/salons/42/services', method: 'GET', expectedStatus: 200 },
    { name: '/api/salons/42/promotions', method: 'GET', expectedStatus: 200 },
    { name: '/api/salons/42/invitations', method: 'GET', expectedStatus: 200 }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      // Using curl for simplicity
      const command = `curl -s -o /dev/null -w "%{http_code}" -X ${endpoint.method} http://localhost:5000${endpoint.name}`;
      const statusCode = parseInt(execSync(command).toString().trim());
      
      results[endpoint.name] = {
        status: statusCode === endpoint.expectedStatus ? 'success' : 'failure',
        statusCode,
        expectedStatus: endpoint.expectedStatus,
        method: endpoint.method
      };
    } catch (error) {
      results[endpoint.name] = {
        status: 'failure',
        message: error.message,
        method: endpoint.method
      };
    }
  }
  
  return results;
}

async function testClientComponents() {
  const components = [
    'client/src/components/dashboard/ClientInvitation.tsx',
    'client/src/components/promos/VmbStyleOptions.tsx', 
    'client/src/pages/CompleteInvitationPage.tsx',
    'client/src/components/dashboard/InlineVmbInvitations.tsx',
    'client/src/components/dashboard/RecentVmbInvitations.tsx',
    'client/src/components/dashboard/InviteCompleteStatus.tsx',
    'client/src/pages/ClientDashboard.tsx',
    'client/src/pages/SalonDashboard.tsx',
    'client/src/pages/AdminDashboard.tsx',
    'client/src/pages/InvitationPage.tsx'
  ];
  
  const results = {};
  
  for (const component of components) {
    try {
      // Simply check if file exists and contains React component patterns
      const exists = fs.existsSync(component);
      if (!exists) {
        results[component] = {
          status: 'failure',
          message: 'File does not exist'
        };
        continue;
      }
      
      const content = fs.readFileSync(component, 'utf8');
      const hasImportReact = content.includes('import') && (content.includes('React') || content.includes('react'));
      const hasComponentStructure = content.includes('export default') || 
                                    content.includes('function') || 
                                    content.includes('const') && content.includes('=>');
      
      results[component] = {
        status: (hasComponentStructure) ? 'success' : 'warning',
        fileExists: true,
        hasReactImports: hasImportReact,
        hasComponentStructure: hasComponentStructure,
        fileSizeBytes: Buffer.byteLength(content)
      };
    } catch (error) {
      results[component] = {
        status: 'failure',
        message: error.message
      };
    }
  }
  
  return results;
}

function printTestReport(results) {
  console.log(`${colors.magenta}${colors.bold}=== TEST RESULTS REPORT ===${colors.reset}`);
  
  // Database results
  console.log(`\n${colors.bold}Database Connection:${colors.reset}`);
  const dbIcon = results.database.status === 'success' ? icons.success : icons.failure;
  console.log(`  ${dbIcon} ${results.database.message}`);
  
  // API Endpoint results
  console.log(`\n${colors.bold}API Endpoints:${colors.reset}`);
  Object.entries(results.routes).forEach(([endpoint, result]) => {
    const icon = result.status === 'success' ? icons.success : icons.failure;
    const statusColor = result.status === 'success' ? colors.green : colors.red;
    console.log(`  ${icon} ${endpoint} [${result.method}]: ${statusColor}${result.statusCode || 'N/A'}${colors.reset}`);
  });
  
  // Component results
  console.log(`\n${colors.bold}Client Components:${colors.reset}`);
  Object.entries(results.components).forEach(([component, result]) => {
    let icon;
    let statusColor;
    
    if (result.status === 'success') {
      icon = icons.success;
      statusColor = colors.green;
    } else if (result.status === 'warning') {
      icon = icons.warning;
      statusColor = colors.yellow;
    } else {
      icon = icons.failure;
      statusColor = colors.red;
    }
    
    console.log(`  ${icon} ${path.basename(component)}: ${statusColor}${result.status}${colors.reset}`);
    
    if (result.status !== 'failure') {
      const sizeKB = (result.fileSizeBytes / 1024).toFixed(2);
      console.log(`     Size: ${sizeKB} KB`);
      console.log(`     Component structure: ${result.hasComponentStructure ? '✓' : '✗'}`);
    } else {
      console.log(`     Error: ${result.message}`);
    }
  });
  
  // Summary
  const totalTests = 1 + Object.keys(results.routes).length + Object.keys(results.components).length;
  const successfulTests = [
    results.database.status === 'success' ? 1 : 0,
    Object.values(results.routes).filter(r => r.status === 'success').length,
    Object.values(results.components).filter(r => r.status === 'success').length
  ].reduce((a, b) => a + b, 0);
  
  const passRate = (successfulTests / totalTests * 100).toFixed(2);
  
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total tests: ${totalTests}`);
  console.log(`  Successful tests: ${successfulTests}`);
  console.log(`  Pass rate: ${passRate}%`);
  
  if (passRate >= 90) {
    console.log(`\n${colors.green}${colors.bold}TEST SUITE PASSED SUCCESSFULLY${colors.reset}`);
  } else if (passRate >= 75) {
    console.log(`\n${colors.yellow}${colors.bold}TEST SUITE PASSED WITH WARNINGS${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}TEST SUITE FAILED${colors.reset}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}=== VMB SYSTEM CLEANUP AND TEST UTILITY ===${colors.reset}`);
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  // Step 1: Purge database
  const purgeResult = await purgeDatabase();
  if (!purgeResult) {
    console.log(`${colors.red}${colors.bold}Database purge failed, aborting tests.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Component Testing
  await testComponents();
  
  console.log(`\n${colors.bold}${colors.blue}=== CLEANUP AND TEST COMPLETE ===${colors.reset}`);
  console.log(`Completed at: ${new Date().toLocaleString()}`);
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}${colors.bold}Unhandled error:${colors.reset}`, error);
  process.exit(1);
}).finally(() => {
  pool.end();
});