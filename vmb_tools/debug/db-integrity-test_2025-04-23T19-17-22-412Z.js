/**
 * VMB Database Integrity Test
 * This script checks database schema integrity and relationships
 */

const { db } = require('./server/db');
const { green, red, yellow, cyan, reset } = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const PASS = `${green}✓${reset}`;
const FAIL = `${red}✗${reset}`;
const WARN = `${yellow}⚠${reset}`;

async function checkTables() {
  console.log(`${cyan}=== Testing Database Tables ===${reset}`);
  
  const requiredTables = [
    'clients',
    'salons',
    'services',
    'invitations',
    'style_selections',
    'promos'
  ];
  
  const tableResults = [];
  
  try {
    // Get list of all tables in the database
    const results = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = results.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables in database`);
    
    // Check if all required tables exist
    for (const table of requiredTables) {
      const exists = tables.includes(table);
      
      if (exists) {
        console.log(`${PASS} Table '${table}' exists`);
        
        // Check records count
        const countResult = await db.execute(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`   - Contains ${count} records`);
        
        tableResults.push({
          table,
          exists: true,
          recordCount: count
        });
      } else {
        console.log(`${FAIL} Table '${table}' is missing`);
        tableResults.push({
          table,
          exists: false,
          recordCount: 0
        });
      }
    }
    
    return tableResults;
  } catch (error) {
    console.error(`${FAIL} Error checking tables: ${error.message}`);
    return [];
  }
}

async function checkRelationships() {
  console.log(`\n${cyan}=== Testing Database Relationships ===${reset}`);
  
  const relationships = [
    { parent: 'salons', child: 'services', foreign_key: 'salon_id' },
    { parent: 'salons', child: 'promos', foreign_key: 'salon_id' },
    { parent: 'salons', child: 'clients', foreign_key: 'salon_id' },
    { parent: 'salons', child: 'invitations', foreign_key: 'salon_id' },
    { parent: 'clients', child: 'style_selections', foreign_key: 'client_id' },
    { parent: 'services', child: 'style_selections', foreign_key: 'style_id' }
  ];
  
  const relationResults = [];
  
  for (const rel of relationships) {
    try {
      // Check if parent records have corresponding child records
      const query = `
        SELECT COUNT(*) AS valid_relations
        FROM ${rel.parent} p
        JOIN ${rel.child} c ON p.id = c.${rel.foreign_key}
      `;
      
      const result = await db.execute(query);
      const validRelations = parseInt(result.rows[0].valid_relations);
      
      if (validRelations > 0) {
        console.log(`${PASS} Relationship: ${rel.parent} has ${validRelations} corresponding records in ${rel.child}`);
        relationResults.push({
          parent: rel.parent,
          child: rel.child,
          valid: true,
          count: validRelations
        });
      } else {
        console.log(`${WARN} Relationship: No records linking ${rel.parent} to ${rel.child}`);
        relationResults.push({
          parent: rel.parent,
          child: rel.child,
          valid: false,
          count: 0
        });
      }
    } catch (error) {
      console.error(`${FAIL} Error checking relationship ${rel.parent} -> ${rel.child}: ${error.message}`);
      relationResults.push({
        parent: rel.parent,
        child: rel.child,
        valid: false,
        error: error.message
      });
    }
  }
  
  return relationResults;
}

async function checkInvitationIntegrity() {
  console.log(`\n${cyan}=== Testing Invitation System Integrity ===${reset}`);
  
  try {
    // Check for orphaned invitations (no salon)
    const orphanedResult = await db.execute(`
      SELECT COUNT(*) AS count
      FROM invitations i
      LEFT JOIN salons s ON i.salon_id = s.id
      WHERE s.id IS NULL
    `);
    
    const orphanedCount = parseInt(orphanedResult.rows[0].count);
    
    if (orphanedCount === 0) {
      console.log(`${PASS} No orphaned invitations found`);
    } else {
      console.log(`${FAIL} Found ${orphanedCount} orphaned invitations (missing salon reference)`);
    }
    
    // Check invitation status integrity
    const statusResult = await db.execute(`
      SELECT status, COUNT(*) AS count
      FROM invitations
      GROUP BY status
    `);
    
    console.log('Invitation status distribution:');
    statusResult.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} invitations`);
    });
    
    return {
      orphanedCount,
      statusDistribution: statusResult.rows
    };
  } catch (error) {
    console.error(`${FAIL} Error checking invitation integrity: ${error.message}`);
    return {
      orphanedCount: -1,
      statusDistribution: []
    };
  }
}

async function checkStyleSelectionIntegrity() {
  console.log(`\n${cyan}=== Testing Style Selection Integrity ===${reset}`);
  
  try {
    // Check for orphaned style selections
    const orphanedResult = await db.execute(`
      SELECT COUNT(*) AS count
      FROM style_selections ss
      LEFT JOIN clients c ON ss.client_id = c.id
      LEFT JOIN services s ON ss.style_id = s.id
      WHERE c.id IS NULL OR s.id IS NULL
    `);
    
    const orphanedCount = parseInt(orphanedResult.rows[0].count);
    
    if (orphanedCount === 0) {
      console.log(`${PASS} No orphaned style selections found`);
    } else {
      console.log(`${FAIL} Found ${orphanedCount} orphaned style selections (missing client or service reference)`);
    }
    
    // Check style selection status integrity
    const statusResult = await db.execute(`
      SELECT status, COUNT(*) AS count
      FROM style_selections
      GROUP BY status
    `);
    
    console.log('Style selection status distribution:');
    statusResult.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} selections`);
    });
    
    return {
      orphanedCount,
      statusDistribution: statusResult.rows
    };
  } catch (error) {
    console.error(`${FAIL} Error checking style selection integrity: ${error.message}`);
    return {
      orphanedCount: -1,
      statusDistribution: []
    };
  }
}

async function runTests() {
  console.log(`${cyan}=== VMB Database Integrity Test ===${reset}`);
  console.log(`Testing at ${new Date().toLocaleString()}\n`);
  
  try {
    // First check connection
    await db.execute('SELECT 1');
    console.log(`${PASS} Database connection successful\n`);
    
    // Check tables
    const tables = await checkTables();
    
    // Check relationships
    const relationships = await checkRelationships();
    
    // Check invitation integrity
    const invitationIntegrity = await checkInvitationIntegrity();
    
    // Check style selection integrity
    const styleSelectionIntegrity = await checkStyleSelectionIntegrity();
    
    // Print test summary
    console.log(`\n${cyan}=== Test Summary ===${reset}`);
    console.log(`Tables checked: ${tables.length}`);
    console.log(`Relationships checked: ${relationships.length}`);
    
    const validRelationships = relationships.filter(r => r.valid).length;
    console.log(`Valid relationships: ${validRelationships}/${relationships.length}`);
    
    console.log(`\nTest completed at ${new Date().toLocaleString()}`);
    
    // Close connection
    await db.end();
  } catch (error) {
    console.error(`\n${FAIL} Test failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests();
