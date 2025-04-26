import { useState, useCallback } from 'react';
import { validateClientContact, detectInputType, cleanPhoneNumber, isValidEmail, isValidPhone } from '@/lib/utils';

export type ValidationResult = 'loading' | 'registered' | 'not_registered' | 'invalid' | null;

/**
 * Unified Contact Validation Hook
 * Combines functionality from both previous implementations
 */
export function useContactValidation() {
  // Base state from original implementation
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorField, setErrorField] = useState<'' | 'phone' | 'email'>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  
  // State from the other implementation
  const [validationResult, setValidationResult] = useState<ValidationResult>(null);
  const [validatedContactType, setValidatedContactType] = useState<'email' | 'phone' | 'unknown'>('unknown');
  
  /**
   * Format phone number consistently site-wide (XXX-XXX-XXXX)
   */
  const formatPhoneNumber = (input: string) => {
    if (!input) return '';
    const numbers = input.replace(/\D/g, '').slice(0, 10);
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  /**
   * Validate contact information (phone or email) against the database
   * Returns whether the contact exists in the system
   */
  const validateContact = useCallback(async (contact: string): Promise<ValidationResult> => {
    // Don't proceed if empty
    if (!contact || contact.trim() === '') {
      setValidationResult('invalid');
      return 'invalid';
    }

    const contactType = detectInputType(contact);
    setValidatedContactType(contactType);

    // Validate format based on type
    if (contactType === 'email' && !isValidEmail(contact)) {
      setValidationResult('invalid');
      return 'invalid';
    } else if (contactType === 'phone' && !isValidPhone(contact)) {
      setValidationResult('invalid');
      return 'invalid';
    } else if (contactType === 'unknown') {
      setValidationResult('invalid');
      return 'invalid';
    }

    try {
      // Start validation
      setIsValidating(true);
      setValidationResult('loading');
      
      // Format the contact for logging
      const cleanedContact = contactType === 'phone' 
        ? cleanPhoneNumber(contact)
        : contact.toLowerCase();
      
      console.log(`validateContact - Original ${contactType}: ${contact}, Cleaned: ${cleanedContact}`);
      
      // Call the validation function
      const result = await validateClientContact(contact);
      
      // Update the result and state
      if (result.exists) {
        // Update all state variables for compatibility with both implementations
        setValidationResult('registered');
        
        if (contactType === 'phone') {
          setPhoneExists(true);
          setErrorField('phone');
        } else {
          setEmailExists(true);
          setErrorField('email');
        }
        
        return 'registered';
      } else {
        setValidationResult('not_registered');
        
        if (contactType === 'phone') {
          setPhoneExists(false);
        } else {
          setEmailExists(false);
        }
        
        return 'not_registered';
      }
    } catch (error) {
      console.error('Error in useContactValidation:', error);
      setValidationResult('invalid');
      return 'invalid';
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    setValidationResult(null);
    setValidatedContactType('unknown');
    setPhoneExists(false);
    setEmailExists(false);
    setErrorField('');
    setErrorMessage('');
  }, []);

  /**
   * Handle dialog close
   */
  const handleDialogClose = useCallback(() => {
    setShowErrorDialog(false);
  }, []);

  return {
    // Return properties from both implementations for compatibility
    // Original implementation properties
    phoneExists,
    emailExists,
    isValidating,
    errorField,
    errorMessage,
    showErrorDialog,
    setShowErrorDialog,
    duplicateData,
    setDuplicateData,
    formatPhoneNumber,
    validateContact,
    handleDialogClose,
    
    // New implementation properties
    validationResult,
    validatedContactType,
    resetValidation
  };
}