import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cleanPhoneNumber } from "@/lib/utils";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePhoneValidation = async (isValid: boolean, phone?: string, validationResult?: any) => {
    if (!isValid || !phone) return;

    if (validationResult === 'registered') {
      return;
    }

    if (validationResult === 'not_registered' || validationResult === 'has_unredeemed_gift') {
      const cleanPhone = cleanPhoneNumber(phone);
      
      toast({
        title: "New User",
        description: "Redirecting you to registration...",
      });
      
      onOpenChange(false);
      setLocation(`/client-registration?phone=${encodeURIComponent(cleanPhone)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      handlePhoneValidation(true, phoneNumber);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">NEW or EXISTING User</DialogTitle>
          <DialogDescription className="text-center">
            Enter your phone number - we'll route you to the right place
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <PhoneInputField
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              onValidationComplete={handlePhoneValidation}
              autoFocus
            />
            
            <div className="flex justify-between gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading || !phoneNumber}
                className="flex-1"
              >
                {loading ? "Processing..." : "Continue"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
