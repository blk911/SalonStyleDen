/**
 * EMERGENCY FIX SCRIPT
 * 
 * This script directly fixes the invitation status for Bob's registration
 * It's isolated from other code to prevent any system-wide issues
 * 
 * Problem: Bob (222-222-2222) has an invitation stuck in "pending" status
 * Solution: Update the invitation status to "sent" so it can be redeemed
 * 
 * HOW TO USE:
 * 1. Run this script: node scripts/fix-gift-invitation.js
 * 2. It will update invitation #33 status to "sent"
 * 3. This will allow Bob's phone number to be found during registration
 */

const { Pool } = require('pg');

async function fixBobsInvitation() {
  // Create a direct database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔧 RUNNING EMERGENCY FIX FOR BOB\'S REGISTRATION');
    console.log('-------------------------------------------');
    
    // Step 1: Verify the invitation exists
    const checkQuery = `
      SELECT id, name, phone, status, invite_hash 
      FROM invitations 
      WHERE id = 33 AND phone = '2222222222'
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.error('❌ ERROR: Bob\'s invitation not found!');
      return;
    }
    
    console.log('✅ Found Bob\'s invitation:', checkResult.rows[0]);
    console.log('Current status:', checkResult.rows[0].status);
    
    // Step 2: Update the invitation status to "sent"
    const updateQuery = `
      UPDATE invitations 
      SET status = 'sent' 
      WHERE id = 33 AND phone = '2222222222'
      RETURNING id, name, phone, status
    `;
    
    const updateResult = await pool.query(updateQuery);
    
    if (updateResult.rows.length === 0) {
      console.error('❌ ERROR: Failed to update invitation status!');
      return;
    }
    
    console.log('✅ Successfully updated invitation status to "sent"');
    console.log('Updated invitation:', updateResult.rows[0]);
    
    // Step 3: Verify by querying gifts
    const giftQuery = `
      SELECT id, recipient_phone, status, gift_hash
      FROM gifts
      WHERE recipient_phone = '2222222222'
    `;
    
    const giftResult = await pool.query(giftQuery);
    
    if (giftResult.rows.length > 0) {
      console.log('✅ Found gift for Bob:', giftResult.rows[0]);
      console.log('Gift status:', giftResult.rows[0].status);
      
      // If gift exists but is not in "sent" status, update it
      if (giftResult.rows[0].status !== 'sent') {
        const updateGiftQuery = `
          UPDATE gifts 
          SET status = 'sent' 
          WHERE recipient_phone = '2222222222'
          RETURNING id, recipient_phone, status
        `;
        
        const updateGiftResult = await pool.query(updateGiftQuery);
        
        if (updateGiftResult.rows.length > 0) {
          console.log('✅ Successfully updated gift status to "sent"');
          console.log('Updated gift:', updateGiftResult.rows[0]);
        }
      }
    } else {
      console.log('⚠️ No gift record found for Bob. Creating one from the invitation...');
      
      // Get full invitation details
      const inviteDetailsQuery = `
        SELECT * FROM invitations WHERE id = 33
      `;
      
      const inviteDetails = await pool.query(inviteDetailsQuery);
      const invitation = inviteDetails.rows[0];
      
      if (!invitation) {
        console.error('❌ ERROR: Could not fetch invitation details');
        return;
      }
      
      // Create a gift record
      const createGiftQuery = `
        INSERT INTO gifts (
          sender_id, recipient_phone, gift_hash, amount, status, 
          message, gift_type, salon_id, created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW()
        )
        RETURNING id, recipient_phone, status
      `;
      
      // If sender_id is null, try to find Anna's client ID
      let senderId = invitation.sender_id;
      if (!senderId) {
        const findSenderQuery = `
          SELECT id FROM clients WHERE phone = '1111111111' AND name = 'Anna'
        `;
        
        const senderResult = await pool.query(findSenderQuery);
        if (senderResult.rows.length > 0) {
          senderId = senderResult.rows[0].id;
          console.log('✅ Found Anna\'s client ID:', senderId);
        }
      }
      
      // Generate gift hash if invitation doesn't have one
      const giftHash = invitation.invite_hash || `VMB-GIFT-${Math.random().toString(36).substring(2, 10)}`;
      
      const giftParams = [
        senderId || null,       // sender_id (null if not found)
        '2222222222',           // recipient_phone
        giftHash,               // gift_hash
        5000,                   // amount (default $50)
        'sent',                 // status
        invitation.message || 'Gift from Anna',  // message
        'style_card',           // gift_type
        invitation.salon_id || 2 // salon_id (default to Tiffany's salon if missing)
      ];
      
      try {
        const newGift = await pool.query(createGiftQuery, giftParams);
        console.log('✅ Successfully created gift record for Bob:', newGift.rows[0]);
      } catch (error) {
        console.error('❌ ERROR creating gift record:', error.message);
      }
    }
    
    console.log('-------------------------------------------');
    console.log('✅ FIX COMPLETED: Bob should now be able to register and redeem his gift');
    console.log('-------------------------------------------');
    
  } catch (error) {
    console.error('❌ ERROR RUNNING FIX:', error.message);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the fix script
fixBobsInvitation().catch(console.error);