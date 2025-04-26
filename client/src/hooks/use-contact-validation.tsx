import { useState, useCallback } from 'react';
import { 
  validateClientContact, detectInputType, cleanPhoneNumber, 
  isValidEmail, isValidPhone, formatPhoneNumber, formatPhoneNumberDashed 
} from '@/lib/utils';

// Unified contact validation result type
export type ValidationResult = 'loading' | 'registered' | 'not_registered' | 'invalid' | null;

// Extended Window interface to add global variables for context-aware validation
declare global {
  interface Window {
    _currentSenderId?: number | null;
    _validationContext?: string | null;
  }
}

// Options for configuring the hook's behavior
interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  delay?: number;
  usePhoneFormat?: 'parentheses' | 'dashed';
}

// Enhanced interface that combines features of both hook versions
interface UseContactValidationResult {
  // Core validation states
  validationResult: ValidationResult;
  isValidating: boolean;
  validatedContactType: 'email' | 'phone' | 'unknown';
  
  // Expanded validation states from the alternate implementation
  phoneExists: boolean;
  emailExists: boolean;
  errorField: 'phone' | 'email' | '';
  errorMessage: string;
  showErrorDialog: boolean;
  setShowErrorDialog: (show: boolean) => void;
  
  // Combined validation methods
  validateContact: (contact: string) => Promise<ValidationResult>;
  validateContactByType: (type: 'phone' | 'email', value: string) => Promise<boolean>;
  
  // Helper utilities 
  resetValidation: () => void;
  handleDialogClose: () => void;
  
  // Input props generators
  getPhoneProps: (currentValue: string) => {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    className?: string;
  };
  getEmailProps: (currentValue: string) => {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    className?: string;
  };
}

/**
 * Enhanced and unified hook for validating contact information (phone/email) against the database
 * Combines features from both versions of the validation hook for consistent behavior
 */
