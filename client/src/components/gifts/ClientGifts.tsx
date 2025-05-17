import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, MapPin, HeartIcon, Calendar } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import type { Invitation } from '../../types';

interface Gift {
  id: number;
  senderId: number;
  senderName?: string;
  recipientId?: number;
  recipientName: string;
  recipientPhone: string;
  styleId?: number;
  styleName?: string;
  status: string;
  value?: number;
  message?: string;
  createdAt?: string;
  redeemedAt?: string;
  expiresAt?: string;
  salonId?: number;
  salonName?: string;
}

interface ClientGiftsProps {
  clientId: number;
  completedInvitations?: Invitation[];
}

export default function ClientGifts({ clientId, completedInvitations = [] }: ClientGiftsProps) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftDetailsOpen, setGiftDetailsOpen] = useState(false);
  const [showDelivered, setShowDelivered] = useState(true);
  
  // Fetch received gifts
  const { data: receivedGifts, isLoading: isLoadingReceived } = useQuery({
    queryKey: [`/api/gifts/received/${clientId}`],
    queryFn: async () => {
      const response = await fetch(`/api/gifts/received/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch received gifts');
      }
      const data = await response.json();
      console.log('Received gifts:', data);
      return data as Promise<Gift[]>;
    }
  });

  // Fetch sent gifts
  const { data: sentGifts, isLoading: isLoadingSent } = useQuery({
    queryKey: [`/api/gifts/sent/${clientId}`],
    queryFn: async () => {
      const response = await fetch(`/api/gifts/sent/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sent gifts');
      }
      const data = await response.json();
      console.log('Sent gifts:', data);
      return data as Promise<Gift[]>;
    }
  });
  
  // Function to open gift details dialog
  const viewGiftDetails = (gift: Gift) => {
    setSelectedGift(gift);
    setGiftDetailsOpen(true);
  };

  const isLoading = isLoadingReceived || isLoadingSent;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const hasReceivedGifts = receivedGifts && receivedGifts.length > 0;
  const hasSentGifts = sentGifts && sentGifts.length > 0;

  if (!hasReceivedGifts && !hasSentGifts) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Your Gifts</CardTitle>
          <CardDescription>You don't have any gifts yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Gift Details Dialog */}
      <Dialog open={giftDetailsOpen} onOpenChange={setGiftDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Gift Details</DialogTitle>
          </DialogHeader>
          
          {selectedGift && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <Badge 
                  variant="outline" 
                  className="px-6 py-2 text-lg font-medium bg-green-50 border-green-200 text-green-700 rounded-full"
                >
                  DELIVERED
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Gift sent on {formatDate(selectedGift.createdAt)}
                </div>
              </div>
              
              {/* Information card with subtle styling */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                {selectedGift.senderName && (
                  <div className="flex items-center text-sm">
                    <Gift className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-700">
                      From: {selectedGift.senderName}
                    </span>
                  </div>
                )}
                
                {selectedGift.salonName && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-700">
                      Salon: {selectedGift.salonName}
                    </span>
                  </div>
                )}
                
                {selectedGift.styleName && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-700">
                      Service: {selectedGift.styleName || 'Beauty Service'}
                    </span>
                  </div>
                )}
                
                {selectedGift.status === 'completed' && (
                  <div className="flex items-center text-sm text-green-600">
                    <div className="flex-shrink-0 h-4 w-4 bg-green-100 rounded-full flex items-center justify-center mr-1">
                      <span className="block h-2 w-2 rounded-full bg-green-600"></span>
                    </div>
                    <span>Delivered on {formatDate(selectedGift.redeemedAt || selectedGift.createdAt)}</span>
                  </div>
                )}
              </div>
              
              {selectedGift.message && (
                <div className="p-4 bg-gray-50 rounded-md text-sm italic border border-gray-200">
                  "{selectedGift.message}"
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <DialogClose asChild>
                  <Button 
                    variant="default" 
                    className="px-8 bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    Close
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* VMB Tagline Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <div className="bg-pink-50 pt-5 pb-2.5 flex justify-center items-center">
          <div className="flex items-center gap-1.5 text-sm">
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
            <span>
              <span className="text-black font-semibold">Ven Me,</span>
              <span className="text-pink-600 italic font-semibold">Baby!</span>
              <span className="text-gray-600"> Make Connections Personal!</span>
            </span>
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
          </div>
        </div>
      </Card>
      
      <Accordion type="single" collapsible defaultValue="received" className="w-full">
        {hasReceivedGifts && (
          <AccordionItem value="received">
            <AccordionTrigger className="font-serif text-lg">
              Gifts You've Received
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  {receivedGifts?.filter(gift => gift.status === 'completed').length || 0} delivered gift(s)
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`text-xs ${showDelivered ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                  onClick={() => setShowDelivered(!showDelivered)}
                >
                  {showDelivered ? 'Hide Delivered' : 'Show Delivered'}
                </Button>
              </div>
              <div className="space-y-4">
                {receivedGifts
                  ?.filter(gift => showDelivered || gift.status !== 'completed')
                  .map((gift) => (
                  <Card key={gift.id} className="overflow-hidden">
                    <div className={`h-2 ${getStatusColor(gift.status)}`} />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">
                              {gift.styleName || 'Beauty Service'}
                              {' '}
                              <Badge variant={getStatusVariant(gift.status)}>
                                {getStatusText(gift.status)}
                              </Badge>
                            </h3>
                            {gift.status === 'completed' && (
                              <Badge variant="outline" className="ml-2 bg-blue-50 px-3 py-1">DELIVERED</Badge>
                            )}
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Gift className="h-4 w-4 mr-1" />
                              <span>From: {gift.senderName || 'Someone special'}</span>
                            </div>
                            {gift.salonName && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{gift.salonName}</span>
                              </div>
                            )}
                            {gift.message && (
                              <div className="mt-2 text-sm text-muted-foreground italic p-2 bg-muted rounded-md">
                                "{gift.message}"
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(gift.createdAt)}</span>
                          </div>
                          {gift.status === 'completed' && (
                            <div className="flex items-center text-sm text-green-600 mt-1">
                              <div className="flex-shrink-0 h-4 w-4 bg-green-100 rounded-full flex items-center justify-center mr-1">
                                <span className="block h-2 w-2 rounded-full bg-green-600"></span>
                              </div>
                              <span>Delivered on {formatDate(gift.redeemedAt || gift.createdAt)}</span>
                            </div>
                          )}
                          {(gift.status === 'completed' || gift.status === 'delivered') && (
                            <CardFooter className="px-0 pt-4 pb-0">
                              <Button 
                                variant="secondary" 
                                className="w-full bg-pink-200 hover:bg-pink-300 text-pink-800"
                                onClick={() => viewGiftDetails(gift)}
                              >
                                View Gift
                              </Button>
                            </CardFooter>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {hasSentGifts && (
          <AccordionItem value="sent">
            <AccordionTrigger className="font-serif text-lg">
              Gifts You've Sent
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {sentGifts?.map((gift) => (
                  <Card key={gift.id} className="overflow-hidden">
                    <div className={`h-2 ${getStatusColor(gift.status)}`} />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {gift.styleName || 'Beauty Service'}
                            {' '}
                            <Badge variant={getStatusVariant(gift.status)}>
                              {getStatusText(gift.status)}
                            </Badge>
                          </h3>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Gift className="h-4 w-4 mr-1" />
                              <span>To: {gift.recipientName}</span>
                            </div>
                            {gift.salonName && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{gift.salonName}</span>
                              </div>
                            )}
                            {gift.message && (
                              <div className="mt-2 text-sm text-muted-foreground italic p-2 bg-muted rounded-md">
                                "{gift.message}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'redeemed':
      return 'bg-green-500';
    case 'sent':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'delivered':
      return 'bg-blue-400';
    case 'expired':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'redeemed':
      return 'success' as const;
    case 'sent':
      return 'secondary' as const;
    case 'completed':
      return 'success' as const;
    case 'delivered':
      return 'secondary' as const;
    case 'expired':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'redeemed':
      return 'Redeemed';
    case 'sent':
      return 'Sent';
    case 'expired':
      return 'Expired';
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'delivered':
      return 'DELIVERED';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

// Format date helper function
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}