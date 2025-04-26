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
  errorField?: 'phone' | 'email' | '';
  errorMessage?: string;
  onClose?: () => void;
}

/**
 * A standardized dialog for showing contact validation results
 * Used to display whether a phone/email is already registered in the system
 */
export function ContactValidationDialog({
  open,
  onOpenChange,
  errorField = '',
  errorMessage = '',
  onClose
}: ContactValidationDialogProps) {
  // The dialog close handler in the button component will handle focus management directly
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Validation Result</DialogTitle>
          <DialogDescription>
            {!errorField ? 
              "Checking registration status..." : 
              `The ${errorField} information has been validated.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {!errorField ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : errorField === 'phone' ? (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-700 mb-1">Phone Number Exists</h3>
              <p className="text-red-600">
                {errorMessage || "This phone number is already registered."}
              </p>
              <p className="mt-2 text-sm text-red-700">
                Please try with a different phone number or check if you have an existing account.
              </p>
            </div>
          ) : errorField === 'email' ? (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-700 mb-1">Email Address Exists</h3>
              <p className="text-red-600">
                {errorMessage || "This email address is already registered."}
              </p>
              <p className="mt-2 text-sm text-red-700">
                Please try with a different email or log in to your existing account.
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
            }}
          >
            Go Back
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
            Try Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}