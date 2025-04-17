import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

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
          <p className="text-gray-500">
            {errorField === 'phone' 
              ? 'Please use a different phone number or check if this client has already been registered.' 
              : errorField === 'email'
                ? 'Please use a different email address or check if this client has already been registered.'
                : 'This contact information is already in our system. Please check existing clients.'}
          </p>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button 
            onClick={onClose} 
            className="bg-pink-500 hover:bg-pink-600 px-6"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}