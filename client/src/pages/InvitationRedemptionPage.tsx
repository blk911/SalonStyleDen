import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RenderedInvitation } from '@/components/invitations/RenderedInvitation';
import { SimplePhoneInput } from '@/components/redemption/SimplePhoneInput';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber, cleanPhoneNumber } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Gift, Users, ArrowRight } from 'lucide-react';

// Types for invitation and gift data
interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string;
  type?: string;
  salonId?: number;
  salonName?: string;
  sponsor?: string;
  inviteHash: string;
  status: string;
  createdAt: string;
  senderId?: number;
  favoriteServices?: string[];
  styleOption?: string;
  stylePrice?: string;
  styleDuration?: string;
}

interface Gift {
  id: number;
  senderId: number;
  senderName?: string;
  recipientName: string;
  recipientPhone: string;
  message?: string;
  status: string;
  styleName?: string;
  stylePrice?: string;
}

interface RedemptionResult {
  success: boolean;
  message: string;
  hasPendingInvitation?: boolean;
  invitation?: Invitation;
  hasUnredeemedGift?: boolean;
  gift?: Gift;
}

export default function InvitationRedemptionPage() {
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [, setLocation] = useLocation();

  // Submit handler for phone input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneValid) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitted(true);

    try {
      // Call the validate-contact endpoint with 'redemption' context
      const cleanedPhone = cleanPhoneNumber(phone);
      const response = await fetch('/api/validate-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanedPhone,
          context: 'redemption',
        }),
      });

      if (!response.ok) {
        throw new Error(`Error validating phone: ${response.status}`);
      }

      const data = await response.json();
      console.log('Redemption check response:', data);
      setRedemptionResult(data);
    } catch (error) {
      console.error('Error checking phone for invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to check your phone number. Please try again.',
        variant: 'destructive',
      });
      setRedemptionResult({
        success: false,
        message: 'An error occurred while checking for invitations.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle phone input validation
  const handlePhoneValidation = (isValid: boolean, phoneValue?: string) => {
    setPhoneValid(isValid);
    if (phoneValue) {
      setPhone(phoneValue);
    }
  };

  // Handle accept invitation
  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setShowAcceptDialog(false);
    
    try {
      if (!redemptionResult) return;
      
      // If we have an invitation, update its status to accepted
      if (redemptionResult.hasPendingInvitation && redemptionResult.invitation) {
        const invitation = redemptionResult.invitation;
        const response = await fetch(`/api/invitations/${invitation.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'accepted' }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to accept invitation: ${response.status}`);
        }
        
        toast({
          title: 'Invitation Accepted',
          description: 'Your invitation has been accepted. Complete registration to claim it.',
        });
        
        // Redirect to registration page with invitation data
        setLocation(`/client/register?invitationId=${invitation.id}&salonId=${invitation.salonId || 1}`);
      } 
      // If we have a gift, update its status to accepted
      else if (redemptionResult.hasUnredeemedGift && redemptionResult.gift) {
        const gift = redemptionResult.gift;
        const response = await fetch(`/api/gifts/${gift.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'accepted' }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to accept gift: ${response.status}`);
        }
        
        toast({
          title: 'Gift Accepted',
          description: 'Your gift has been accepted. Complete registration to claim it.',
        });
        
        // Redirect to registration page with gift data
        setLocation(`/client/register?giftId=${gift.id}&senderId=${gift.senderId || 0}`);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept the invitation/gift. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {!submitted ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Check for Invitations</CardTitle>
              <CardDescription>
                Enter your phone number to see if you have any pending invitations or gifts.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <div className="space-y-4">
                  <SimplePhoneInput
                    name="phone"
                    label="Your Phone Number"
                    description="Enter the phone number where you received an invitation or gift."
                    onChange={handlePhoneValidation}
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={!phoneValid || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Checking...' : 'Check for Invitations'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <>
            {redemptionResult?.success ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="bg-pink-50">
                    <CardTitle>Welcome, {redemptionResult.invitation?.name || redemptionResult.gift?.recipientName || 'Guest'}!</CardTitle>
                    <CardDescription>
                      Complete your registration to access your dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/2">
                        <h3 className="text-lg font-medium mb-4 text-pink-700">
                          {redemptionResult.hasPendingInvitation ? 'Your Invitation' : 'Your Gift'}
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <p className="text-sm text-gray-600 mr-2">From:</p>
                            <p className="text-sm font-medium">
                              {redemptionResult.invitation?.sponsor || 
                               redemptionResult.invitation?.salonName || 
                               redemptionResult.gift?.senderName || 
                               'Tiffany 5280 Nails Studio'}
                            </p>
                          </div>
                          
                          <div className="flex items-center">
                            <p className="text-sm text-gray-600 mr-2">Status:</p>
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Pending
                            </span>
                          </div>
                          
                          {(redemptionResult.invitation?.styleOption || redemptionResult.gift?.styleName) && (
                            <div className="flex items-center">
                              <p className="text-sm text-gray-600 mr-2">Style:</p>
                              <p className="text-sm font-medium">
                                {redemptionResult.invitation?.styleOption || redemptionResult.gift?.styleName}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-2 mt-4">
                            <Button 
                              onClick={() => setShowAcceptDialog(true)}
                              className="w-full bg-pink-600 hover:bg-pink-700"
                            >
                              Accept {redemptionResult.hasPendingInvitation ? 'Invitation' : 'Gift'}
                            </Button>
                            
                            <Button 
                              variant="outline"
                              onClick={() => setSubmitted(false)}
                              className="w-full"
                            >
                              Try Different Phone
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-1/2">
                        {/* Render the full invitation */}
                        {redemptionResult.hasPendingInvitation && redemptionResult.invitation && (
                          <RenderedInvitation
                            inviteId={redemptionResult.invitation.inviteHash}
                            recipientName={redemptionResult.invitation.name}
                            styleOption={redemptionResult.invitation.styleOption || 'Acrylics'}
                            price={redemptionResult.invitation.stylePrice || '$45'}
                            time={redemptionResult.invitation.styleDuration || '30 min'}
                            senderName={redemptionResult.invitation.sponsor || 'Tiffany 5280 Nails Studio'}
                            salonName={redemptionResult.invitation.salonName || 'Tiffany 5280 Nails Studio'}
                            salonInitiated={!redemptionResult.invitation.senderId}
                            status={redemptionResult.invitation.status}
                            message={redemptionResult.invitation.message}
                          />
                        )}
                        
                        {/* If it's a gift, render the gift display */}
                        {redemptionResult.hasUnredeemedGift && redemptionResult.gift && (
                          <Card className="shadow-lg rounded-md overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 text-center py-3">
                              <CardTitle className="text-xl font-semibold text-white">
                                Gift for You!
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="text-center space-y-4">
                                <Gift className="w-16 h-16 mx-auto text-pink-500" />
                                <p className="text-lg font-medium">
                                  {redemptionResult.gift.message || `You have received a gift for ${redemptionResult.gift.styleName || 'nail services'}`}
                                </p>
                                <p className="text-gray-600">
                                  From: {redemptionResult.gift.senderName || 'A Friend'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>No Invitations Found</CardTitle>
                  <CardDescription>
                    We couldn't find any pending invitations or gifts for {formatPhoneNumber(phone)}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-6">
                    {redemptionResult?.message || 'No pending invitations or gifts found for this phone number.'}
                  </p>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setSubmitted(false)}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/client/register')}
                      className="w-full"
                    >
                      Register New Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      
      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CONFIRM AND ACCEPT GIFT</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this {redemptionResult?.hasPendingInvitation ? 'invitation' : 'gift'}? 
              You will need to complete registration to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
            >
              {isAccepting ? 'Processing...' : 'YES, ACCEPT GIFT NOW!'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}