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
  
  // State to track which validation mode to use for the PromoCodeDialog
  const [usePhoneValidation, setUsePhoneValidation] = useState(false);
  
  // Handler for the "Yes, I have a promo code" button
  const handleEnterPromoCode = () => {
    // Close the current dialog
    onClose();
    // Set phoneValidation to false for the "Yes" path (promo code)
    setUsePhoneValidation(false);
    // Show the promo code dialog with promo code validation mode
    setShowPromoCodeDialog(true);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0"
        >
          <div className="sr-only">
            <DialogTitle>Phone Verification Options</DialogTitle>
            <DialogDescription>Choose how to proceed with your phone verification</DialogDescription>
          </div>
          <div className="p-8">
            {errorField === 'phone' ? (
              <div className="flex flex-col gap-5 w-full">
                <Button 
                  onClick={handleEnterPromoCode}
                  className="bg-pink-500 hover:bg-pink-600 w-full h-14 px-2 py-3"
                >
                  ENTER YOUR PROMO CODE
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
                    // Here we ensure the validationPhone is set before showing the dialog
                    setValidationPhone(cleanPhone);
                    // Set usePhoneValidation to true for the "No" path (phone validation)
                    setUsePhoneValidation(true);
                    setShowPromoCodeDialog(true);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 w-full h-14 px-2 py-3"
                >
                  ENTER YOUR PHONE NUMBER
                </Button>
                
                <Button 
                  onClick={handleGoBack} 
                  variant="outline"
                  className="border-pink-300 w-full h-14 px-2 py-3"
                >
                  BACK
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 w-full">
                <p className="text-gray-800 text-center">
                  {errorField === 'email'
                    ? 'Please use a different email address or check if this client has already been registered.'
                    : 'This contact information is already in our system. Please check existing clients.'}
                </p>
                <Button 
                  onClick={onClose} 
                  className="bg-pink-500 hover:bg-pink-600 w-full h-14 px-2 py-3"
                >
                  OK
                </Button>
              </div>
            )}
          </div>
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
        phoneValidation={usePhoneValidation} // Use the correct mode based on which button was clicked
      />
    </>
  );
}