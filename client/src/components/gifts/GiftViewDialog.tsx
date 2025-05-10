import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';

interface Gift {
  id: number;
  name: string;
  message?: string | null;
  styleOption?: string | null;
  stylePrice?: number | null;
  styleDuration?: number | null;
  status: string;
  createdAt: string;
}

interface GiftViewDialogProps {
  gift: Gift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: number;
}

export default function GiftViewDialog({ gift, open, onOpenChange, clientId }: GiftViewDialogProps) {
  if (!gift) return null;

  // Format price for display
  const formattedPrice = gift.stylePrice 
    ? `$${typeof gift.stylePrice === 'number' ? (gift.stylePrice / 100).toFixed(2) : gift.stylePrice}`
    : "$45";

  // Handle the close button click
  const handleClose = () => {
    onOpenChange(false);
    
    // Return to client dashboard if clientId is provided
    if (clientId) {
      window.location.href = `/client/${clientId}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gift Details</DialogTitle>
          <DialogDescription>
            You sent this gift to {gift.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Card className="p-4 bg-white border border-gray-200">
            <div className="space-y-4">
              {/* Gift message */}
              <div className="text-sm text-gray-700 italic">
                "{gift.message || "Gift invitation"}"
              </div>
              
              {/* Style details */}
              {gift.styleOption && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Style:</span>
                  <span className="font-medium">{gift.styleOption}</span>
                  
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">{formattedPrice}</span>
                  
                  {gift.styleDuration && (
                    <>
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{gift.styleDuration} min</span>
                    </>
                  )}
                </div>
              )}
              
              {/* Completed status indicator */}
              <div className="mt-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-700 font-medium">COMPLETED</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button 
            className="w-full"
            onClick={handleClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}