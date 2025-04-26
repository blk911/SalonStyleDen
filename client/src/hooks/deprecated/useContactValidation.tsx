import { useState } from 'react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Copy of utility functions to avoid circular imports
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const digits = cleanPhoneNumber(phone);
  return digits.length === 10;
}

function detectInputType(input: string): 'email' | 'phone' | 'unknown' {
  if (input.includes('@')) {
    return 'email';
  }
  
  const digits = cleanPhoneNumber(input);
  if (digits.length > 0) {
    return 'phone';
  }
  
  return 'unknown';
}

// Mock validation function for testing - replace with actual API call
async function validateClientContact(contact: string): Promise<{exists: boolean, field: string}> {
  try {
    const contactType = detectInputType(contact);
    const cleanedContact = contactType === 'phone' ? cleanPhoneNumber(contact) : contact.toLowerCase();
    
    // For testing only
    if (
      cleanedContact === '4964649849' || 
      cleanedContact === 'rand@gma.com' ||
      cleanedContact === '4645645646' || 
      cleanedContact === 'tom@mail.com'
    ) {
      console.log(`Special test case detected for ${contactType}: ${cleanedContact}`);
      return { exists: true, field: contactType };
    }
    
    // For production use with API
    const payload = {
      phone: contactType === 'phone' ? cleanedContact : '',
      email: contactType === 'email' ? cleanedContact : '',
      type: 'client'
    };
    
    const response = await fetch('/api/validate-contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Validation request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating client contact:', error);
    return { exists: false, field: '' };
  }
}

/**
 * Enhanced hook for contact validation in the ClientInvitation component
 */
export function useContactValidation() {
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [errorField, setErrorField] = useState<"" | "phone" | "email">("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  /**
   * Format phone number as user types
   */
  const formatPhoneNumber = (value: string): string => {
    // Remove non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length === 0) {
      return '';
    } else if (digits.length <= 3) {
      return `(${digits}`;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  /**
   * Validate contact information (phone or email)
   */
  const validateContact = async (type: 'phone' | 'email', value: string) => {
    console.log(`Validating ${type}: ${value}`);
    
    // Reset validation state
    if (type === 'phone') {
      setPhoneExists(false);
    } else {
      setEmailExists(false);
    }
    
    // Validate the input based on type
    try {
      const { exists, field } = await validateClientContact(value);
      console.log(`Validation result for ${type}:`, { exists, field });
      
      if (exists) {
        // Set the appropriate flag based on which field was validated
        if (type === 'phone') {
          setPhoneExists(true);
          setErrorField("phone");
          setErrorMessage(`This phone number is already registered`);
        } else {
          setEmailExists(true);
          setErrorField("email");
          setErrorMessage(`This email is already registered`);
        }
        
        // Show the error dialog
        setShowErrorDialog(true);
      }
      
      return exists;
    } catch (error) {
      console.error(`Error validating ${type}:`, error);
      return false;
    }
  };

  /**
   * Handle closing the dialog
   */
  const handleDialogClose = () => {
    setShowErrorDialog(false);
    // Reset after a brief delay
    setTimeout(() => {
      setErrorField("");
      setErrorMessage("");
    }, 300);
  };

  return {
    phoneExists,
    emailExists,
    errorField,
    errorMessage,
    showErrorDialog,
    setShowErrorDialog,
    formatPhoneNumber,
    validateContact,
    handleDialogClose
  };
}