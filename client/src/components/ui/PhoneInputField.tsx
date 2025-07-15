import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { formatPhoneNumber, cleanPhoneNumber, isValidPhone } from '@/lib/utils';
import { useContactValidation, ValidationResult } from '@/hooks/use-contact-validation';
import { ContactValidationDialog } from '@/components/ui/ContactValidationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Simple logging helper (replaced test flow logger)
const logFlowStep = (step: string, data?: any) => {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`[PhoneInput] ${step}`, data ? data : '');
  }
};

interface PhoneInputFieldProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValidationComplete?: (isValid: boolean, phoneNumber?: string, validationResult?: ValidationResult) => void;
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
  
  const [confirmationPhone, setConfirmationPhone] = useState("");
  const {
    validationResult,
    validateContact,
    isValidating,
    validatedContactType,
    resetValidation,
    clientData
  } = useContactValidation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Format the phone number as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    onChange(formattedValue);
    logFlowStep('Phone number typed', formattedValue);
  };

  // Handle validation when focus is lost
  const handleBlur = async () => {
    setFocused(false);
    setTouched(true);

    // Reset dialog state to ensure consistent behavior between form attempts
    document.body.removeAttribute('data-address-shown');
    logFlowStep('Phone field lost focus - resetting dialog state');
    
    // Only validate if we have a value and 10 digits
    const digits = cleanPhoneNumber(value);
    if (digits.length === 10) {
      logFlowStep('Valid 10-digit phone detected, validating', value);
      await validatePhoneNumber();
    } else {
      logFlowStep('Invalid/incomplete phone skipping validation', value);
    }
  };

  // Validate the phone number against the database
  const validatePhoneNumber = async () => {
    if (!value || !isValidPhone(value)) {
      logFlowStep('Phone validation failed - invalid format', value);
      if (onValidationComplete) {
        onValidationComplete(false, undefined);
      }
      return;
    }

    try {
      logFlowStep('Validating phone number against database', value);
      const result = await validateContact(value);
      logFlowStep('Validation result', result);
      
      if (result === 'registered') {
        // Phone is already registered - show registered dialog
        logFlowStep('Phone already registered - showing registered dialog', value);
        setShowRegisteredDialog(true);
      } else if (result === 'not_registered' || result === 'has_unredeemed_gift') {
        // For valid phone numbers and phones with gifts, skip showing any dialog
        // Set the data attribute to prevent dialogs from showing again
        document.body.setAttribute('data-address-shown', 'true');
        logFlowStep('Phone is valid or has unredeemed gift - setting data-address-shown attribute');
        
        // Move directly to terms checkbox
        logFlowStep('Moving directly to terms checkbox');
        moveToTermsCheckbox();
      }
      
      // Pass phone validation status, phone number, and result to the callback
      if (onValidationComplete) {
        onValidationComplete(result !== 'invalid', value, result);
      }
    } catch (error) {
      console.error('Error validating phone:', error);
      logFlowStep('Error validating phone', error);
    }
  };

  // Handle key presses in the input field - SIMPLIFIED VERSION
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      logFlowStep('ENTER key pressed on phone field - IMMEDIATE FOCUS ON TERMS');
      
      // SIMPLE VERSION: Always focus on terms checkbox when Enter pressed, no validation
      // Set data attribute to prevent the address dialog
      document.body.setAttribute('data-address-shown', 'true');
      
      // Directly focus terms checkbox without validation
      moveToTermsCheckbox();
      
      // Also run validation in the background so it's complete by the time they submit
      if (isValidPhone(value)) {
        validateContact(value).then(result => {
          logFlowStep('Background validation complete', result);
          if (onValidationComplete) {
            onValidationComplete(result !== 'invalid', value, result);
          }
        }).catch(error => {
          console.error('Background validation error:', error);
        });
      }
    }
  };

  // Handle the registered dialog close
  const handleRegisteredDialogClose = () => {
    setShowRegisteredDialog(false);
    setConfirmationPhone("");
    resetValidation();
    
    // Clear the field if requested
    if (clearField) {
      clearField();
      
      // After clearing, set focus back to the phone field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleConfirmation = async () => {
    if (!clientData || !confirmationPhone) return;
    
    const cleanOriginal = cleanPhoneNumber(value);
    const cleanConfirmation = cleanPhoneNumber(confirmationPhone);
    
    if (cleanOriginal === cleanConfirmation) {
      setShowRegisteredDialog(false);
      
      try {
        const response = await fetch('/api/salons');
        const salons = await response.json();
        const matchingSalon = salons.find((salon: any) => 
          salon.phone && salon.phone.replace(/\D/g, '') === cleanOriginal
        );
        
        if (matchingSalon) {
          setLocation(`/dashboard/salon/${clientData.id}`);
        } else {
          setLocation(`/client/${clientData.id}`);
        }
      } catch (error) {
        console.error('Error checking salon status:', error);
        // Fallback to client dashboard if API call fails
        setLocation(`/client/${clientData.id}`);
      }
    } else {
      toast({
        title: "Phone Number Mismatch",
        description: "The confirmation phone number doesn't match. Please try again.",
        variant: "destructive",
      });
      setConfirmationPhone("");
    }
  };

  // Move cursor directly to terms checkbox function
  const moveToTermsCheckbox = () => {
    logFlowStep('Starting focus transition to terms checkbox');
    
    // Immediately focus terms checkbox without delay
    const termsCheckbox = document.getElementById('acceptTerms');
    if (termsCheckbox instanceof HTMLElement) {
      logFlowStep('Terms checkbox found by ID, focusing immediately');
      termsCheckbox.focus();
      termsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      logFlowStep('Terms checkbox focused and scrolled into view');
    } else {
      // Fallback to the old selector approach but reduce timeout
      logFlowStep('Falling back to query selector approach');
      setTimeout(() => {
        const termsCheckboxByQuery = document.querySelector('input[name="acceptTerms"]');
        if (termsCheckboxByQuery instanceof HTMLElement) {
          logFlowStep('Terms checkbox found by query, focusing');
          termsCheckboxByQuery.focus();
          termsCheckboxByQuery.scrollIntoView({ behavior: 'smooth', block: 'center' });
          logFlowStep('Terms checkbox focused and scrolled into view');
        } else {
          logFlowStep('ERROR: Terms checkbox not found by either method');
        }
      }, 10); // Minimal timeout
    }
  };
  
  // Handle the validation dialog close - now goes directly to terms checkbox
  const handleValidationDialogClose = () => {
    // Use a timeout to ensure dialog is closed before moving focus
    setShowValidationDialog(false);
    
    // Set the data attribute to prevent the dialog from showing again
    document.body.setAttribute('data-address-shown', 'true');
    
    // Move focus directly to terms checkbox
    moveToTermsCheckbox();
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
  }, []); // Empty dependency array to prevent unnecessary re-renders

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
            <DialogTitle>
              {validationResult === 'registered' && validatedContactType === 'phone' && clientData?.name
                ? `HI, Welcome Back ${clientData.name}`
                : "Phone Already Registered"
              }
            </DialogTitle>
            <DialogDescription>
              {validationResult === 'registered' && validatedContactType === 'phone' && clientData?.name
                ? "Confirm your number to access your dashboard"
                : "This phone number is already registered in our system."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {validationResult === 'registered' && validatedContactType === 'phone' && clientData ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-lg font-semibold text-green-700 mb-2">Welcome Back!</h3>
                  <p className="text-green-600 mb-2">
                    Please confirm your phone number to continue
                  </p>
                </div>
                <Input
                  type="tel"
                  placeholder="Confirm your phone number"
                  value={confirmationPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setConfirmationPhone(formatted);
                  }}
                  autoFocus
                  className="text-center"
                />
              </div>
            ) : (
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-amber-700 mb-1">Phone Number In Use</h3>
                <p className="text-amber-600 mb-2">
                  {value} is already registered.
                </p>
                <p className="font-bold mt-2 text-amber-800">IN DB</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setShowRegisteredDialog(false);
                document.dispatchEvent(new CustomEvent('vmb-form-reset'));
                if (onChange) {
                  onChange('');
                }
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }, 10);
              }}
            >
              Back
            </Button>
            
            {validationResult === 'registered' && validatedContactType === 'phone' && clientData ? (
              <Button 
                type="button" 
                onClick={handleConfirmation}
                disabled={!confirmationPhone}
              >
                Confirm and Continue
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleRegisteredDialogClose}
              >
                Try Again
              </Button>
            )}
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
