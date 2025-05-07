/**
 * Sponsor Validation Middleware
 * 
 * This middleware ensures that sponsor information is always included in responses
 * for client and invitation endpoints. If missing, it adds default values.
 */
import { Request, Response, NextFunction } from 'express';

export const sponsorValidator = (req: Request, res: Response, next: NextFunction) => {
  // Store original send method
  const originalSend = res.send;
  
  // Override send method
  res.send = function(data) {
    // Only process JSON responses
    try {
      // If data is a string, try to parse it as JSON
      let responseBody = typeof data === 'string' ? JSON.parse(data) : data;
      
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

// Helper function to validate and fix a single item
function validateItem(item: any): any {
  // Skip if not an object or null
  if (!item || typeof item !== 'object') return item;
  
  // Check if it's a client or invitation by presence of certain fields
  const isClient = 'name' in item && 'phone' in item && ('type' in item && item.type === 'client');
  const isInvitation = 'name' in item && 'phone' in item && 'status' in item;
  
  if (isClient) {
    // Ensure sponsor information is present for clients
    if (!item.sponsor || item.sponsor === 'Unknown') {
      item.sponsor = 'VMB LTD';
    }
    
    if (!item.sponsorName || item.sponsorName === 'Unknown') {
      item.sponsorName = 'VMB LTD';
    }
    
    // If salonName is missing or Unknown but sponsorSalonId exists, use sponsor as salonName
    if ((!item.salonName || item.salonName === 'Unknown') && item.sponsorSalonId) {
      item.salonName = item.sponsorName;
    }
    
    // Ensure sponsorSalonId is set to VMB LTD (ID 1) if missing
    if (!item.sponsorSalonId) {
      item.sponsorSalonId = 1; // Default to VMB LTD salon ID
    }
  }
  
  if (isInvitation) {
    // Ensure sponsor information is present for invitations
    if (!item.sponsor || item.sponsor === 'Unknown') {
      item.sponsor = 'VMB LTD';
    }
    
    if (!item.sponsorName || item.sponsorName === 'Unknown') {
      item.sponsorName = 'VMB LTD';
    }
    
    // Ensure salonId is set to VMB LTD (ID 1) if missing
    if (!item.salonId) {
      item.salonId = 1; // Default to VMB LTD salon ID
    }
  }
  
  return item;
}