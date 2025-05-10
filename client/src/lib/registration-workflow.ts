/**
 * Client Registration Flow Workflow
 * 
 * This script handles the step-by-step client registration workflow:
 * 1. Gift/Invitation selected
 * 2. Trigger phone number validation
 * 3. Check if phone exists in database
 * 4. If no phone match, continue with new registration
 * 5. If phone exists, retrieve all associated data (salon, gifts, client details)
 * 6. Handle gift/invitation redemption process
 * 7. Display welcome message with client name
 * 8. Complete registration with required fields
 * 9. Collect address information
 * 10. Update all endpoints (database, UI, etc.)
 * 11. Show address confirmation
 * 12. Return to client dashboard
 */

import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Function to check if a phone number has unredeemed gifts
export async function checkUnredeemedGifts(phone: string): Promise<{
  hasUnredeemedGift: boolean;
  gift?: any;
}> {
  try {
    console.log(`[REGISTRATION] Checking for unredeemed gifts for phone ${phone}`);
    
    // Clean the phone number to ensure consistent format
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      console.error(`[REGISTRATION] Invalid phone number format: ${phone}`);
      return { hasUnredeemedGift: false };
    }
    
    // Call the API to check for unredeemed gifts
    const response = await apiRequest("GET", `/api/gifts/check-phone/${cleanPhone}`);
    const data = await response.json();
    
    console.log(`[REGISTRATION] Gift check result:`, data);
    return data;
  } catch (error) {
    console.error(`[REGISTRATION] Error checking for unredeemed gifts:`, error);
    return { hasUnredeemedGift: false };
  }
}

// Function to validate registration data against business rules
export async function validateRegistration(
  phone: string,
  email: string = ""
): Promise<{
  isValid: boolean;
  message?: string;
  hasUnredeemedGift?: boolean;
  requiresAddress?: boolean;
  existingClient?: any;
}> {
  try {
    console.log(`[REGISTRATION] Validating registration for phone ${phone}, email ${email}`);
    
    // Clean the phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return { 
        isValid: false, 
        message: "Phone number must contain at least 10 digits" 
      };
    }
    
    // Call the API to validate the registration
    const response = await apiRequest("POST", "/api/validate-registration", {
      phone: cleanPhone,
      email
    });
    
    const data = await response.json();
    console.log(`[REGISTRATION] Validation result:`, data);
    
    return data;
  } catch (error) {
    console.error(`[REGISTRATION] Error validating registration:`, error);
    return { 
      isValid: false, 
      message: "An error occurred during validation" 
    };
  }
}

// Function to register a new client
export async function registerClient(clientData: any): Promise<{
  success: boolean;
  client?: any;
  message?: string;
}> {
  try {
    console.log(`[REGISTRATION] Registering new client:`, clientData);
    
    // Call the API to register the client
    const response = await apiRequest("POST", "/api/clients", clientData);
    
    // Handle different response statuses
    if (response.status === 409) {
      // Conflict - Client already exists
      const data = await response.json();
      console.log(`[REGISTRATION] Client already exists:`, data);
      return {
        success: false,
        message: data.message || "This contact information is already registered",
        client: data
      };
    } else if (response.status === 200) {
      // Success - Existing client found (not an error)
      const data = await response.json();
      console.log(`[REGISTRATION] Existing client found:`, data);
      return {
        success: true,
        client: data,
        message: "Existing client found"
      };
    } else if (response.status === 201) {
      // Success - New client created
      const data = await response.json();
      console.log(`[REGISTRATION] New client created:`, data);
      
      // Invalidate the clients query to refresh client lists
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      return {
        success: true,
        client: data,
        message: "Registration successful"
      };
    } else {
      // Other error
      const data = await response.json();
      console.error(`[REGISTRATION] Registration failed:`, data);
      return {
        success: false,
        message: data.error || "Registration failed"
      };
    }
  } catch (error) {
    console.error(`[REGISTRATION] Error registering client:`, error);
    return {
      success: false,
      message: "An error occurred during registration"
    };
  }
}

// Function to update client address
export async function updateClientAddress(
  clientId: number,
  addressData: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }
): Promise<{
  success: boolean;
  client?: any;
  message?: string;
}> {
  try {
    console.log(`[REGISTRATION] Updating address for client ${clientId}:`, addressData);
    
    // Call the API to update the client's address
    const response = await apiRequest("PATCH", `/api/clients/${clientId}`, addressData);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[REGISTRATION] Address updated successfully:`, data);
      
      // Invalidate the client query to refresh client data
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      
      return {
        success: true,
        client: data,
        message: "Address updated successfully"
      };
    } else {
      const data = await response.json();
      console.error(`[REGISTRATION] Address update failed:`, data);
      return {
        success: false,
        message: data.error || "Failed to update address"
      };
    }
  } catch (error) {
    console.error(`[REGISTRATION] Error updating client address:`, error);
    return {
      success: false,
      message: "An error occurred updating the address"
    };
  }
}

// Function to redeem a gift for a client
export async function redeemGift(
  giftId: number,
  clientId: number
): Promise<{
  success: boolean;
  message?: string;
  gift?: any;
}> {
  try {
    console.log(`[REGISTRATION] Redeeming gift ${giftId} for client ${clientId}`);
    
    // Call the API to redeem the gift
    const response = await apiRequest("PATCH", `/api/gifts/${giftId}/status`, {
      status: "redeemed",
      recipientId: clientId
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[REGISTRATION] Gift redeemed successfully:`, data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/gifts'] });
      queryClient.invalidateQueries({ queryKey: [`/api/gifts/${giftId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${clientId}`] });
      
      return {
        success: true,
        gift: data,
        message: "Gift redeemed successfully"
      };
    } else {
      const data = await response.json();
      console.error(`[REGISTRATION] Gift redemption failed:`, data);
      return {
        success: false,
        message: data.error || "Failed to redeem gift"
      };
    }
  } catch (error) {
    console.error(`[REGISTRATION] Error redeeming gift:`, error);
    return {
      success: false,
      message: "An error occurred redeeming the gift"
    };
  }
}

// Function to handle the complete registration and redemption workflow
export async function completeRegistrationWorkflow(
  registrationData: any,
  giftId?: number
): Promise<{
  success: boolean;
  message?: string;
  client?: any;
  requiresAddress?: boolean;
}> {
  try {
    // Step 1: Register the client
    const registration = await registerClient(registrationData);
    
    if (!registration.success) {
      return registration;
    }
    
    const client = registration.client;
    
    // Step 2: If there's a gift to redeem, redeem it
    if (giftId && client.id) {
      const redemption = await redeemGift(giftId, client.id);
      
      if (!redemption.success) {
        return {
          success: false,
          message: `Registration successful but gift redemption failed: ${redemption.message}`,
          client
        };
      }
    }
    
    // Step 3: Check if address is required
    const requiresAddress = !client.address || !client.city || !client.state || !client.zipCode;
    
    return {
      success: true,
      message: "Registration and gift redemption completed successfully",
      client,
      requiresAddress
    };
  } catch (error) {
    console.error(`[REGISTRATION] Error in registration workflow:`, error);
    return {
      success: false,
      message: "An error occurred during the registration process"
    };
  }
}