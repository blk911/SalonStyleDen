import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

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
  
  const handleGoBack = () => {
    onClose();
  };
  
  const handleEnterPromoCode = () => {
    onClose();
    setLocation('/clients');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-pink-700">
            {errorField === 'phone' 
              ? 'Phone Number Already Exists' 
              : errorField === 'email' 
                ? 'Email Already Exists' 
                : 'Contact Already Exists'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-pink-500 mx-auto" />
          <p className="text-lg">{errorMessage}</p>
          
          {errorField === 'phone' ? (
            <>
              <p className="text-gray-500 mb-2">This number is unavailable.</p>
              <div className="space-y-3">
                <p className="text-gray-700 font-medium">Are you an existing client?</p>
                <p className="text-gray-600">You may have received a Ven Me, Baby! Invitation.</p>
                <p className="text-gray-600">Check your messages. If you have a promo code:</p>
                
                <div className="flex space-x-3 justify-center mt-4">
                  <Button 
                    onClick={handleGoBack} 
                    variant="outline"
                    className="border-pink-300"
                  >
                    Go Back
                  </Button>
                  <Button 
                    onClick={handleEnterPromoCode} 
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    Enter Promo Code
                  </Button>
                </div>
              </div>
            </>
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
  );
}