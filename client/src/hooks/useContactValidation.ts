/**
 * Hook for validating contact information (phone, email) against existing records
 * This provides real-time validation by checking with the server
 */
import { useState, useCallback } from 'react';

interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  delay?: number;
}

export function useContactValidation(options: ValidationOptions = {}) {
  const { 
    validateOnChange = true, 
    validateOnBlur = true,
    delay = 500 
  } = options;
  
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorField, setErrorField] = useState<'phone' | 'email' | ''>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Format phone number consistently site-wide (XXX-XXX-XXXX)
  const formatPhoneNumber = (input: string) => {
    if (!input) return '';
    const numbers = input.replace(/\D/g, '').slice(0, 10);
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  // Validate phone or email against server
  const validateContact = useCallback(async (
    type: 'phone' | 'email', 
    value: string
  ): Promise<boolean> => {
    if (!value) return false;
    
    // Simple format validation before server check
    if (type === 'phone') {
      const cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone.length !== 10) return false;
    }
    
    if (type === 'email') {
      if (!value.includes('@') || !value.includes('.')) return false;
    }
    
    setIsValidating(true);
    
    try {
      console.log(`Validating ${type}:`, value);
      
      // Use validation-only server request
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: type === 'phone' ? value.replace(/\D/g, '') : '',
          email: type === 'email' ? value.toLowerCase() : '',
          name: 'test',
          _validateOnly: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes(type)) {
          console.log(`Server detected duplicate ${type}:`, value);
          
          if (type === 'phone') {
            setPhoneExists(true);
            setErrorField('phone');
            setErrorMessage('This phone number is already registered in our system.');
          } else {
            setEmailExists(true);
            setErrorField('email');
            setErrorMessage('This email address is already registered in our system.');
          }
          
          setShowErrorDialog(true);
          setIsValidating(false);
          return true; // Exists
        }
      }
      
      // If we got here, validation passed
      if (type === 'phone') {
        setPhoneExists(false);
      } else {
        setEmailExists(false);
      }
      
      setIsValidating(false);
      return false; // Doesn't exist
      
    } catch (error) {
      console.error(`Error validating ${type}:`, error);
      setIsValidating(false);
      return false;
    }
  }, []);
  
  // Generate handlers for various input events
  const getPhoneProps = useCallback((currentValue: string) => {
    return {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        
        // Clear error state when user edits
        if (phoneExists) {
          setPhoneExists(false);
          if (showErrorDialog && errorField === 'phone') {
            setShowErrorDialog(false);
          }
        }
        
        // Auto-validation if enabled
        if (validateOnChange) {
          const cleanPhone = formatted.replace(/\D/g, '');
          if (cleanPhone.length === 10) {
            // Delay validation to prevent excessive requests
            setTimeout(() => {
              validateContact('phone', cleanPhone);
            }, delay);
          }
        }
        
        return formatted;
      },
      onBlur: validateOnBlur 
        ? (e: React.FocusEvent<HTMLInputElement>) => {
            const cleanPhone = currentValue.replace(/\D/g, '');
            if (cleanPhone.length === 10) {
              validateContact('phone', cleanPhone);
            }
          }
        : undefined,
      className: phoneExists ? 'border-red-500 focus:ring-red-500' : undefined
    };
  }, [phoneExists, showErrorDialog, errorField, validateOnChange, validateOnBlur, delay, validateContact]);
  
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
        
        // Auto-validation if enabled
        if (validateOnChange && e.target.value && e.target.value.includes('@') && e.target.value.includes('.')) {
          // Delay validation to prevent excessive requests
          setTimeout(() => {
            validateContact('email', e.target.value);
          }, delay);
        }
        
        return e.target.value;
      },
      onBlur: validateOnBlur 
        ? (e: React.FocusEvent<HTMLInputElement>) => {
            if (currentValue && currentValue.includes('@') && currentValue.includes('.')) {
              validateContact('email', currentValue);
            }
          }
        : undefined,
      className: emailExists ? 'border-red-500 focus:ring-red-500' : undefined
    };
  }, [emailExists, showErrorDialog, errorField, validateOnChange, validateOnBlur, delay, validateContact]);
  
  // Function to close the error dialog and reset relevant error states
  const handleDialogClose = useCallback(() => {
    setShowErrorDialog(false);
  }, []);

  return {
    phoneExists,
    emailExists,
    isValidating,
    errorField,
    errorMessage,
    showErrorDialog,
    setShowErrorDialog,
    formatPhoneNumber,
    validateContact,
    getPhoneProps,
    getEmailProps,
    handleDialogClose
  };
}