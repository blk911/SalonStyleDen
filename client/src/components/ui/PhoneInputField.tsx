import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber, cleanPhoneNumber, isValidPhone } from '@/lib/utils';
import { useContactValidation } from '@/hooks/use-contact-validation';
import { ContactValidationDialog } from '@/components/ui/ContactValidationDialog';

interface PhoneInputFieldProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValidationComplete?: (isValid: boolean, isRegistered: boolean) => void;
  onEnterPress?: () => void;
  showAddressPopup?: boolean;
  autoValidate?: boolean;
}

export function PhoneInputField({
  value,
  onChange,
  onValidationComplete,
  onEnterPress,
  showAddressPopup = true,
  autoValidate = true,
  ...props
}: PhoneInputFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  
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
    if (digits.length === 10 && autoValidate) {
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
      setShowValidationDialog(true);
      
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
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid 10-digit phone number",
          variant: "destructive"
        });
        return;
      }
      
      // Show address popup if enabled
      if (showAddressPopup && isValid) {
        toast({
          title: "Address Option",
          description: "Moving to address field. This is optional.",
          variant: "default"
        });
      }
      
      // Call the onEnterPress callback
      if (onEnterPress) {
        onEnterPress();
      }
    }
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
      
      <ContactValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        validationResult={validationResult}
        contactType="phone"
        contactValue={value}
      />
    </>
  );
}