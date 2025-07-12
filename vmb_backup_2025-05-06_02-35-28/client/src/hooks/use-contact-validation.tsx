import { useState } from 'react';
import { validateClientContact, detectInputType, cleanPhoneNumber, isValidEmail, isValidPhone } from '@/lib/utils';

export type ValidationResult = 'loading' | 'registered' | 'not_registered' | 'invalid' | null;

interface UseContactValidationResult {
  validationResult: ValidationResult;
  validateContact: (contact: string) => Promise<ValidationResult>;
  isValidating: boolean;
  validatedContactType: 'email' | 'phone' | 'unknown';
  resetValidation: () => void;
}

/**
 * Hook for validating contact information (phone/email) against the database
 * to check if a client is registered
 */
export function useContactValidation(): UseContactValidationResult {
  const [validationResult, setValidationResult] = useState<ValidationResult>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedContactType, setValidatedContactType] = useState<'email' | 'phone' | 'unknown'>('unknown');

  const validateContact = async (contact: string): Promise<ValidationResult> => {
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
      console.log(`Validating ${contactType}:`, cleanedContact);
      
      // Call the validation function
      const result = await validateClientContact(contact);
      
      // Update the result
      if (result.exists) {
        setValidationResult('registered');
        return 'registered';
      } else {
        setValidationResult('not_registered');
        return 'not_registered';
      }
    } catch (error) {
      console.error('Error in useContactValidation:', error);
      setValidationResult('invalid');
      return 'invalid';
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setValidatedContactType('unknown');
  };

  return {
    validationResult,
    validateContact,
    isValidating,
    validatedContactType,
    resetValidation
  };
}