export function useContactValidation(options: ValidationOptions = {}): UseContactValidationResult {
  const { 
    validateOnChange = true, 
    validateOnBlur = true,
    delay = 500,
    usePhoneFormat = 'parentheses' 
  } = options;

  // Core validation states
  const [validationResult, setValidationResult] = useState<ValidationResult>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedContactType, setValidatedContactType] = useState<'email' | 'phone' | 'unknown'>('unknown');

  // Additional validation states
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [errorField, setErrorField] = useState<'phone' | 'email' | ''>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [validatedContact, setValidatedContact] = useState('');

  // Combined validation method that detects contact type automatically
  const validateContact = async (contact: string): Promise<ValidationResult> => {
    // Don't proceed if empty
    if (!contact || contact.trim() === '') {
      setValidationResult('invalid');
      return 'invalid';
    }

    const contactType = detectInputType(contact);
    setValidatedContactType(contactType);
    setValidatedContact(contact);

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
      
      // Prepare request body and add sender context if available
      const requestBody: any = {
        phone: contactType === 'phone' ? cleanedContact : '',
        email: contactType === 'email' ? cleanedContact : '',
        type: 'client'
      };
      
      // Add context-aware validation data if available in global scope
      if (typeof window !== 'undefined') {
        if ('_currentSenderId' in window && window._currentSenderId) {
          requestBody.senderId = window._currentSenderId;
        }
        if ('_validationContext' in window && window._validationContext) {
          requestBody.context = window._validationContext;
        }
      }
      
      // Call the validation function
      const response = await fetch('/api/validate-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Validation request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update all validation states consistently
      if (result.exists) {
        setValidationResult('registered');
        
        if (contactType === 'phone') {
          setPhoneExists(true);
          setErrorField('phone');
          setErrorMessage('This phone number is already registered');
        } else {
          setEmailExists(true);
          setErrorField('email');
          setErrorMessage('This email address is already registered');
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
  };

  // Type-specific validation method from the alternate hook
  const validateContactByType = useCallback(async (
    type: 'phone' | 'email', 
    value: string
  ): Promise<boolean> => {
    if (!value) return false;

    let cleanPhone = value;
    if (type === 'phone') {
      cleanPhone = cleanPhoneNumber(value);
      if (cleanPhone.length !== 10) return false;
    }

    if (type === 'email') {
      if (!isValidEmail(value)) return false;
    }

    // Prevent multiple simultaneous validation requests
    if (isValidating) {
      console.log(`Skipping validation for ${type} - Another validation is in progress`);
      return false;
    }

    setIsValidating(true);
    setValidatedContactType(type);
    setValidatedContact(value);

    try {
      console.log(`Validating ${type}:`, type === 'phone' ? cleanPhone : value);
      
      // Call the main validation method
      const result = await validateContact(value);
      return result === 'registered';
    } catch (error) {
      console.error(`Error validating ${type}:`, error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [isValidating]);

  // Generate handlers for phone input
  const getPhoneProps = useCallback((currentValue: string) => {
    return {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        // Format based on the selected format style
        const formatted = usePhoneFormat === 'parentheses' 
          ? formatPhoneNumber(e.target.value) 
          : formatPhoneNumberDashed(e.target.value);

        // Clear error state when user edits
        if (phoneExists) {
          setPhoneExists(false);
          if (showErrorDialog && errorField === 'phone') {
            setShowErrorDialog(false);
          }
        }

        // Real-time validation
        if (validateOnChange) {
          const cleanPhone = cleanPhoneNumber(formatted);
          if (cleanPhone.length === 10) {
            // Use the combined validation function
            validateContact(formatted);
          } else {
            // Reset validation states when phone is invalid
            if (validationResult === 'registered' || validationResult === 'not_registered') {
              setValidationResult(null);
            }
            setPhoneExists(false);
          }
        }

        return formatted;
      },
      onBlur: validateOnBlur 
        ? (e: React.FocusEvent<HTMLInputElement>) => {
            const cleanPhone = cleanPhoneNumber(currentValue);
            if (cleanPhone.length === 10) {
              validateContact(currentValue);
            }
          }
        : undefined,
      className: phoneExists ? 'border-red-500 focus:ring-red-500' : undefined
    };
  }, [phoneExists, showErrorDialog, errorField, validateOnChange, validateOnBlur, validationResult, usePhoneFormat]);

  // Generate handlers for email input
  const getEmailProps = useCallback((currentValue: string) => {
    return {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        // Clear error state when user edits
        if (emailExists) {
          setEmailExists(false);
          if (showErrorDialog && errorField === 'email') {
            setShowErrorDialog(false);
          }
        }

        // Real-time email validation
        if (validateOnChange && e.target.value) {
          if (isValidEmail(e.target.value)) {
            validateContact(e.target.value);
          } else {
            // Reset validation states when email is invalid
            if (validationResult === 'registered' || validationResult === 'not_registered') {
              setValidationResult(null);
            }
            setEmailExists(false);
          }
        }

        return e.target.value;
      },
      onBlur: validateOnBlur 
        ? (e: React.FocusEvent<HTMLInputElement>) => {
            if (currentValue && isValidEmail(currentValue)) {
              validateContact(currentValue);
            }
          }
        : undefined,
      className: emailExists ? 'border-red-500 focus:ring-red-500' : undefined
    };
  }, [emailExists, showErrorDialog, errorField, validateOnChange, validateOnBlur, validationResult]);

  // Reset all validation states
  const resetValidation = () => {
    setValidationResult(null);
    setValidatedContactType('unknown');
    setPhoneExists(false);
    setEmailExists(false);
    setErrorField('');
    setErrorMessage('');
    setShowErrorDialog(false);
    setValidatedContact('');
  };
  
  // Function to close the error dialog and reset relevant error states
  const handleDialogClose = useCallback(() => {
    setShowErrorDialog(false);
  }, []);

  return {
    // Core validation states
    validationResult,
    isValidating,
    validatedContactType,
    
    // Additional validation states
    phoneExists,
    emailExists,
    errorField,
    errorMessage,
    showErrorDialog,
    setShowErrorDialog,
    
    // Combined validation methods
    validateContact,
    validateContactByType,
    
    // Helper utilities 
    resetValidation,
    handleDialogClose,
    
    // Input props generators
    getPhoneProps,
    getEmailProps
  };
}