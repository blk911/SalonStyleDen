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
}

export function PromoCodeDialog({
  open,
  onOpenChange,
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
      // Temporary development function - verify promo code
      // This will validate phone number 5127715877 for development purposes
      const response = await apiRequest("/api/invitations/validate", {
        method: "POST",
        body: JSON.stringify({
          code: promoCode,
          phone: "5127715877" // For testing/development only
        }),
      });
      
      if (response.error) {
        toast({
          title: "Invalid Code",
          description: response.error,
          variant: "destructive",
        });
      } else {
        // Success - redirect to client dashboard
        toast({
          title: "Success",
          description: "Temporary development bypass: Redirecting to client dashboard",
        });
        
        // Close dialog and redirect
        onOpenChange(false);
        setLocation('/client-dashboard');
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      toast({
        title: "Error",
        description: "There was an error validating your code",
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
          <DialogTitle>Enter Promo Code</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded mb-4 text-sm">
          <strong>Development Mode</strong>: This is a temporary bypass for testing purposes.
          <ul className="mt-2 list-disc list-inside">
            <li>Enter the last 4 digits of your phone number as the code</li>
            <li>For example, if your number is (512) 771-5877, enter: <strong>5877</strong></li>
          </ul>
          This functionality will be replaced with proper verification in production.
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter your promo code"
              className="border-pink-200 focus:border-pink-400"
            />
            
            <DialogFooter className="flex justify-between w-full mt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-pink-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}