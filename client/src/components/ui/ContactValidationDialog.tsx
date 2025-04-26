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
// Define validation result types inline instead of importing
type ValidationResult = 'registered' | 'not_registered' | 'invalid' | 'loading' | null;

interface ContactValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: ValidationResult;
  contactType: 'phone' | 'email' | 'unknown';
  contactValue: string;
  onClose?: () => void;
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
  contactValue,
  onClose
}: ContactValidationDialogProps) {
  // The dialog close handler in the button component will handle focus management directly
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Validation Result</DialogTitle>
          <DialogDescription>
            {validationResult === 'loading' ? 
              "Checking registration status..." : 
              `The ${contactType} information has been validated.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {validationResult === 'loading' ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : validationResult === 'registered' ? (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-green-700 mb-1">Registered</h3>
              <p className="text-green-600">
                {contactType === 'phone' ? 'Phone number' : 'Email address'} is registered in the database.
              </p>
              <p className="font-bold mt-2 text-green-800">IN DB</p>
            </div>
          ) : validationResult === 'not_registered' ? (
            <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-amber-700 mb-1">Not Registered</h3>
              <p className="text-amber-600">
                {contactType === 'phone' ? 'Phone number' : 'Email address'} is not registered in the database.
              </p>
              <p className="mt-2 text-sm text-amber-700">
                The client needs to register before proceeding.
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
        
        <DialogFooter className="flex justify-between">
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              // Close dialog first
              onOpenChange(false);
              
              // Move focus to accept terms checkbox
              setTimeout(() => {
                const termsCheckbox = document.querySelector('input[name="acceptTerms"]');
                if (termsCheckbox instanceof HTMLElement) {
                  termsCheckbox.focus();
                }
              }, 10);
            }}
          >
            Later
          </Button>
          
          <Button 
            type="button" 
            onClick={() => {
              // First call onClose if provided (which should move focus to address field)
              if (onClose) {
                onClose();
              }
              
              // Then close the dialog
              onOpenChange(false);
            }}
          >
            Enter Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}