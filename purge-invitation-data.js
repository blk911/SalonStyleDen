/**
 * VMB Invitation and Style Selection Purge Script
 * 
 * This script will:
 * 1. Show all current invitations in the system
 * 2. Clear all entries from the style_selections table
 * 3. Reset all invitations to 'pending' status (or delete them on demand)
 * 
 * Note: Running this script will clear all style selections and reset invitation status.
 * Use with caution as this is a destructive operation.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function listInvitations() {
  try {
    const result = await pool.query('SELECT * FROM invitations');
    console.log('\nCurrent invitations in the system:');
    console.table(result.rows);
    console.log(`Total invitations: ${result.rows.length}`);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
}

async function listStyleSelections() {
  try {
    const result = await pool.query('SELECT * FROM style_selections');
    console.log('\nCurrent style selections in the system:');
    
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('No style selections found.');
    }
    
    console.log(`Total style selections: ${result.rows.length}`);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching style selections:', error);
    return [];
  }
}

async function resetInvitationStatus() {
  try {
    const result = await pool.query(`
      UPDATE invitations 
      SET status = 'pending'
      RETURNING id, name, status
    `);
    
    console.log('\nInvitation statuses reset to "pending":');
    console.table(result.rows);
    console.log(`${result.rows.length} invitations updated.`);
  } catch (error) {
    console.error('Error resetting invitation status:', error);
  }
}

async function purgeStyleSelections() {
  try {
    const result = await pool.query('DELETE FROM style_selections RETURNING *');
    console.log('\nPurged style selections:');
    
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('No style selections to purge.');
    }
    
    console.log(`${result.rows.length} style selections deleted.`);
  } catch (error) {
    console.error('Error purging style selections:', error);
  }
}

async function deleteInvitations() {
  try {
    const result = await pool.query('DELETE FROM invitations RETURNING id, name');
    console.log('\nDeleted invitations:');
    
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('No invitations to delete.');
    }
    
    console.log(`${result.rows.length} invitations deleted.`);
  } catch (error) {
    console.error('Error deleting invitations:', error);
  }
}

async function run() {
  console.log('VMB INVITATION AND STYLE SELECTION PURGE SCRIPT');
  console.log('=============================================');
  
  await listInvitations();
  await listStyleSelections();
  
  rl.question('\nDo you want to purge all style selections? (y/n): ', async (answer1) => {
    if (answer1.toLowerCase() === 'y') {
      await purgeStyleSelections();
    }
    
    rl.question('\nDo you want to reset invitation status to "pending"? (y/n): ', async (answer2) => {
      if (answer2.toLowerCase() === 'y') {
        await resetInvitationStatus();
      }
      
      rl.question('\nDo you want to DELETE ALL invitations? (y/n): ', async (answer3) => {
        if (answer3.toLowerCase() === 'y') {
          rl.question('\nARE YOU SURE? This will delete all invitation data permanently. (yes/no): ', async (confirm) => {
            if (confirm.toLowerCase() === 'yes') {
              await deleteInvitations();
            } else {
              console.log('Invitations deletion cancelled.');
            }
            
            console.log('\nPurge operations completed.');
            pool.end();
            rl.close();
          });
        } else {
          console.log('\nPurge operations completed.');
          pool.end();
          rl.close();
        }
      });
    });
  });
}

// Run the script
run();