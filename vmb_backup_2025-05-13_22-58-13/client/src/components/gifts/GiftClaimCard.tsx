import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GiftIcon, PhoneIcon, MailIcon, Loader2, CheckCircle, X } from "lucide-react";
import { formatCurrency, formatPhoneNumber, cleanPhoneNumber, isValidPhone, processInvitationMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientId?: number;
}

interface GiftClaimCardProps {
  gift: ReceivedGift;
  clientId: number;
  onGiftClaimed?: () => void;
}

export function GiftClaimCard({ gift, clientId, onGiftClaimed }: GiftClaimCardProps) {
  // Initialize phone state with the recipient's phone if available, or empty string
  const [phone, setPhone] = useState(gift.recipientPhone ? formatPhoneNumber(gift.recipientPhone) : "");
  const [email, setEmail] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { toast } = useToast();
  
  // Process message templates on component mount
  const [processedMessage] = useState(() => {
    if (gift.message) {
      return processInvitationMessage(gift.message, {
        clientName: gift.recipientName,
        salonName: gift.salonName,
        ownerName: gift.senderName,
        styleOption: gift.styleName || "nail service",
        uniqueId: gift.giftHash?.replace("VMB-INV-", "") || "VMB-ID"
      });
    }
    return gift.message;
  });

  // Mutation for claiming a gift
  const claimGiftMutation = useMutation({
    mutationFn: async () => {
      // Clean the phone number
      const cleanedPhone = cleanPhoneNumber(phone);
      
      // Use different endpoints based on gift type
      const endpoint = gift.giftType === 'invitation' 
        ? `/api/invitations/${gift.id}/claim` 
        : `/api/gifts/${gift.id}/status`;
      
      const method = gift.giftType === 'invitation' ? 'POST' : 'PATCH';
      const status = gift.giftType === 'invitation' ? 'claimed' : 'redeemed';
      
      console.log(`Claiming ${gift.giftType} with phone: ${cleanedPhone}`);
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: status,
          phone: cleanedPhone, // Use the cleaned phone number
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
      
      // Show the success dialog instead of a toast
      setShowSuccessDialog(true);
      
      // We still call the callback but won't immediately redirect
      if (onGiftClaimed) {
        // Only call onGiftClaimed when the dialog is closed
        // This will happen in the dialog close handler
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

  // Use the same phone utils as ClientRegistrationPage
  const handleClaimGift = () => {
    // Only allow claiming if status is pending or if the gift is an invitation that is marked completed
    // (since invitations are shown as pending in the UI even when they're completed)
    if (gift.status === "pending" || (gift.giftType === 'invitation' && gift.status === "completed")) {
      // Clean the phone number before submission
      const cleanedPhone = cleanPhoneNumber(phone);
      
      // Validate using same logic as in the registration page
      if (!isValidPhone(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid 10-digit phone number",
          variant: "destructive",
        });
        return;
      }
      
      // Set the phone number with proper formatting
      setPhone(formatPhoneNumber(phone));
      
      // Proceed with the mutation
      claimGiftMutation.mutate();
    }
  };

  return (
    <>
      <Card className="gift-invitation-card w-full max-w-md mx-auto">
        <CardHeader className="gift-invitation-header pb-4">
          <div className="flex items-center gap-2">
            <GiftIcon className="h-6 w-6 text-pink-600" />
            <CardTitle className="text-xl text-pink-800 font-bold">GIFT/INVITE RECEIVED</CardTitle>
          </div>
          <CardDescription className="mt-2">
            Claim your {gift.giftType === 'invitation' ? 'invitation' : 'gift'} by confirming your contact information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="bg-gradient-to-r from-pink-50 to-white p-4 rounded-md mb-6 border border-pink-100 shadow-sm">
            <div className="text-lg font-medium text-pink-700">
              {gift.styleName || (gift.giftType === 'invitation' ? 'Salon Invitation' : 'Style Card')}
            </div>
            
            {gift.amount > 0 && (
              <div className="text-sm font-medium mt-1 text-pink-600">
                Value: {formatCurrency(gift.amount / 100)}
              </div>
            )}
            
            {processedMessage && (
              <div className="mt-3 text-sm italic border-l-2 border-pink-200 pl-3 py-1 text-gray-700">
                "{processedMessage}"
              </div>
            )}
            
            <div className="mt-3 grid grid-cols-2 gap-x-2 text-sm">
              <div>
                <span className="text-gray-500">From:</span> <span className="font-medium">{gift.senderName || "Ellen"}</span>
              </div>
              <div>
                <span className="text-gray-500">At:</span> <span className="font-medium">
                  {gift.salonId ? (
                    <a 
                      href={`/salon/${gift.salonId}`} 
                      className="text-pink-600 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/salon/${gift.salonId}`;
                      }}
                    >
                      {gift.salonName || "Tiffany 5280 Nails Studio"}
                    </a>
                  ) : (
                    "Tiffany 5280 Nails Studio"
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-pink-400" />
                <Input 
                  id="phone" 
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="redemption-input-field"
                />
              </div>
              <p className="text-xs text-gray-500">Enter your phone number to match with the sender's contact</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email (Optional)</Label>
              <div className="flex items-center">
                <MailIcon className="h-4 w-4 mr-2 text-pink-400" />
                <Input 
                  id="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="redemption-input-field"
                />
              </div>
              <p className="text-xs text-gray-500">Your email helps us confirm your identity and keep you updated</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4 pb-4 bg-gradient-to-r from-white to-pink-50 flex flex-col">
          <Button 
            className="gift-claim-button w-full font-bold tracking-wide"
            size="lg"
            onClick={handleClaimGift}
            disabled={!phone || phone.length < 10 || claimGiftMutation.isPending}
          >
            {claimGiftMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "CLAIM MY GIFT"
            )}
          </Button>
          
          {!phone && (
            <p className="text-xs text-center mt-2 text-gray-500">
              Please enter your phone number to continue
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Success Dialog - GIFT DELIVERED popup */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2 text-pink-600">
              <CheckCircle className="h-7 w-7 text-green-500" />
              GIFT DELIVERED
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-base">
              Your gift has been successfully claimed and is now available in your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gradient-to-r from-green-50 to-white p-5 rounded-md my-4 border border-green-200 shadow-sm">
            <div className="flex flex-col items-center">
              <GiftIcon className="h-14 w-14 text-pink-500 mb-3" />
              <p className="text-center font-bold text-lg">
                {gift.styleName || "Style Card"} {gift.amount > 0 && `(${formatCurrency(gift.amount / 100)})`}
              </p>
              <div className="text-sm text-center mt-3 space-y-2">
                <p className="text-gray-700">
                  From: <span className="font-semibold text-black">{gift.senderName || "Ellen"}</span>
                </p>
                {gift.salonId && (
                  <p className="text-gray-700">
                    At: <a 
                      href={`/salon/${gift.salonId}`} 
                      className="text-pink-600 hover:underline font-semibold"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowSuccessDialog(false);
                        window.location.href = `/salon/${gift.salonId}`;
                      }}
                    >
                      {gift.salonName || "Tiffany 5280 Nails Studio"}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-center">
            <Button 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3"
              size="lg"
              onClick={() => {
                setShowSuccessDialog(false);
                if (onGiftClaimed) {
                  // Now call the callback which will refresh or redirect
                  onGiftClaimed();
                }
              }}
            >
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}