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

interface ReceivedGiftsDisplayProps {
  clientId: number;
  onRedeemGift?: (giftId: number) => void;
}

export function ReceivedGiftsDisplay({ clientId, onRedeemGift }: ReceivedGiftsDisplayProps) {
  const [selectedGift, setSelectedGift] = useState<ReceivedGift | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
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
      return gifts as ReceivedGift[];
    },
    enabled: !!clientId,
  });

  // Mutation for redeeming a gift
  const redeemGiftMutation = useMutation({
    mutationFn: async (giftId: number) => {
      return await apiRequest("PATCH", `/api/gifts/${giftId}/status`, {
        status: "redeemed"
      });
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

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Gifts</CardTitle>
          <CardDescription>Gifts sent to you from other clients</CardDescription>
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
        <CardHeader>
          <CardTitle>Your Gifts</CardTitle>
          <CardDescription>Gifts sent to you from other clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <GiftIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't received any gifts yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Gifts</CardTitle>
          <CardDescription>Gifts sent to you from other clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {receivedGifts.map((gift) => (
              <Card key={gift.id} className="relative overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{gift.styleName || "Style Card"}</CardTitle>
                      <CardDescription>
                        From: {gift.senderName || "A VMB Client"} • {formatCurrency(gift.amount / 100)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={gift.status === "redeemed" ? "outline" : "default"}
                      className={gift.status === "redeemed" ? "bg-green-100 text-green-800 border-green-300" : ""}
                    >
                      {gift.status === "redeemed" ? "Redeemed" : "Ready to Use"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  {gift.message && <p className="text-sm italic">"{gift.message}"</p>}
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(gift.createdAt).toLocaleDateString()}
                  </div>
                  {gift.status !== "redeemed" && (
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
                  )}
                  {gift.status === "redeemed" && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      Redeemed on {gift.redeemedAt ? new Date(gift.redeemedAt).toLocaleDateString() : "—"}
                    </div>
                  )}
                </CardFooter>
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
    </>
  );
}