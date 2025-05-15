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

// Define the shape of the gift data
interface ReceivedGift {
  id: number;
  giftType: string; // Changed from literal type to match the component in ReceivedGiftsDisplay
  senderName?: string;
  salonId?: number;
  salonName?: string;
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  
  // Process message templates on component mount
  const [processedMessage] = useState(() => {
    if (gift.message) {
      return processInvitationMessage(gift.message, {
        styleOption: gift.styleName || "Style Card" // using styleOption instead of styleName
      });
    }
    return "";
  });

  // Mutation for claiming a gift
  const claimGiftMutation = useMutation({
    mutationFn: async () => {
      // For invitations, mark as claimed. For gifts, mark as redeemed.
      const status = gift.giftType === 'invitation' ? 'claimed' : 'redeemed';
      
      // Clean the phone number for submission
      const cleanedPhone = phone ? cleanPhoneNumber(phone) : "";
      
      const response = await fetch(`/api/gifts/${gift.giftHash}/claim`, {
        method: "POST",
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
  const validatePhone = (input: string): boolean => {
    return isValidPhone(input);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedPhone = phone ? cleanPhoneNumber(phone) : "";
    
    // Validate phone number
    if (!cleanedPhone || !validatePhone(cleanedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
    } else {
      // Format for display consistency
      setPhone(formatPhoneNumber(phone));
      
      // Show confirmation dialog instead of immediate submission
      setShowConfirmDialog(true);
    }
  };
  
  // Function to proceed with claim after confirmation
  const confirmClaimGift = () => {
    setShowConfirmDialog(false);
    // Proceed with the mutation
    claimGiftMutation.mutate();
  };

  return (
    <>
      <Card className="gift-invitation-card w-full max-w-md mx-auto">
        <CardHeader className="gift-invitation-header pb-4">
          <div className="flex items-center gap-2">
            <GiftIcon className="h-6 w-6 text-pink-600" />
            <CardTitle className="text-xl text-pink-800 font-bold">SEND GIFT</CardTitle>
          </div>
          {gift.giftType === 'invitation' ? (
            <CardDescription className="text-gray-600 pt-1">
              Complete this invitation to send a gift
            </CardDescription>
          ) : (
            <CardDescription className="text-gray-600 pt-1">
              Claim this gift to add it to your account
            </CardDescription>
          )}
          
          {gift.status === 'sent' && (
            <Badge className="absolute top-4 right-4 bg-pink-100 text-pink-800 border border-pink-200">
              READY TO CLAIM
            </Badge>
          )}
          {gift.status === 'redeemed' && (
            <Badge className="absolute top-4 right-4 bg-green-100 text-green-800 border border-green-200">
              CLAIMED
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="gift-style-info bg-gradient-to-r from-pink-50 to-white p-5 rounded-md border border-pink-100 shadow-sm">
              <div className="font-bold text-xl mb-2">
                {gift.styleName || (gift.giftType === 'invitation' ? 'Salon Invitation' : 'Style Card')}
                {gift.amount > 0 && (
                  <span className="text-lg ml-2">
                    ({formatCurrency(gift.amount / 100)})
                  </span>
                )}
              </div>
              
              {gift.message && (
                <div className="text-gray-700 italic mb-4 text-sm">
                  "{processedMessage}"
                </div>
              )}
              
              <div className="flex flex-col text-sm space-y-1">
                <div>
                  <span className="text-gray-500">From:</span> <span className="font-medium">
                    {gift.message && gift.message.includes('❤️') 
                      ? gift.message.split('❤️').pop()?.trim().replace(/[""]/g, '')
                      : gift.message && gift.message.includes('Annie')
                        ? 'Annie'
                        : gift.senderName || "Ellen"}
                  </span>
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
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-pink-400" />
                <Input 
                  id="phone" 
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => {
                    // Format the phone number as the user types
                    const input = e.target.value;
                    const formattedInput = formatPhoneNumber(input);
                    setPhone(formattedInput);
                  }}
                  className="flex-1"
                  disabled={claimGiftMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the phone number we should send this gift to
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email (Optional)</Label>
              <div className="flex items-center">
                <MailIcon className="h-4 w-4 mr-2 text-pink-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={claimGiftMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500">
                We'll send a confirmation to this email address
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            onClick={handleSubmit}
            disabled={claimGiftMutation.isPending || !phone}
            className="w-full bg-pink-600 hover:bg-pink-700 font-bold"
            size="lg"
          >
            {claimGiftMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `SEND GIFT TO ${gift.recipientName || "RECIPIENT"}`
            )}
          </Button>
          
          {!phone && (
            <p className="text-xs text-center mt-2 text-gray-500">
              Please enter your phone number to continue
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Confirm Gift Delivery</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to send this gift to {gift.recipientName || "the recipient"}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 my-4 bg-muted rounded-md">
            <p className="font-medium mb-1">
              {gift.styleName || (gift.giftType === 'invitation' ? 'Salon Invitation' : 'Style Card')}
            </p>
            {gift.message && (
              <p className="text-sm italic mb-2">"{processedMessage}"</p>
            )}
            <p className="text-sm">
              To: <span className="font-medium">{gift.recipientName}</span>
            </p>
          </div>
          
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmClaimGift}
              disabled={claimGiftMutation.isPending}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {claimGiftMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, Send Gift"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  From: <span className="font-semibold text-black">
                    {gift.message && gift.message.includes('❤️') 
                      ? gift.message.split('❤️').pop()?.trim().replace(/[""]/g, '')
                      : gift.message && gift.message.includes('Annie')
                        ? 'Annie'
                        : gift.senderName || "Ellen"}
                  </span>
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