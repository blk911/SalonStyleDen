import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { formatPhoneNumber, cleanPhoneNumber, isValidPhone } from '@/lib/utils';
import { useContactValidation } from '@/hooks/use-contact-validation';
import { ContactValidationDialog } from '@/components/ui/ContactValidationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface PhoneInputFieldProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValidationComplete?: (isValid: boolean, isRegistered: boolean) => void;
  onEnterPress?: () => void;
  clearField?: () => void;
}

export function PhoneInputField({
  value,
  onChange,
  onValidationComplete,
  onEnterPress,
  clearField,
  ...props
}: PhoneInputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showRegisteredDialog, setShowRegisteredDialog] = useState(false);
  
  const {
    validationResult,
    validateContact,
    isValidating,
    validatedContactType,
    resetValidation
  } = useContactValidation();

  // Format the phone number as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    onChange(formattedValue);
  };

  // Handle validation when focus is lost
  const handleBlur = async () => {
    setFocused(false);
    setTouched(true);

    // Only validate if we have a value and 10 digits
    const digits = cleanPhoneNumber(value);
    if (digits.length === 10) {
      await validatePhoneNumber();
    }
  };

  // Validate the phone number against the database
  const validatePhoneNumber = async () => {
    if (!value || !isValidPhone(value)) {
      if (onValidationComplete) {
        onValidationComplete(false, false);
      }
      return;
    }

    try {
      const result = await validateContact(value);
      
      if (result === 'registered') {
        // Phone is already registered - show registered dialog
        setShowRegisteredDialog(true);
      } else if (result === 'not_registered') {
        // Valid phone number - show validation dialog
        setShowValidationDialog(true);
      }
      
      if (onValidationComplete) {
        onValidationComplete(
          result !== 'invalid', 
          result === 'registered'
        );
      }
    } catch (error) {
      console.error('Error validating phone:', error);
    }
  };

  // Handle key presses in the input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Check if the phone is valid
      const isValid = isValidPhone(value);
      
      if (!isValid) {
        setTouched(true);
        return;
      }
      
      // Start validation process
      validatePhoneNumber();
    }
  };

  // Handle the registered dialog close
  const handleRegisteredDialogClose = () => {
    setShowRegisteredDialog(false);
    
    // Clear the field if requested
    if (clearField) {
      clearField();
      
      // After clearing, set focus back to the phone field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Move cursor to address field function
  const moveToAddressField = () => {
    // Use direct DOM manipulation to force the cursor placement
    // First try by ID (more precise)
    setTimeout(() => {
      const addressField = document.getElementById('address-field');
      if (addressField instanceof HTMLElement) {
        addressField.focus();
      } else {
        // Try by name as a fallback
        const addressFieldByName = document.querySelector('input[name="address"]');
        if (addressFieldByName instanceof HTMLElement) {
          addressFieldByName.focus();
        }
      }
    }, 10);
  };
  
  // Handle the validation dialog close
  const handleValidationDialogClose = () => {
    // Use a timeout to ensure dialog is closed before moving focus
    setShowValidationDialog(false);
    moveToAddressField();
  };

  // Set focus to the input on mount if autofocus is true
  useEffect(() => {
    if (props.autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [props.autoFocus]);

  // Setup auto-validation when the component mounts
  useEffect(() => {
    // Clear validation when component unmounts
    return () => {
      resetValidation();
    };
  }, [resetValidation]);

  return (
    <>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${touched && !isValidPhone(value) && !focused ? 'border-red-500' : ''}`}
        {...props}
      />
      
      {touched && !isValidPhone(value) && !focused && (
        <p className="text-red-500 text-sm mt-1">
          Please enter a valid 10-digit phone number
        </p>
      )}
      
      {/* Phone Already Registered Dialog */}
      <Dialog open={showRegisteredDialog} onOpenChange={setShowRegisteredDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phone Already Registered</DialogTitle>
            <DialogDescription>
              This phone number is already registered in our system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-amber-700 mb-1">Phone Number In Use</h3>
              <p className="text-amber-600 mb-2">
                {value} is already registered.
              </p>
              <p className="font-bold mt-2 text-amber-800">IN DB</p>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setShowRegisteredDialog(false);
                
                // Move focus to accept terms checkbox using ID
                setTimeout(() => {
                  const termsCheckbox = document.getElementById('terms-checkbox');
                  if (termsCheckbox instanceof HTMLElement) {
                    termsCheckbox.focus();
                    termsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    console.log('Setting focus to terms checkbox from Phone dialog');
                  }
                }, 50);
              }}
            >
              Later
            </Button>
            
            <Button 
              type="button" 
              onClick={handleRegisteredDialogClose}
            >
              Enter New Phone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Valid Phone Dialog */}
      <ContactValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        validationResult={validationResult}
        contactType="phone"
        contactValue={value}
        onClose={handleValidationDialogClose}
      />
    </>
  );
}