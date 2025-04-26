import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, AlertTriangle, Loader2 } from "lucide-react";
import { ValidationResult } from "@/hooks/use-contact-validation";

interface ContactValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: ValidationResult;
  contactType: 'phone' | 'email' | 'unknown';
  contactValue: string;
}

/**
 * A standardized dialog for showing contact validation results
 * Used to display whether a phone/email is already registered in the system
 */
export function ContactValidationDialog({
  open,
  onOpenChange,
  validationResult,
  contactType,
  contactValue
}: ContactValidationDialogProps) {
  // Function to focus on address field
  const focusAddressField = () => {
    const addressField = document.querySelector('input[name="address"]');
    if (addressField instanceof HTMLElement) {
      addressField.focus();
    }
  };
  
  // Function to focus on terms checkbox
  const focusTermsCheckbox = () => {
    const checkboxElement = document.querySelector('input[name="acceptTerms"]');
    if (checkboxElement instanceof HTMLElement) {
      checkboxElement.focus();
    }
  };
  
  // Handle dialog close based on validation result
  const handleDialogClose = () => {
    if (validationResult === 'registered') {
      // Clear the form field (assuming a parent reset function)
      // For phone, we'll just close the dialog and let the parent handle it
      
      // The design pattern is to provide feedback and let the user know the data exists
      onOpenChange(false);
    } else if (validationResult === 'not_registered' || validationResult === 'invalid') {
      // If not registered or invalid, just close and move to address field
      onOpenChange(false);
      focusAddressField();
    } else {
      // Default behavior - just close
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleDialogClose();
      } else {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {validationResult === 'registered' ? (
            <DialogTitle>Phone Already Registered</DialogTitle>
          ) : (
            <DialogTitle>Contact Validation Result</DialogTitle>
          )}
          
          <DialogDescription>
            {validationResult === 'loading' ? 
              "Checking registration status..." : 
              validationResult === 'registered' ?
                "This phone number is already registered in our system." :
                `The ${contactType} information has been validated.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {validationResult === 'loading' ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : validationResult === 'registered' ? (
            <div className="text-center p-4 bg-red-100 border border-red-300 rounded-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-700 mb-1">Already Registered</h3>
              <p className="text-red-600">
                This {contactType === 'phone' ? 'phone number' : 'email address'} is already registered in our system.
              </p>
              <p className="font-bold mt-2 text-red-800">PHONE ALREADY REGISTERED</p>
            </div>
          ) : validationResult === 'not_registered' ? (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-green-700 mb-1">Valid</h3>
              <p className="text-green-600">
                {contactType === 'phone' ? 'Phone number' : 'Email address'} is valid and available for registration.
              </p>
            </div>
          ) : validationResult === 'invalid' ? (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-700 mb-1">Invalid Format</h3>
              <p className="text-red-600">
                The {contactType} format is invalid: {contactValue}
              </p>
              <p className="mt-2 text-sm text-red-700">
                Please check the format and try again.
              </p>
            </div>
          ) : null}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleDialogClose}
            variant={validationResult === 'registered' ? "destructive" : "default"}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}