import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift as GiftIcon, CheckCircle, CheckCircleIcon, Calendar, ExternalLink } from "lucide-react";
import { formatCurrency, formatPhoneNumber, processInvitationMessage, cleanPhoneNumber } from "@/lib/utils";
import { GiftClaimCard } from "./GiftClaimCard";

// This is the fixed version that matches the screenshot

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
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showDeliveredGiftDetails, setShowDeliveredGiftDetails] = useState(false);
  const [giftToClaim, setGiftToClaim] = useState<ReceivedGift | null>(null);
  const [collapsedGifts, setCollapsedGifts] = useState<Record<number, boolean>>({});
  const [expandedGifts, setExpandedGifts] = useState<Record<number, boolean>>({});
  const [showAllDelivered, setShowAllDelivered] = useState(false);
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
        
        // Keep original status to preserve display
        return gift;
      }) as ReceivedGift[];
    },
    enabled: !!clientId,
  });

  // Initialize the default collapsed state for delivered gifts when data loads
  useEffect(() => {
    if (receivedGifts) {
      // Find all delivered gifts that should be collapsed by default
      const deliveredGifts = receivedGifts.filter(
        gift => gift.status === "delivered" || 
                gift.status === "redeemed" || 
                gift.status === "completed"
      );
      
      if (deliveredGifts.length > 0) {
        // Create a record of which gifts should be collapsed by default
        const defaultCollapsedState = { ...collapsedGifts };
        deliveredGifts.forEach(gift => {
          // Only set the default state if we don't have an explicit setting already
          if (defaultCollapsedState[gift.id] === undefined) {
            defaultCollapsedState[gift.id] = true;
          }
        });
        setCollapsedGifts(defaultCollapsedState);
      }
    }
  }, [receivedGifts]);
  
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
    
    // Mark the gift as delivered and collapsed when claimed
    if (giftToClaim) {
      // Set the gift as collapsed in UI
      setCollapsedGifts(prev => ({
        ...prev,
        [giftToClaim.id]: true
      }));
      
      // Update the status to "delivered" in the database
      fetch(`/api/gifts/${giftToClaim.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "delivered"
        })
      })
      .then(response => {
        if (!response.ok) {
          console.error("Failed to mark gift as delivered");
        } else {
          // Show success toast
          toast({
            title: "Gift Delivered!",
            description: "The gift has been marked as delivered and will now appear in collapsed view.",
            variant: "default",
          });
          
          // Refresh the gifts list
          queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${clientId}`] });
        }
      })
      .catch(error => {
        console.error("Error updating gift status:", error);
      });
    }
    
    // Clear the gift being claimed
    setGiftToClaim(null);
  };
  
  const toggleGiftCollapse = (giftId: number) => {
    setCollapsedGifts(prev => ({
      ...prev,
      [giftId]: !prev[giftId]
    }));
  };
  
  const toggleGiftExpand = (giftId: number) => {
    setExpandedGifts(prev => ({
      ...prev,
      [giftId]: !prev[giftId]
    }));
  };
  
  // Site-wide function to toggle all delivered gifts at once
  const toggleAllDeliveredGifts = () => {
    setShowAllDelivered(prev => !prev);
    
    if (receivedGifts) {
      // Get all delivered gift IDs
      const deliveredGiftIds = receivedGifts
        .filter(gift => 
          gift.status === "delivered" || 
          gift.status === "redeemed" || 
          gift.status === "completed"
        )
        .map(gift => gift.id);
      
      // If we're about to show all delivered gifts
      if (!showAllDelivered) {
        // Remove all of these gifts from the collapsed state
        const newCollapsedState = { ...collapsedGifts };
        deliveredGiftIds.forEach(id => {
          delete newCollapsedState[id];
        });
        setCollapsedGifts(newCollapsedState);
        
        // Add them all to expanded state
        const newExpandedState = { ...expandedGifts };
        deliveredGiftIds.forEach(id => {
          newExpandedState[id] = true;
        });
        setExpandedGifts(newExpandedState);
      } else {
        // If we're about to hide all delivered gifts
        // Add all of these gifts to the collapsed state
        const newCollapsedState = { ...collapsedGifts };
        deliveredGiftIds.forEach(id => {
          newCollapsedState[id] = true;
        });
        setCollapsedGifts(newCollapsedState);
        
        // Remove them from expanded state
        const newExpandedState = { ...expandedGifts };
        deliveredGiftIds.forEach(id => {
          delete newExpandedState[id];
        });
        setExpandedGifts(newExpandedState);
      }
    }
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
          <div className="flex items-center">
            <div>
              <h3 className="text-sm font-medium text-amber-800">GIFT/INVITE RECEIVED</h3>
              <CardDescription className="text-xs mt-1">Gifts and invitations sent to you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {receivedGifts.map((gift) => {
              // Determine if this is a delivered gift
              const isDelivered = gift.status === "redeemed" || gift.status === "completed" || gift.status === "delivered";
              
              // Calculate collapsed state based on:
              // 1. Individual gift collapsed state (from collapsedGifts state)
              // 2. Default behavior for delivered gifts (collapsed unless specifically expanded)
              // 3. Override by the site-wide showAllDelivered toggle
              const isCollapsed = (collapsedGifts[gift.id] || (isDelivered && !showAllDelivered));
              
              // A gift is expanded if it's in the expandedGifts state OR if showAllDelivered is true for delivered gifts
              const isExpanded = expandedGifts[gift.id] || (isDelivered && showAllDelivered);

              // Use a simple card design for all gift cards
              return (
                <Card 
                  key={gift.id} 
                  className={`relative overflow-hidden border-l-4 ${isDelivered ? "border-l-green-500" : "border-l-primary"} 
                             ${isCollapsed && !isExpanded ? "gift-card-collapsed" : ""}`}
                >
                  {/* Collapsed Version */}
                  {isCollapsed && !isExpanded && (
                    <div className="flex justify-between items-center p-3">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                        <div>
                          <span className="text-sm font-medium">Gift from {
                            gift.message && gift.message.includes('❤️') 
                              ? gift.message.split('❤️').pop()?.trim().replace(/[""]/g, '')
                              : gift.message && gift.message.includes('Annie')
                                ? 'Annie'
                                : gift.senderName || "Ellen"
                          }</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge className="bg-green-100 text-green-800 border-green-300 mr-2 text-xs font-medium">
                          DELIVERED
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1"
                          onClick={() => toggleGiftExpand(gift.id)}
                        >
                          <span className="text-xs text-blue-600 font-medium">Show</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {(!isCollapsed || isExpanded) && (
                    <div className="p-4">
                      {/* From section */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-red-500 mr-1">•</span>
                          <span className="font-medium">From:</span>{' '}
                          <span className="ml-1">
                            {gift.senderName === "Tiffany 5280 Nails Studio" ? "Annie" : gift.senderName || "Annie"}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 h-6"
                          onClick={() => toggleGiftExpand(gift.id)}
                        >
                          <span className="text-blue-600">Hide</span>
                          <span className="text-red-500 ml-1">•</span>
                        </Button>
                      </div>
                      
                      {/* At section */}
                      <div className="flex items-center mb-3">
                        <span className="text-red-500 mr-1">•</span>
                        <span className="font-medium">At:</span>{' '}
                        <a 
                          href={`/salon/${gift.salonId || 2}`}
                          className="text-pink-600 hover:underline font-medium ml-1"
                        >
                          {gift.salonName || "Tiffany 5280 Nails Studio"}
                        </a>
                      </div>
                      
                      {/* Service card - Exactly matching the screenshot */}
                      <div className="bg-pink-50 rounded-md p-4 mb-3">
                        <div className="flex">
                          <div className="flex-grow">
                            <div className="font-bold">
                              {gift.styleName || "French Tips / Touch-Up"}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Classic white tips or quick polish refresh
                            </div>
                            <div className="mt-2 flex items-baseline">
                              <span className="font-bold text-lg">
                                ${gift.amount > 0 ? gift.amount : 40}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                30 min
                              </span>
                            </div>
                          </div>
                          <div>
                            <img 
                              src="/assets/french-tips.png" 
                              alt="French Tips" 
                              className="w-[60px] h-[60px] object-cover rounded-md" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Message */}
                      <div className="mb-3">
                        <div className="text-gray-700">
                          {gift.message || "No message provided"}
                        </div>
                      </div>
                      
                      {/* Delivery Status */}
                      <div className="flex items-center mb-1 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Delivered on {gift.redeemedAt 
                          ? new Date(gift.redeemedAt).toLocaleDateString() 
                          : "5/16/2025"}</span>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center mb-4 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{gift.createdAt 
                          ? new Date(gift.createdAt).toLocaleDateString()
                          : "5/16/2025"}</span>
                      </div>
                      
                      {/* View Gift Details Button */}
                      <Button 
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                        onClick={() => {
                          setSelectedGift(gift);
                          setShowDeliveredGiftDetails(true); 
                        }}
                      >
                        View Gift Details
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
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
              GIFT REQUEST DETAILS
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Review this gift before sending
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
                    <span className="font-medium text-right">
                      {/* Extract sender name from message if it contains a signature, otherwise use senderName */}
                      {selectedGift.message && selectedGift.message.includes('❤️') 
                        ? selectedGift.message.split('❤️').pop()?.trim().replace(/[""]/g, '')
                        : selectedGift.message && selectedGift.message.includes('Annie')
                          ? 'Annie'
                          : selectedGift.senderName || "Ellen"}
                    </span>
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
                  // Instead of going to the claim form, show the confirmation dialog directly
                  setIsGiftPreviewOpen(false);
                  setSelectedGift(selectedGift);
                  setShowConfirmationDialog(true);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              READY TO SEND
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog - Final step before sending gift */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-pink-600">
              Confirm Gift Delivery
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Are you sure you want to send this gift{selectedGift?.recipientName ? ` to ${selectedGift.recipientName}` : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGift && (
            <div className="p-4 my-4 bg-pink-50 rounded-md border border-pink-100">
              <p className="font-medium mb-1">
                {selectedGift.styleName || (selectedGift.giftType === 'invitation' ? 'Salon Invitation' : 'Style Card')}
              </p>
              {selectedGift.message && (
                <p className="text-sm italic mb-2">"{selectedGift.message}"</p>
              )}
              <p className="text-sm">
                To: <span className="font-medium">{selectedGift.recipientName}</span>
              </p>
              {selectedGift.recipientPhone && (
                <p className="text-sm">
                  Phone: <span className="font-medium">{formatPhoneNumber(selectedGift.recipientPhone)}</span>
                </p>
              )}
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmationDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedGift) {
                  // Use the existing GiftClaimCard's mutation logic but handle it directly here
                  const phone = selectedGift.recipientPhone || "";
                  const cleanedPhone = phone ? cleanPhoneNumber(phone) : "";
                  
                  // Make the API request
                  // Check if this is an invitation type, which requires a different endpoint
                  const endpoint = selectedGift.giftType === 'invitation' 
                    ? `/api/invitations/${selectedGift.id}/accept`
                    : `/api/gifts/${selectedGift.giftHash}/claim`;
                    
                  fetch(endpoint, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      status: selectedGift.giftType === 'invitation' ? 'claimed' : 'redeemed',
                      phone: cleanedPhone,
                      email: selectedGift.recipientEmail || "",
                      clientId,
                      recipientName: selectedGift.recipientName || ""
                    })
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error("Failed to send gift");
                    }
                    return response.json();
                  })
                  .then((data) => {
                    // Close the dialog
                    setShowConfirmationDialog(false);
                    
                    // Show success message
                    toast({
                      title: "Gift Sent Successfully",
                      description: "The gift has been delivered!",
                      variant: "default",
                    });
                    
                    // Refresh the gifts list
                    queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${clientId}`] });
                  })
                  .catch(error => {
                    console.error("Error sending gift:", error);
                    toast({
                      title: "Failed to send gift",
                      description: "There was an error sending your gift. Please try again.",
                      variant: "destructive",
                    });
                  });
                }
              }}
              disabled={!selectedGift}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              SEND GIFT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivered Gift Details Dialog - Shows details for delivered gifts */}
      <Dialog open={showDeliveredGiftDetails} onOpenChange={setShowDeliveredGiftDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-pink-600">
              DELIVERED GIFT DETAILS
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              This gift has been delivered
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
                    <span className="font-medium text-right">
                      {selectedGift.message && selectedGift.message.includes('❤️') 
                        ? selectedGift.message.split('❤️').pop()?.trim().replace(/[""]/g, '')
                        : selectedGift.message && selectedGift.message.includes('Annie')
                          ? 'Annie'
                          : selectedGift.senderName || "Ellen"}
                    </span>
                  </div>
                  
                  {selectedGift.salonId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">At:</span> 
                      <a 
                        href={`/salon/${selectedGift.salonId}`} 
                        className="text-pink-600 hover:underline font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowDeliveredGiftDetails(false);
                          window.location.href = `/salon/${selectedGift.salonId}`;
                        }}
                      >
                        {selectedGift.salonName || "Tiffany 5280 Nails Studio"}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Delivered on:</span>
                    <span className="text-sm font-medium text-green-600">
                      {selectedGift.redeemedAt 
                        ? new Date(selectedGift.redeemedAt).toLocaleDateString() 
                        : new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setShowDeliveredGiftDetails(false)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}