/**
 * GiftViewDialog Component
 * 
 * This component displays a gift view dialog when a client clicks
 * the "View" button for a gift on their dashboard.
 * It shows either a "Send Gift" or "Complete" button based on context.
 */

import React, { useState } from 'react';
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, X } from 'lucide-react';
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";

interface Gift {
  id: number;
  senderId: number;
  recipientId?: number | null;
  recipientPhone: string;
  recipientEmail?: string | null;
  giftType: string;
  styleId?: number | null;
  styleName?: string | null;
  amount: number;
  message?: string | null;
  status: string;
  salonId: number;
  giftHash: string;
  expiresAt?: Date | null;
  createdAt: string;
  redeemedAt?: Date | null;
  recipientName?: string;
  senderName?: string;
}

interface GiftViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gift: Gift;
  clientId: number;
  isSender: boolean;
}

export default function GiftViewDialog({
  open,
  onOpenChange,
  gift,
  clientId,
  isSender
}: GiftViewDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Handle closing the dialog
  const handleClose = () => {
    onOpenChange(false);
    setShowConfirmation(false);
  };

  // Handle sending gift confirmation
  const handleSendGift = async () => {
    setProcessing(true);
    try {
      // Just show confirmation since the gift is already sent
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error sending gift:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending the gift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle completing the gift
  const handleComplete = async () => {
    setProcessing(true);
    try {
      // Update gift status to complete
      const response = await fetch(`/api/gifts/${gift.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) {
        throw new Error('Failed to complete gift');
      }

      // Show success message
      toast({
        title: "Gift Completed",
        description: "The gift has been marked as completed.",
        variant: "default"
      });

      // Close dialog after a delay
      setTimeout(() => {
        handleClose();
        
        // Redirect back to client dashboard
        setLocation(`/client/${clientId}`);
      }, 1500);
    } catch (error) {
      console.error('Error completing gift:', error);
      toast({
        title: "Error",
        description: "An error occurred while completing the gift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">
                {isSender ? "Gift Details" : "Received Gift"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {isSender 
                  ? `You sent a gift for ${formatCurrency(gift.amount)}`
                  : `You received a gift for ${formatCurrency(gift.amount)}`}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4">
              <RenderedInvitation 
                inviteId={`gift-${gift.id}`}
                recipientName={gift.recipientName || "Recipient"}
                styleOption={gift.styleName || "Style Service"}
                price={formatCurrency(gift.amount)}
                time="60 min"
                senderName={gift.senderName || "Sender"}
                message={gift.message || ""}
                status={gift.status}
                salonInitiated={false}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
              {isSender && gift.status === 'pending' && (
                <Button
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={handleSendGift}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "SEND GIFT"}
                </Button>
              )}
              
              {!isSender && gift.status === 'pending' && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleComplete}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "COMPLETE"}
                </Button>
              )}
              
              <Button
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">
                Gift Sent
              </DialogTitle>
              <DialogDescription className="text-center">
                Your gift has been sent successfully.
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 flex flex-col items-center justify-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-center text-gray-700">
                The recipient will be notified about your gift.
              </p>
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                onClick={handleClose}
              >
                Return to Dashboard
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}