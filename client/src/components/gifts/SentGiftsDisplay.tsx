import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, Gift as GiftIcon, CheckCircle, Calendar, ExternalLink, Share2 } from "lucide-react";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";

interface SentGift {
  id: number;
  recipientId?: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
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

interface SentGiftsDisplayProps {
  clientId: number;
  onCreateGift?: () => void;
  setLocation?: (to: string) => void;
  className?: string;
}

export function SentGiftsDisplay({ clientId, onCreateGift }: SentGiftsDisplayProps) {
  const [shareGift, setShareGift] = useState<SentGift | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch sent gifts
  const { data: sentGifts, isLoading } = useQuery({
    queryKey: [`/api/gifts/sent/${clientId}`],
    queryFn: async () => {
      const response = await fetch(`/api/gifts/sent/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sent gifts");
      }
      const gifts = await response.json();
      console.log("Sent gifts:", gifts);
      return gifts as SentGift[];
    },
    enabled: !!clientId,
  });

  const handleShareGift = (gift: SentGift) => {
    setShareGift(gift);
    setIsShareModalOpen(true);
  };

  const copyLinkToClipboard = () => {
    if (shareGift) {
      // Create a unique URL for this gift that could be used to claim it
      const giftUrl = `${window.location.origin}/redeem-gift/${shareGift.giftHash}`;
      navigator.clipboard.writeText(giftUrl);
      
      // Show visual feedback that the link was copied
      const shareButton = document.getElementById('share-button');
      if (shareButton) {
        const originalText = shareButton.innerText;
        shareButton.innerText = 'Copied!';
        setTimeout(() => {
          shareButton.innerText = originalText;
        }, 2000);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full mt-6">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!sentGifts || sentGifts.length === 0) {
    return (
      <Card className="w-full mt-6">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <GiftIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't sent any gifts yet</p>
            {onCreateGift && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={onCreateGift}
              >
                Send Your First Gift
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full mt-6">
        <CardContent className="pt-4">
          {onCreateGift && (
            <div className="flex justify-end mb-4">
              <Button size="sm" onClick={onCreateGift}>
                <GiftIcon className="h-4 w-4 mr-2" />
                Send New Gift
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {sentGifts.map((gift) => (
              <Card key={gift.id} className="border-l-4 border-l-green-400 hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-green-700">{gift.styleName || "Style Card"}</CardTitle>
                      <CardDescription>
                        To: {gift.recipientName || formatPhoneNumber(gift.recipientPhone || "")} • {formatCurrency(gift.amount / 100)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        gift.status === "redeemed" 
                          ? "outline" 
                          : gift.status === "pending" 
                          ? "secondary" 
                          : "default"
                      }
                      className={
                        gift.status === "redeemed" 
                          ? "bg-green-100 text-green-800 border-green-300" 
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {gift.status === "redeemed" 
                        ? "Redeemed" 
                        : gift.status === "pending" 
                        ? "Pending" 
                        : "Sent"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 pb-2">
                  {gift.message && (
                    <p className="text-sm italic border-l-2 border-green-200 pl-3 py-1 text-gray-700">
                      "{gift.message}"
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-0 bg-gradient-to-r from-white to-green-50 border-t">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1 text-green-400" />
                    {new Date(gift.createdAt).toLocaleDateString()}
                    {gift.status === "redeemed" && gift.redeemedAt && (
                      <span className="ml-2 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        Redeemed on {new Date(gift.redeemedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {gift.status !== "redeemed" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShareGift(gift)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share Gift Dialog */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Gift</DialogTitle>
            <DialogDescription>
              Copy this link and send it to the recipient. They can use it to redeem their gift.
            </DialogDescription>
          </DialogHeader>
          
          {shareGift && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-white rounded-md border border-green-100">
              <div className="font-medium text-green-700">{shareGift.styleName || "Style Card"}</div>
              <div className="text-sm text-green-600">Value: {formatCurrency(shareGift.amount / 100)}</div>
              {shareGift.message && (
                <div className="mt-2 text-sm italic text-gray-700">"{shareGift.message}"</div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Sent to: {formatPhoneNumber(shareGift.recipientPhone || "")}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              id="share-button"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              onClick={copyLinkToClipboard}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy Gift Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}