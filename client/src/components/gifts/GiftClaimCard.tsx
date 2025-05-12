import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GiftIcon, PhoneIcon, MailIcon } from "lucide-react";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";

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
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Mutation for claiming a gift
  const claimGiftMutation = useMutation({
    mutationFn: async () => {
      // Use different endpoints based on gift type
      const endpoint = gift.giftType === 'invitation' 
        ? `/api/invitations/${gift.id}/claim` 
        : `/api/gifts/${gift.id}/status`;
      
      const method = gift.giftType === 'invitation' ? 'POST' : 'PATCH';
      const status = gift.giftType === 'invitation' ? 'claimed' : 'redeemed';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: status,
          phone,
          email,
          clientId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to claim ${gift.giftType}`);
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

  const handleClaimGift = () => {
    if (gift.status === "pending") {
      claimGiftMutation.mutate();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <div className="flex items-center gap-2">
          <GiftIcon className="h-5 w-5 text-primary" />
          <CardTitle>You've Received a Gift!</CardTitle>
        </div>
        <CardDescription>
          Claim your gift by providing your contact information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="bg-muted/50 p-4 rounded-md mb-6">
          <div className="text-lg font-medium">
            {gift.styleName || (gift.giftType === 'invitation' ? 'Invitation' : 'Style Card')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Value: {gift.amount > 0 ? formatCurrency(gift.amount / 100) : 'No Value Set'}
          </div>
          
          {gift.message && (
            <div className="mt-3 text-sm italic">"{gift.message}"</div>
          )}
          
          <div className="mt-3 text-sm">
            <strong>From:</strong> {gift.senderName || "A VMB Client"}
          </div>
          <div className="text-sm">
            <strong>At:</strong> {gift.salonName || "Salon"}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center">
              <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                id="phone" 
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter your phone number to claim this gift</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <div className="flex items-center">
              <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                id="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Your email is optional but helps us keep in touch</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 pb-4 bg-muted/20">
        <Button 
          className="w-full"
          size="lg"
          onClick={handleClaimGift}
          disabled={!phone || claimGiftMutation.isPending}
        >
          {claimGiftMutation.isPending ? "Claiming..." : "Claim My Gift"}
        </Button>
      </CardFooter>
    </Card>
  );
}