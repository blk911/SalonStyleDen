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
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useToast } from "@/hooks/use-toast";
import { cleanPhoneNumber, formatPhoneNumber } from "@/lib/utils";

interface UnregisteredUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onSuccess?: (clientId: number) => void;
}

export function UnregisteredUserModal({ 
  open, 
  onOpenChange, 
  initialPhone = "",
  onSuccess 
}: UnregisteredUserModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const clientData = {
        name: name.trim(),
        phone: cleanPhoneNumber(phone),
        email: "",
        sponsorSalonId: 1,
        salonId: 1,
        sponsor: "VMB LTD",
        isCurrentClient: false,
        acceptedTerms: true,
        type: "client" as const
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Registration Complete!",
          description: "Welcome to Ven Me, Baby! We'll notify you when invites arrive.",
          variant: "default",
        });

        onOpenChange(false);
        
        if (onSuccess && result.id) {
          onSuccess(result.id);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Registration Failed",
          description: errorData.message || "Failed to register. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-pink-700">
            Oops, we didn't find you in our system
          </DialogTitle>
          <DialogDescription className="text-center">
            It happens. Enter your name and cell number and register. When your invites arrive we'll message you ASAP!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            
            <div>
              <PhoneInputField
                placeholder="Enter your phone number"
                value={phone}
                onChange={setPhone}
                required
              />
            </div>
            
            <DialogFooter className="flex justify-between gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading || !name.trim() || !phone.trim()}
                className="flex-1 bg-[#FF92A5] hover:bg-[#ff7a92]"
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
