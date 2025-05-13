import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift as GiftIcon, CheckCircle, Calendar, ExternalLink } from "lucide-react";
import { formatCurrency, formatPhoneNumber, processInvitationMessage } from "@/lib/utils";
import { GiftClaimCard } from "./GiftClaimCard";

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

interface ReceivedGiftsDisplayProps {
  clientId: number;
  onRedeemGift?: (giftId: number) => void;
  setLocation?: (to: string) => void;
  className?: string;
}

export function ReceivedGiftsDisplay({ clientId, onRedeemGift }: ReceivedGiftsDisplayProps) {
  const [selectedGift, setSelectedGift] = useState<ReceivedGift | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isGiftPreviewOpen, setIsGiftPreviewOpen] = useState(false);
  const [showGiftClaimForm, setShowGiftClaimForm] = useState(false);
  const [giftToClaim, setGiftToClaim] = useState<ReceivedGift | null>(null);
  const { toast } = useToast();

  // Fetch received gifts
  const { data: receivedGifts, isLoading } = useQuery({
    queryKey: [`/api/gifts/received/${clientId}`],
    queryFn: async () => {
      const response = await fetch(`/api/gifts/received/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch received gifts");
      }
      const gifts = await response.json();
      console.log("Received gifts:", gifts);
      
      // Process gift/invitation messages and convert completed invitations to pending for proper UI flow
      return gifts.map((gift: ReceivedGift) => {
        // Process message templates to replace placeholders
        if (gift.message) {
          gift.message = processInvitationMessage(gift.message, {
            clientName: gift.recipientName,
            salonName: gift.salonName,
            ownerName: gift.senderName,
            styleOption: gift.styleName || "nail service",
            uniqueId: gift.giftHash?.replace("VMB-INV-", "") || "VMB-ID"
          });
        }
        
        // Mark invitations as "pending" for proper claim flow
        if (gift.giftType === 'invitation' && gift.status === 'completed') {
          return { ...gift, status: 'pending' };
        }
        return gift;
      }) as ReceivedGift[];
    },
    enabled: !!clientId,
  });

  // Mutation for redeeming a gift
  const redeemGiftMutation = useMutation({
    mutationFn: async (giftId: number) => {
      const response = await fetch(`/api/gifts/${giftId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "redeemed"
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to redeem gift");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${clientId}`] });
      toast({
        title: "Gift redeemed successfully!",
        description: "Your gift has been redeemed and added to your account",
        variant: "default",
      });
      setIsRedeemModalOpen(false);
      if (onRedeemGift && selectedGift) {
        onRedeemGift(selectedGift.id);
      }
    },
    onError: (error) => {
      console.error("Error redeeming gift:", error);
      toast({
        title: "Failed to redeem gift",
        description: "There was an error redeeming your gift. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleRedeemGift = (gift: ReceivedGift) => {
    setSelectedGift(gift);
    setIsRedeemModalOpen(true);
  };

  const confirmRedeemGift = () => {
    if (selectedGift) {
      redeemGiftMutation.mutate(selectedGift.id);
    }
  };

  const handlePreviewGift = (gift: ReceivedGift) => {
    setSelectedGift(gift);
    setIsGiftPreviewOpen(true);
  };

  const handleShowGiftClaim = (gift: ReceivedGift) => {
    setGiftToClaim(gift);
    setShowGiftClaimForm(true);
    // Close the preview dialog
    setIsGiftPreviewOpen(false);
  };

  const handleGiftClaimed = () => {
    setShowGiftClaimForm(false);
    setGiftToClaim(null);
    // Refresh the gifts list
    queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${clientId}`] });
  };

  if (showGiftClaimForm && giftToClaim) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowGiftClaimForm(false)}
            className="mb-4"
          >
            &larr; Back to Gifts
          </Button>
        </div>
        <GiftClaimCard 
          gift={giftToClaim} 
          clientId={clientId} 
          onGiftClaimed={handleGiftClaimed} 
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-yellow-50 pb-3 pt-3">
          <h3 className="text-sm font-medium text-amber-800">GIFT/INVITE RECEIVED</h3>
          <CardDescription className="text-xs mt-1">Gifts and invitations sent to you</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!receivedGifts || receivedGifts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-yellow-50 pb-3 pt-3">
          <h3 className="text-sm font-medium text-amber-800">GIFT/INVITE RECEIVED</h3>
          <CardDescription className="text-xs mt-1">Gifts and invitations sent to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <GiftIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't received any gifts or invitations yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="bg-yellow-50 pb-3 pt-3">
          <h3 className="text-sm font-medium text-amber-800">GIFT/INVITE RECEIVED</h3>
          <CardDescription className="text-xs mt-1">Gifts and invitations sent to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {receivedGifts.map((gift) => (
              <Card key={gift.id} className="relative overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div>
                    <CardTitle className="text-lg">{gift.senderName || "Ellen"}</CardTitle>
                    <CardDescription>
                      {gift.amount > 0 && <>{formatCurrency(gift.amount / 100)}</>}
                      {gift.salonId && gift.salonName && (
                        <div className="mt-1">At: <a 
                          href={`/salon/${gift.salonId}`} 
                          className="text-pink-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/salon/${gift.salonId}`;
                          }}
                        >
                          {gift.salonName || "Tiffany 5280 Nails Studio"}
                        </a>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  {gift.message && <p className="text-sm italic">"{gift.message}"</p>}
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-0">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(gift.createdAt).toLocaleDateString()}
                  </div>
                  <Badge
                    variant={gift.status === "redeemed" || gift.status === "completed" ? "outline" : "default"}
                    className={gift.status === "redeemed" || gift.status === "completed" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-200"}
                  >
                    {gift.status === "redeemed" || gift.status === "completed" ? "Redeemed" : "Pending"}
                  </Badge>
                </CardFooter>

                {/* Show Claim My Gift button for pending gifts/invitations */}
                {gift.status === "pending" && (
                  <div className="pb-4 px-6">
                    <Button 
                      size="default" 
                      onClick={() => handlePreviewGift(gift)}
                      variant="default"
                      className="w-full font-bold tracking-wide bg-red-500 hover:bg-red-600 text-white rounded-md"
                    >
                      CLAIM MY GIFT
                    </Button>
                  </div>
                )}
                
                {/* Show redeem button for non-invitation gifts that are ready to redeem */}
                {(gift.status !== "redeemed" && gift.status !== "completed" && gift.status !== "pending" && gift.giftType !== 'invitation') && (
                  <div className="pb-4 px-6">
                    <Button 
                      size="sm" 
                      onClick={() => handleRedeemGift(gift)}
                      disabled={redeemGiftMutation.isPending}
                    >
                      {redeemGiftMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Redeem Gift
                    </Button>
                  </div>
                )}
                
                {/* Show redeemed status */}
                {(gift.status === "redeemed" || gift.status === "completed") && (
                  <div className="pb-2 px-6">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      Redeemed on {gift.redeemedAt ? new Date(gift.redeemedAt).toLocaleDateString() : "—"}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={isRedeemModalOpen} onOpenChange={setIsRedeemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Gift</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this gift? Once redeemed, it will be added to your account.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGift && (
            <div className="p-4 bg-muted rounded-md">
              <div className="font-medium">{selectedGift.styleName || "Style Card"}</div>
              <div className="text-sm text-muted-foreground">Value: {formatCurrency(selectedGift.amount / 100)}</div>
              {selectedGift.message && (
                <div className="mt-2 text-sm italic">"{selectedGift.message}"</div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmRedeemGift}
              disabled={redeemGiftMutation.isPending}
            >
              {redeemGiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redeem Gift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Preview Dialog - Shows gift details before claiming */}
      <Dialog open={isGiftPreviewOpen} onOpenChange={setIsGiftPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-pink-600">
              Gift Details
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Review this gift before claiming it
            </DialogDescription>
          </DialogHeader>
          
          {selectedGift && (
            <div className="bg-gradient-to-r from-pink-50 to-white p-5 rounded-md my-4 border border-pink-100 shadow-sm">
              <div className="flex flex-col items-center">
                <GiftIcon className="h-12 w-12 text-pink-500 mb-3" />
                <div className="text-center font-bold text-lg mb-3">
                  {selectedGift.styleName || (selectedGift.giftType === 'invitation' ? 'Salon Invitation' : 'Style Card')}
                  {selectedGift.amount > 0 && (
                    <div className="font-semibold text-base text-pink-600 mt-1">
                      Value: {formatCurrency(selectedGift.amount / 100)}
                    </div>
                  )}
                </div>
                
                {selectedGift.message && (
                  <div className="mt-2 px-4 py-3 bg-white border border-pink-100 rounded-md w-full text-sm italic text-gray-700">
                    "{selectedGift.message}"
                  </div>
                )}
                
                <div className="mt-4 w-full space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">From:</span> 
                    <span className="font-medium text-right">{selectedGift.senderName || "Ellen"}</span>
                  </div>
                  
                  {selectedGift.salonId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">At:</span> 
                      <a 
                        href={`/salon/${selectedGift.salonId}`} 
                        className="text-pink-600 hover:underline font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsGiftPreviewOpen(false);
                          window.location.href = `/salon/${selectedGift.salonId}`;
                        }}
                      >
                        {selectedGift.salonName || "Tiffany 5280 Nails Studio"}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-sm">
                      {new Date(selectedGift.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
            <Button 
              onClick={() => setIsGiftPreviewOpen(false)}
              variant="outline"
              className="sm:mr-2"
            >
              Not Now
            </Button>
            <Button 
              onClick={() => {
                if (selectedGift) {
                  handleShowGiftClaim(selectedGift);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Proceed to Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}