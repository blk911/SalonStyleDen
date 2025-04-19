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
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);

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
    let cleanPhone = value;
    if (type === 'phone') {
      // Always clean the phone number for consistent server validation
      cleanPhone = value.replace(/\D/g, '');
      console.log(`validateContact - Original phone: ${value}, Cleaned: ${cleanPhone}`);
      if (cleanPhone.length !== 10) return false;
    }

    if (type === 'email') {
      if (!value.includes('@') || !value.includes('.')) return false;
    }

    // Prevent multiple simultaneous validation requests
    if (isValidating) {
      console.log(`Skipping validation for ${type} - Another validation is in progress`);
      return false;
    }

    setIsValidating(true);

    try {
      console.log(`Validating ${type}:`, type === 'phone' ? cleanPhone : value);

      // Use validation-only server request with a dedicated endpoint for contact validation
      const response = await fetch('/api/validate-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: type === 'phone' ? cleanPhone : '',
          email: type === 'email' ? value.toLowerCase() : '',
          type: 'client'
        })
      });

      // Fallback to previous method if the dedicated endpoint isn't available
      if (response.status === 404) {
        console.log('Validation endpoint not found, using fallback method');
        const fallbackResponse = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: type === 'phone' ? cleanPhone : '',
            email: type === 'email' ? value.toLowerCase() : '',
            name: 'test',
            _validateOnly: true
          })
        });
        
        const data = await fallbackResponse.json();
        
        // Check for either a server error or duplicate in response
        if (!fallbackResponse.ok || data.error) {
          console.log(`Server detected duplicate ${type}:`, value, data);

          if (type === 'phone' || (data.error && data.error.includes('phone'))) {
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
        
        // If we got here, validation passed
        if (type === 'phone') {
          setPhoneExists(false);
        } else {
          setEmailExists(false);
        }

        setIsValidating(false);
        return false; // Doesn't exist
      }

      const data = await response.json();
      
      // Check for duplicates in response
      if (data.exists) {
        console.log(`Server detected duplicate ${type}:`, value, data);

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
  }, [isValidating]);

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

        // Real-time validation
        if (validateOnChange) {
          const cleanPhone = formatted.replace(/\D/g, '');
          console.log(`Phone validation - Clean phone: ${cleanPhone}, Length: ${cleanPhone.length}`);
          if (cleanPhone.length === 10) {
            console.log(`Phone validation - Validating phone: ${formatted}`);
            // Use a clean version of the phone for validation
            validateContact('phone', cleanPhone);
          } else {
            setPhoneExists(false);
            if (showErrorDialog && errorField === 'phone') {
              setShowErrorDialog(false);
            }
          }
        }

        return formatted;
      },
      onBlur: validateOnBlur 
        ? (e: React.FocusEvent<HTMLInputElement>) => {
            const cleanPhone = currentValue.replace(/\D/g, '');
            console.log(`Phone blur validation - Clean phone: ${cleanPhone}, Length: ${cleanPhone.length}`);
            if (cleanPhone.length === 10) {
              console.log(`Phone blur validation - Validating phone: ${cleanPhone}`);
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

        // Real-time email validation
        if (validateOnChange && e.target.value) {
          if (e.target.value.includes('@') && e.target.value.includes('.')) {
            validateContact('email', e.target.value);
          } else {
            setEmailExists(false);
            if (showErrorDialog && errorField === 'email') {
              setShowErrorDialog(false);
            }
          }
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
    showRegistrationForm,
    setShowRegistrationForm,
    duplicateData,
    setDuplicateData,
    formatPhoneNumber,
    validateContact,
    getPhoneProps,
    getEmailProps,
    handleDialogClose
  };
}