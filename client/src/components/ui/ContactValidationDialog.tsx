import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { PromoCodeDialog } from "./PromoCodeDialog";
import BrandName from "@/components/ui/BrandName";

interface ContactValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorField: 'phone' | 'email' | '';
  errorMessage: string;
  onClose: () => void;
}

export function ContactValidationDialog({
  open,
  onOpenChange,
  errorField,
  errorMessage,
  onClose
}: ContactValidationDialogProps) {
  const [, setLocation] = useLocation();
  const [showPromoCodeDialog, setShowPromoCodeDialog] = useState(false);
  // Store the phone number from the error message for use in promo validation
  const [validationPhone, setValidationPhone] = useState("");
  
  // Extract the phone number from the error message when it changes
  useEffect(() => {
    if (errorField === 'phone') {
      // Extract phone number from the error message if present
      
      // Try to extract the phone from the error message (assuming format: "This phone: (555) 123-4567 is already registered")
      const phoneMatch = errorMessage.match(/phone:\s*([^,\s]+)/i);
      if (phoneMatch && phoneMatch[1]) {
        const extractedPhone = phoneMatch[1].replace(/\D/g, '');
        setValidationPhone(extractedPhone);
      } else {
        // No fallback needed - if we can't extract phone, leave it empty
        setValidationPhone("");
      }
    }
  }, [errorField, errorMessage]);
  
  const handleGoBack = () => {
    onClose();
  };
  
  const handleEnterPromoCode = () => {
    // Instead of redirecting directly, show the promo code dialog
    setShowPromoCodeDialog(true);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-md"
          aria-describedby="contact-validation-description"
        >
          <DialogHeader>
            <DialogTitle>
              {errorField === 'phone' 
                ? "Phone Number Already Registered" 
                : errorField === 'email'
                  ? "Email Already Registered"
                  : "Contact Validation"
              }
            </DialogTitle>
            <DialogDescription id="contact-validation-description">
              {errorField === 'phone'
                ? "This phone number is already associated with an account"
                : errorField === 'email'
                  ? "This email address is already associated with an account"
                  : "Please verify your contact information"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 text-center space-y-4">
            {errorField === 'phone' ? (
              <div className="space-y-5">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-700 mb-5">{errorMessage}</h4>
                  
                  <p className="text-gray-600 mb-6">
                    You may have received a <BrandName size="sm" inline /> Invitation.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button 
                      onClick={handleGoBack} 
                      variant="outline"
                      className="border-pink-300 w-full sm:w-auto px-6"
                    >
                      Go Back
                    </Button>
                    
                    <Button 
                      onClick={handleEnterPromoCode}
                      className="bg-pink-500 hover:bg-pink-600 w-full sm:w-auto px-6"
                    >
                      Yes
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // Close the dialog and open PromoCodeDialog in phone validation mode
                        onClose();
                        
                        // Extract the phone number cleanly
                        let cleanPhone = "";
                        if (validationPhone) {
                          cleanPhone = validationPhone.replace(/\D/g, '');
                        }
                        
                        // Open the PromoCodeDialog with phone number for "No" path
                        setValidationPhone(cleanPhone);
                        setShowPromoCodeDialog(true);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 w-full sm:w-auto px-6"
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                {errorField === 'email'
                  ? 'Please use a different email address or check if this client has already been registered.'
                  : 'This contact information is already in our system. Please check existing clients.'}
              </p>
            )}
          </div>
          
          {errorField !== 'phone' && (
            <DialogFooter className="flex justify-center">
              <Button 
                onClick={onClose} 
                className="bg-pink-500 hover:bg-pink-600 px-6"
              >
                OK
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Promo Code Dialog (shows when Enter Promo Code is clicked) */}
      <PromoCodeDialog 
        open={showPromoCodeDialog} 
        onOpenChange={(open) => {
          setShowPromoCodeDialog(open);
          // Close the parent dialog if promo dialog is closed
          if (!open) {
            onOpenChange(false);
          }
        }}
        phone={validationPhone} // Pass the phone number to the promo code dialog
        phoneValidation={true} // Flag to indicate this is coming from a phone validation path
      />
    </>
  );
}