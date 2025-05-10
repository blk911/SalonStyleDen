import { useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ValidationResult } from "@/hooks/use-contact-validation";

// Simple logging helper (replaced test flow logger)
const logFlowStep = (step: string, data?: any) => {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`[ContactValidation] ${step}`, data ? data : '');
  }
};

interface ContactValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: ValidationResult;
  contactType: 'phone' | 'email' | 'unknown';
  contactValue: string;
  onClose?: () => void;
}

/**
 * A streamlined dialog for phone/email validation
 * Now auto-closes and redirects focus to terms checkbox when validation completes
 */
export function ContactValidationDialog({
  open,
  onOpenChange,
  validationResult,
  contactType,
  contactValue,
  onClose
}: ContactValidationDialogProps) {
  // Use useEffect to handle side effects properly
  useEffect(() => {
    // Auto-close for non-loading states
    if (open && validationResult !== 'loading') {
      // Close dialog
      onOpenChange(false);
      
      // Set data attribute to prevent address dialog from showing again
      document.body.setAttribute('data-address-shown', 'true');
      
      // Focus on terms checkbox
      setTimeout(() => {
        const termsCheckbox = document.querySelector('input[name="acceptTerms"]');
        if (termsCheckbox instanceof HTMLElement) {
          termsCheckbox.focus();
          // Scroll to the terms area to make it visible
          termsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('[FLOW] Direct navigation to terms checkbox after validation');
        }
      }, 50);
    }
  }, [open, validationResult, onOpenChange]);
  
  // Only render the dialog when it's supposed to be open
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Only show loading state, all other states will auto-close */}
        <DialogHeader>
          <DialogTitle>Validating Contact Info</DialogTitle>
          <DialogDescription>
            Please wait while we verify your information...
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}