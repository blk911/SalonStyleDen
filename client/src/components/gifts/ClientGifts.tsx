import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, MapPin, HeartIcon } from 'lucide-react';
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
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  // Fetch received gifts
  const { data: receivedGifts, isLoading: isLoadingReceived } = useQuery({
    queryKey: [`/api/clients/${clientId}/gifts/received`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/gifts/received`);
      if (!response.ok) {
        throw new Error('Failed to fetch received gifts');
      }
      return response.json() as Promise<Gift[]>;
    }
  });

  // Fetch sent gifts
  const { data: sentGifts, isLoading: isLoadingSent } = useQuery({
    queryKey: [`/api/clients/${clientId}/gifts/sent`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/gifts/sent`);
      if (!response.ok) {
        throw new Error('Failed to fetch sent gifts');
      }
      return response.json() as Promise<Gift[]>;
    }
  });

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
              <div className="space-y-4">
                {receivedGifts?.map((gift) => (
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
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}