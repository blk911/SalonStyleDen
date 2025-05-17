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

// Fixed version that properly displays gift messages consistently across all views

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

interface FixedGiftsDisplayProps {
  clientId: number;
  onRedeemGift?: (giftId: number) => void;
  setLocation?: (to: string) => void;
  className?: string;
}

export function FixedGiftsDisplay({ clientId, onRedeemGift, setLocation }: FixedGiftsDisplayProps) {
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
  
  // Get sender name consistently
  const getSenderName = (gift: ReceivedGift): string => {
    return gift.senderName || "Unknown";
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
  
  // Handles viewing gift details
  const viewGiftDetails = (gift: ReceivedGift) => {
    setSelectedGift(gift);
    setShowDeliveredGiftDetails(true);
  };

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
              
              // Calculate collapsed state
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
                          <span className="text-sm font-medium">Gift from {getSenderName(gift)}</span>
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
                            {getSenderName(gift)}
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
                          className="ml-1 text-pink-600 hover:underline"
                        >
                          {gift.salonName || "Tiffany 5280 Nails Studio"}
                        </a>
                      </div>
                      
                      {/* Style & Amount section */}
                      <div className="flex items-center mb-3">
                        <span className="text-red-500 mr-1">•</span>
                        <span className="font-medium">Style:</span>{' '}
                        <span className="ml-1">
                          {gift.styleName || (gift.giftType === 'invitation' ? 'Salon Invitation' : 'Nail Service')}
                          {gift.amount > 0 && ` (${formatCurrency(gift.amount / 100)})`}
                        </span>
                      </div>
                      
                      {/* Message section */}
                      {gift.message && (
                        <div className="mt-2 text-sm text-muted-foreground italic p-2 bg-muted rounded-md whitespace-pre-line">
                          "{gift.message}"
                        </div>
                      )}
                      
                      {/* Status section if delivered */}
                      {isDelivered && (
                        <div className="flex items-center mt-3 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Delivered on {new Date(gift.createdAt || "2025-05-16").toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {/* View gift details button for delivered gifts */}
                      {isDelivered && (
                        <Button 
                          className="w-full mt-4 bg-primary"
                          onClick={() => viewGiftDetails(gift)}
                        >
                          View Gift Details
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gift Details Dialog for Delivered Gifts */}
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
                  <div className="mt-2 px-4 py-3 bg-white border border-pink-100 rounded-md w-full text-sm italic text-gray-700 whitespace-pre-line">
                    "{selectedGift.message}"
                  </div>
                )}
                
                <div className="mt-4 w-full space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">From:</span> 
                    <span className="font-medium text-right">
                      {getSenderName(selectedGift)}
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
                          if (setLocation) {
                            setLocation(`/salon/${selectedGift.salonId}`);
                          } else {
                            window.location.href = `/salon/${selectedGift.salonId}`;
                          }
                        }}
                      >
                        {selectedGift.salonName || "Tiffany 5280 Nails Studio"}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Date:</span> 
                    <span className="font-medium text-right">
                      {new Date(selectedGift.createdAt || "2025-05-16").toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span> 
                    <Badge className="bg-green-100 text-green-800">
                      {selectedGift.status === "redeemed" ? "REDEEMED" : 
                       selectedGift.status === "completed" ? "COMPLETED" : "DELIVERED"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              onClick={() => setShowDeliveredGiftDetails(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}