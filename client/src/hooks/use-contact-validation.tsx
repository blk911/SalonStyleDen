import { useState } from 'react';
import { validateClientContact, detectInputType, cleanPhoneNumber, isValidEmail, isValidPhone } from '@/lib/utils';

export type ValidationResult = 'loading' | 'registered' | 'not_registered' | 'invalid' | 'has_unredeemed_gift' | null;

interface ValidationState {
  result: ValidationResult;
  hasUnredeemedGift?: boolean;
  requiresAddress?: boolean;
}

interface UseContactValidationResult {
  validationResult: ValidationResult;
  validateContact: (contact: string) => Promise<ValidationResult>;
  isValidating: boolean;
  validatedContactType: 'email' | 'phone' | 'unknown';
  resetValidation: () => void;
  hasUnredeemedGift: boolean;
  requiresAddress: boolean;
}

/**
 * Hook for validating contact information (phone/email) against the database
 * to check if a client is registered and if they have unredeemed gifts
 */
export function useContactValidation(): UseContactValidationResult {
  const [validationState, setValidationState] = useState<ValidationState>({ result: null });
  const [isValidating, setIsValidating] = useState(false);
  const [validatedContactType, setValidatedContactType] = useState<'email' | 'phone' | 'unknown'>('unknown');

  const validateContact = async (contact: string): Promise<ValidationResult> => {
    // Don't proceed if empty
    if (!contact || contact.trim() === '') {
      setValidationState({ result: 'invalid' });
      return 'invalid';
    }

    const contactType = detectInputType(contact);
    setValidatedContactType(contactType);

    // Validate format based on type
    if (contactType === 'email' && !isValidEmail(contact)) {
      setValidationState({ result: 'invalid' });
      return 'invalid';
    } else if (contactType === 'phone' && !isValidPhone(contact)) {
      setValidationState({ result: 'invalid' });
      return 'invalid';
    } else if (contactType === 'unknown') {
      setValidationState({ result: 'invalid' });
      return 'invalid';
    }

    try {
      // Start validation
      setIsValidating(true);
      setValidationState({ result: 'loading' });
      
      // Format the contact for logging
      const cleanedContact = contactType === 'phone' 
        ? cleanPhoneNumber(contact)
        : contact.toLowerCase();
      
      console.log(`validateContact - Original ${contactType}: ${contact}, Cleaned: ${cleanedContact}`);
      console.log(`Validating ${contactType}:`, cleanedContact);
      
      // Call the validation function
      const result = await validateClientContact(contact);
      console.log('Contact validation result:', result);
      
      // Enhanced debugging for gift validation
      console.log('Checking for unredeemed gift:', {
        hasUnredeemedGift: result.hasUnredeemedGift,
        requiresAddress: result.requiresAddress
      });
      
      // Handle unredeemed gift case
      if (result.hasUnredeemedGift) {
        console.log('Contact has unredeemed gift - setting validation state');
        setValidationState({ 
          result: 'has_unredeemed_gift',
          hasUnredeemedGift: true,
          requiresAddress: result.requiresAddress || false
        });
        return 'has_unredeemed_gift';
      }
      
      // Handle normal cases
      if (result.exists) {
        setValidationState({ result: 'registered' });
        return 'registered';
      } else {
        setValidationState({ result: 'not_registered' });
        return 'not_registered';
      }
    } catch (error) {
      console.error('Error in useContactValidation:', error);
      setValidationState({ result: 'invalid' });
      return 'invalid';
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationState({ result: null });
    setValidatedContactType('unknown');
  };

  return {
    validationResult: validationState.result,
    validateContact,
    isValidating,
    validatedContactType,
    resetValidation,
    hasUnredeemedGift: validationState.hasUnredeemedGift || false,
    requiresAddress: validationState.requiresAddress || false
  };
}