import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GiftIcon, PhoneIcon, MailIcon, Loader } from "lucide-react";
import { 
  formatCurrency, 
  formatPhoneNumber, 
  cleanPhoneNumber, 
  normalizePhoneForStorage,
  isValidPhone 
} from "@/lib/utils";

interface ReceivedGift {
  id: number;
  senderId: number;
  senderName?: string;
  salonId: number;
  salonName?: string;
  giftType: string;
  styleId?: number;
  styleName?: string;
  amount: number;
  message?: string;
  status: string;
  giftHash: string;
  createdAt: string;
  expiresAt?: string;
  redeemedAt?: string;
}

interface GiftClaimCardProps {
  gift: ReceivedGift;
  clientId: number;
  onGiftClaimed?: () => void;
}

export function GiftClaimCard({ gift, clientId, onGiftClaimed }: GiftClaimCardProps) {
  const [phone, setPhone] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Format the phone number for display as the user types
  useEffect(() => {
    // Update the displayed phone with formatting
    if (phone) {
      setDisplayPhone(formatPhoneNumber(phone));
    }
  }, [phone]);

  // Mutation for claiming a gift
  const claimGiftMutation = useMutation({
    mutationFn: async () => {
      // Normalize phone for storage according to VMB standards
      const normalizedPhone = normalizePhoneForStorage(phone);
      
      // Use different endpoints based on gift type
      const endpoint = gift.giftType === 'invitation' 
        ? `/api/invitations/${gift.id}/claim` 
        : `/api/gifts/${gift.id}/status`;
      
      const method = gift.giftType === 'invitation' ? 'POST' : 'PATCH';
      const status = gift.giftType === 'invitation' ? 'claimed' : 'redeemed';
      
      console.log(`Claiming ${gift.giftType} with normalized phone: ${normalizedPhone}`);
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: status,
          phone: normalizedPhone, // Use the normalized 10-digit phone per VMB standards
          email,
          clientId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Claim error response:', errorData);
        throw new Error(`Failed to claim ${gift.giftType}: ${errorData.message || response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${clientId}`] });
      toast({
        title: "Gift claimed successfully!",
        description: "Your gift has been claimed and added to your account",
        variant: "default",
      });
      if (onGiftClaimed) {
        onGiftClaimed();
      }
    },
    onError: (error) => {
      console.error("Error claiming gift:", error);
      toast({
        title: "Failed to claim gift",
        description: "There was an error claiming your gift. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle phone number input changes with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = cleanPhoneNumber(inputValue);
    setPhone(digits);
  };

  const handleClaimGift = () => {
    // Only allow claiming if status is pending or if the gift is an invitation that is marked completed
    // (since invitations are shown as pending in the UI even when they're completed)
    if (gift.status === "pending" || (gift.giftType === 'invitation' && gift.status === "completed")) {
      // Validate the phone number according to VMB standards
      if (!isValidPhone(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid 10-digit US phone number",
          variant: "destructive",
        });
        return;
      }
      
      // Proceed with the mutation
      claimGiftMutation.mutate();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/15 to-primary/5 pb-4">
        <div className="flex items-center gap-2">
          <GiftIcon className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-bold tracking-tight">GIFT/INVITE RECEIVED</CardTitle>
        </div>
        <CardDescription className="mt-2">
          Claim your {gift.giftType === 'invitation' ? 'invitation' : 'gift'} by confirming your contact information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="bg-muted/50 p-4 rounded-md mb-6 border border-primary/10">
          <div className="text-lg font-medium text-primary">
            {gift.styleName || (gift.giftType === 'invitation' ? 'Salon Invitation' : 'Style Card')}
          </div>
          
          {gift.amount > 0 && (
            <div className="text-sm font-medium mt-1">
              Value: {formatCurrency(gift.amount / 100)}
            </div>
          )}
          
          {gift.message && (
            <div className="mt-3 text-sm italic border-l-2 border-primary/20 pl-3 py-1">
              "{gift.message}"
            </div>
          )}
          
          <div className="mt-3 grid grid-cols-2 gap-x-2 text-sm">
            <div>
              <span className="text-muted-foreground">From:</span> {gift.senderName || "A VMB Client"}
            </div>
            <div>
              <span className="text-muted-foreground">At:</span> {gift.salonName || "Salon"}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
            <div className="flex items-center">
              <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                id="phone" 
                placeholder="(555) 123-4567"
                value={displayPhone || ''}
                onChange={handlePhoneChange}
                className="focus:border-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter your phone number to match with the sender's contact</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium">Email (Optional)</Label>
            <div className="flex items-center">
              <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                id="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:border-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">Your email helps us confirm your identity and keep you updated</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 pb-4 bg-muted/20 flex flex-col">
        <Button 
          className="w-full"
          size="lg"
          onClick={handleClaimGift}
          disabled={!phone || phone.length < 10 || claimGiftMutation.isPending}
        >
          {claimGiftMutation.isPending ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <GiftIcon className="mr-2 h-5 w-5" /> 
              CLAIM MY GIFT
            </>
          )}
        </Button>
        
        {!phone && (
          <p className="text-xs text-center mt-2 text-muted-foreground">
            Please enter your phone number to continue
          </p>
        )}
      </CardFooter>
    </Card>
  );
}