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
            title: "Login Successful",
            description: `Welcome back, ${client.name || 'valued client'}!`,
          });
          
          onOpenChange(false);
          setLocation(`/client/${client.id}`);
        } else {
          toast({
            title: "No Account Found",
            description: "No account found with this phone number. Please register first.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Failed to lookup client');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "There was an error logging you in. Please try again.",
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
          <DialogTitle className="text-center">Log In</DialogTitle>
          <DialogDescription className="text-center">
            Enter your phone number to access your account
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
                {loading ? "Logging in..." : "Log In"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
