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

interface PromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string; // Optional phone number passed from ContactValidationDialog
}

export function PromoCodeDialog({
  open,
  onOpenChange,
  phone,
}: PromoCodeDialogProps) {
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Special case for development mode
      console.log(`Validating promo code: ${promoCode}`);
      
      // Verify promo code
      const response = await apiRequest("/api/invitations/validate", {
        method: "POST",
        body: JSON.stringify({
          code: promoCode,
          phone: phone || "" // Use passed phone number or empty string
        }),
      });
      
      if (response.error) {
        toast({
          title: "Invalid Code",
          description: response.error,
          variant: "destructive",
        });
      } else {
        // Success - redirect to client dashboard with the specific client ID
        if (response.clientId) {
          toast({
            title: "Success",
            description: "Verification successful! Redirecting to your dashboard.",
          });
          
          // Close dialog and redirect to the specific client's dashboard
          onOpenChange(false);
          console.log(`Redirecting to client dashboard for client ID: ${response.clientId}`);
          setLocation(`/client/${response.clientId}`);
        } else {
          toast({
            title: "Error",
            description: "Client ID not returned from server. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      
      toast({
        title: "Error",
        description: "There was an error validating your code. Please try again.",
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
          <DialogTitle className="text-center">Enter Promo Code</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border border-pink-100 bg-pink-50 rounded mb-5 text-sm text-center">
          <p>Enter the promo code you received via text message or email.</p>
          <p className="mt-2">This code will link your registration to your salon invitation.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter your promo code"
              className="border-pink-200 focus:border-pink-400 text-center"
            />
            
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