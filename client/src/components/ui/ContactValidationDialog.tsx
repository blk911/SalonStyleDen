import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { PromoCodeDialog } from "./PromoCodeDialog";

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
        <DialogContent className="sm:max-w-md">
          <div className="p-6 text-center space-y-4">
            
            {errorField === 'phone' ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">This number is unavailable</h3>
                  <Button 
                    onClick={handleGoBack} 
                    variant="outline"
                    className="border-pink-300 w-full sm:w-auto"
                  >
                    Back Button
                  </Button>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Are you an existing client?</h3>
                  <p className="text-gray-600 mb-1">You may have received a Ven Me, Baby! invitation.</p>
                  <p className="text-gray-600 mb-3">Check your messages.</p>
                  
                  <Button 
                    onClick={handleEnterPromoCode} 
                    className="bg-pink-500 hover:bg-pink-600 w-full sm:w-auto px-6"
                  >
                    Enter Promo Code
                  </Button>
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
      />
    </>
  );
}