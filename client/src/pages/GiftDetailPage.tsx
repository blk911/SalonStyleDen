import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Calendar, DollarSign, Mail, MessageSquare, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface Gift {
  id: number;
  status: string;
  senderId: number;
  senderName?: string;
  recipientId?: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  message?: string;
  amount: number;
  createdAt: string;
  redeemedAt?: string;
  expiresAt?: string;
}

const GiftDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const giftId = parseInt(id);
  
  // Fetch gift details
  const { data: gift, isLoading, error } = useQuery<Gift>({
    queryKey: ['/api/gifts', giftId],
    enabled: !isNaN(giftId),
  });

  // Fetch sender details
  const { data: sender } = useQuery({
    queryKey: ['/api/clients', gift?.senderId],
    enabled: !!gift?.senderId,
  });

  // Fetch recipient details if available
  const { data: recipient } = useQuery({
    queryKey: ['/api/clients', gift?.recipientId],
    enabled: !!gift?.recipientId,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading gift details",
        description: "There was a problem loading the gift information",
        variant: "destructive",
      });
    }
  }, [error]);

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gift && !isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Gift Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg text-gray-500">
              The gift you're looking for could not be found or may have been deleted.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/admin">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Gift Details</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gift #{gift?.id}</CardTitle>
            <Badge className={
              gift?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              gift?.status === 'redeemed' ? 'bg-green-100 text-green-800' :
              gift?.status === 'expired' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }>
              {gift?.status?.charAt(0).toUpperCase() + gift?.status?.slice(1)}
            </Badge>
          </div>
          <CardDescription>
            Created on {gift?.createdAt ? formatDate(gift.createdAt) : 'Unknown date'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Gift Amount */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <DollarSign className="h-10 w-10 text-green-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Gift Amount</p>
              <p className="text-2xl font-bold">{gift?.amount ? formatCurrency(gift.amount) : '$0.00'}</p>
            </div>
          </div>

          {/* Sender & Recipient Information */}
          <div>
            <h3 className="font-medium text-lg mb-4">Gift Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sender Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium flex items-center text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-1" /> From
                </h4>
                <div className="space-y-2">
                  <p className="font-bold">{gift?.senderName || 'Unknown Sender'}</p>
                  {sender && (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{sender.phone || 'No phone'}</span>
                      </div>
                      {sender.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          <span>{sender.email}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/client/${gift?.senderId}`}>View Sender Profile</Link>
                  </Button>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium flex items-center text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-1" /> To
                </h4>
                <div className="space-y-2">
                  <p className="font-bold">
                    {gift?.recipientName || 'Unnamed Recipient'}
                    {!gift?.recipientId && <Badge variant="outline" className="ml-2">Not Claimed</Badge>}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{gift?.recipientPhone || 'No phone'}</span>
                  </div>
                  {gift?.recipientEmail && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-3 w-3 mr-1" />
                      <span>{gift.recipientEmail}</span>
                    </div>
                  )}
                  {gift?.recipientId && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/client/${gift.recipientId}`}>View Recipient Profile</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gift Message */}
          {gift?.message && (
            <div>
              <h3 className="font-medium text-lg mb-2">Gift Message</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <MessageSquare className="h-5 w-5 text-gray-500 mr-2 mt-1" />
                  <div className="italic text-gray-700">{gift.message}</div>
                </div>
              </div>
            </div>
          )}

          {/* Gift Status Timeline */}
          <div>
            <h3 className="font-medium text-lg mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Gift Created</p>
                  <p className="text-sm text-gray-500">{gift?.createdAt ? formatDate(gift.createdAt) : 'Unknown'}</p>
                </div>
              </div>

              {gift?.redeemedAt && (
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Gift Redeemed</p>
                    <p className="text-sm text-gray-500">{formatDate(gift.redeemedAt)}</p>
                  </div>
                </div>
              )}

              {gift?.expiresAt && (
                <div className="flex items-start">
                  <div className={`${new Date(gift.expiresAt) < new Date() ? 'bg-red-100' : 'bg-yellow-100'} rounded-full p-2 mr-3`}>
                    <Calendar className={`h-4 w-4 ${new Date(gift.expiresAt) < new Date() ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{new Date(gift.expiresAt) < new Date() ? 'Gift Expired' : 'Gift Expires'}</p>
                    <p className="text-sm text-gray-500">{formatDate(gift.expiresAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" asChild>
            <Link href="/admin">Return to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GiftDetailPage;