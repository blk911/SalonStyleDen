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

  const handlePhoneValidation = async (isValid: boolean, phone?: string) => {
    if (!isValid || !phone) return;

    setLoading(true);
    try {
      const cleanPhone = cleanPhoneNumber(phone);
      const response = await fetch(`/api/clients?phone=${encodeURIComponent(cleanPhone)}`);
      
      if (response.ok) {
        const clients = await response.json();
        
        if (clients.length > 0) {
          const client = clients[0];
          
          toast({
            title: "Welcome Back!",
            description: `Welcome back, ${client.name || 'valued client'}!`,
          });
          
          onOpenChange(false);
          setLocation(`/client/${client.id}`);
        } else {
          toast({
            title: "New User",
            description: "Redirecting you to registration...",
          });
          
          onOpenChange(false);
          setLocation(`/client-registration?phone=${encodeURIComponent(cleanPhone)}`);
        }
      } else {
        throw new Error('Failed to lookup client');
      }
    } catch (error) {
      console.error('Phone lookup error:', error);
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
