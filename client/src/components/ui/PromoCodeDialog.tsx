import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the type for the client data returned from the invitation validation
export interface ClientData {
  clientId: number;
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: any; // Allow for additional properties
}

export interface PromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string; // Optional phone number passed from ContactValidationDialog
  salonId?: number; // Optional salon ID for direct invitation verification
  onSuccess?: (clientData: ClientData) => void; // Callback when verification is successful
}

export function PromoCodeDialog({
  open,
  onOpenChange,
  phone,
  salonId,
  onSuccess,
}: PromoCodeDialogProps) {
  const [promoCode, setPromoCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(phone || "");
  const [validationMode, setValidationMode] = useState<'promo' | 'phone'>('promo');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs based on validation mode
    if (validationMode === 'promo' && !promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }
    
    if (validationMode === 'phone' && (!phoneNumber.trim() || phoneNumber.length < 4)) {
      toast({
        title: "Error",
        description: "Please enter at least the last 4 digits of your phone number",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Log validation attempt
      if (validationMode === 'promo') {
        console.log(`Validating promo code: ${promoCode}`);
      } else {
        console.log(`Validating with phone: ${phoneNumber}`);
      }
      
      // Verify invitation based on validation mode
      const response = await apiRequest("/api/invitations/validate", {
        method: "POST",
        body: JSON.stringify({
          code: validationMode === 'promo' ? promoCode : '',
          phone: validationMode === 'phone' ? phoneNumber : (phone || ""),
          salonId: salonId || undefined,
          validationMode: validationMode,
        }),
      });
      
      if (response.error) {
        // If promo code fails, offer phone validation as fallback
        if (validationMode === 'promo') {
          toast({
            title: "Invalid Code",
            description: "Would you like to try verifying with your phone number instead?",
            variant: "destructive",
          });
          // Option to switch to phone validation mode
          setValidationMode('phone');
        } else {
          toast({
            title: "Verification Failed",
            description: response.error,
            variant: "destructive",
          });
        }
      } else {
        // Success - client ID is returned with verified invitation
        if (response.clientId) {
          toast({
            title: "Success",
            description: "Verification successful!",
          });
          
          // Close dialog
          onOpenChange(false);
          
          // If onSuccess callback is provided, invoke it with the response data
          if (onSuccess) {
            onSuccess(response);
          } else {
            // Otherwise, fallback to standard redirection
            console.log(`Redirecting to client dashboard for client ID: ${response.clientId}`);
            setLocation(`/client/${response.clientId}/dashboard`);
          }
        } else if (response.redirect === 'register') {
          // Need to create a new account with this invitation
          toast({
            title: "Verification successful",
            description: "Please complete your registration to continue",
          });
          
          // Close dialog
          onOpenChange(false);
          
          // Redirect to registration page with invitation data
          const queryParams = new URLSearchParams({
            inviteCode: validationMode === 'promo' ? promoCode : '',
            phone: validationMode === 'phone' ? phoneNumber : (phone || ""),
            salonId: salonId?.toString() || '',
          }).toString();
          
          setLocation(`/register?${queryParams}`);
        } else {
          toast({
            title: "Error",
            description: "Client ID not returned from server. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error validating invitation:", error);
      
      toast({
        title: "Error",
        description: "There was an error with verification. Please try again.",
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
          <DialogTitle className="text-center">
            {validationMode === 'promo' ? 'Enter Promo Code' : 'Verify with Phone Number'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border border-pink-100 bg-pink-50 rounded mb-5 text-sm text-center">
          {validationMode === 'promo' ? (
            <>
              <p>Enter the promo code you received via text message or email.</p>
              <p className="mt-2">This code will link your registration to your salon invitation.</p>
            </>
          ) : (
            <>
              <p>Enter the last 4 digits of the phone number used for your invitation.</p>
              <p className="mt-2">This will verify your identity and link to your salon invitation.</p>
            </>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {validationMode === 'promo' ? (
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter your promo code"
                className="border-pink-200 focus:border-pink-400 text-center"
              />
            ) : (
              <Input
                value={phoneNumber}
                onChange={(e) => {
                  // Only allow numeric input
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPhoneNumber(value);
                }}
                placeholder="Enter last 4 digits of your phone"
                className="border-pink-200 focus:border-pink-400 text-center"
                maxLength={10} // Allow full phone or just last 4 digits
              />
            )}
            
            {/* Mode switcher */}
            <div className="flex justify-center">
              <Button 
                type="button" 
                variant="link" 
                className="text-xs text-pink-700 p-0 h-auto"
                onClick={() => setValidationMode(validationMode === 'promo' ? 'phone' : 'promo')}
              >
                {validationMode === 'promo' 
                  ? "Don't have a promo code? Verify with your phone number instead." 
                  : "Have a promo code? Use it instead."}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-pink-300 w-full sm:w-auto px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-pink-500 hover:bg-pink-600 w-full sm:w-auto px-6"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}