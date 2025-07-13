/**
 * Sponsor Validation Middleware
 * 
 * [RULE: SponsorClientRelationship] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
 * 
 * This middleware enforces the VMB sponsor relationship rule:
 * - Every client MUST have a sponsor in their record
 * - Every invitation MUST have a salon relationship
 * - If missing, the default is VMB LTD (ID: 1)
 * 
 * This is a critical system component that maintains data integrity by
 * ensuring no object leaves the API without proper relationship tracking.
 */
import { Request, Response, NextFunction } from 'express';
import { smartJsonHandler } from '../../shared/utils/json';

export const sponsorValidator = (req: Request, res: Response, next: NextFunction) => {
  // Store original send method
  const originalSend = res.send;
  
  // Override send method
  res.send = function(data) {
    // Only process JSON responses
    try {
      // Use smart JSON handler to safely handle both strings and objects
      let responseBody = smartJsonHandler(data);
      
      // If parsing failed, use original data
      if (responseBody === null) {
        responseBody = data;
      }
      
      // If it's an array, validate each item
      if (Array.isArray(responseBody)) {
        responseBody = responseBody.map(item => validateItem(item));
      } else {
        // If it's a single object, validate it
        responseBody = validateItem(responseBody);
      }
      
      // Convert back to string if needed
      const processedData = typeof data === 'string' 
        ? JSON.stringify(responseBody) 
        : responseBody;
      
      // Call the original send with our processed data
      return originalSend.call(this, processedData);
    } catch (error) {
      // If error in processing, just pass through original data
      console.error('Error in sponsor validation middleware:', error);
      return originalSend.call(this, data);
    }
  };
  
  next();
};

// [RULE: SponsorValidation] Helper function to validate and fix a single item
function validateItem(item: any): any {
  // Skip if not an object or null
  if (!item || typeof item !== 'object') return item;
  
  // Check if it's a client or invitation by presence of certain fields
  const isClient = 'name' in item && 'phone' in item && ('type' in item && item.type === 'client');
  const isInvitation = 'name' in item && 'phone' in item && 'status' in item;
  
  if (isClient) {
    // [RULE: SponsorClientRelationship] Ensure sponsor information is present for clients
    if (!item.sponsor || item.sponsor === 'Unknown') {
      console.warn(`[RULE ENFORCEMENT] Applying default sponsor 'VMB LTD' to client ${item.name}`);
      item.sponsor = 'VMB LTD';
    }
    
    if (!item.sponsorName || item.sponsorName === 'Unknown') {
      item.sponsorName = 'VMB LTD';
    }
    
    // If salonName is missing or Unknown but sponsorSalonId exists, use sponsor as salonName
    if ((!item.salonName || item.salonName === 'Unknown') && item.sponsorSalonId) {
      item.salonName = item.sponsorName;
    }
    
    // [RULE: SponsorClientRelationship] Ensure sponsorSalonId is set to VMB LTD (ID 1) if missing
    if (!item.sponsorSalonId) {
      console.warn(`[RULE ENFORCEMENT] Applying default sponsorSalonId (1) to client ${item.name}`);
      item.sponsorSalonId = 1; // Default to VMB LTD salon ID
    }
  }
  
  if (isInvitation) {
    // [RULE: SponsorClientRelationship] Ensure sponsor information is present for invitations
    if (!item.sponsor || item.sponsor === 'Unknown') {
      console.warn(`[RULE ENFORCEMENT] Applying default sponsor 'VMB LTD' to invitation for ${item.name}`);
      item.sponsor = 'VMB LTD';
    }
    
    if (!item.sponsorName || item.sponsorName === 'Unknown') {
      item.sponsorName = 'VMB LTD';
    }
    
    // [RULE: SponsorClientRelationship] Ensure salonId is set to VMB LTD (ID 1) if missing
    if (!item.salonId) {
      console.warn(`[RULE ENFORCEMENT] Applying default salonId (1) to invitation for ${item.name}`);
      item.salonId = 1; // Default to VMB LTD salon ID
    }
    
    // [RULE: UniqueInvitationID] Ensure inviteHash exists - this should not typically happen
    // as invitations should always have a hash from creation, but adding as safeguard
    if (!item.inviteHash) {
      console.error(`[RULE VIOLATION] Invitation for ${item.name} missing inviteHash`);
      // We can't create a valid hash here, but we'll at least log the issue
    }
  }
  
  return item;
}