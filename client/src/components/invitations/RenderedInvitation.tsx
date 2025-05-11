/**
 * RenderedInvitation Component
 * 
 * ✅ WORKS EXACTLY AS INTENDED
 * 🚫 DO NOT MODIFY WITHOUT FULL RETEST
 * 
 * This component is a key part of the invitation system, rendering both salon-initiated
 * and client-initiated invitations with the correct styling and action handlers.
 * It is used in multiple places including invitation previews and dashboard views.
 */

import React, { useEffect, useState } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { SiZelle, SiVenmo, SiCashapp } from 'react-icons/si';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Extend the Window interface to add our client ID context
declare global {
  interface Window {
    _currentClientId?: string | number | null;
  }
}

interface RenderedInvitationProps {
  inviteId: string;
  recipientName: string;
  styleOption: string;
  price?: string;
  time?: string;
  senderName: string;
  salonName?: string;
  imageUrl?: string;
  className?: string;
  salonInitiated?: boolean; // To identify salon-initiated invitations
  onSendGift?: () => void; // Handler for the SEND GIFT button click
  status?: string; // Invitation status: pending, sent, accepted, etc.
  message?: string; // The gift message content
}

export function RenderedInvitation({
  inviteId,
  recipientName,
  styleOption,
  price = "$45",
  time = "30 min",
  senderName,
  salonName = "Tiffany 5280 Nails Studio",
  imageUrl = "/assets/french-tips.png",
  className = "",
  salonInitiated = false,
  onSendGift,
  status = "pending",
  message
}: RenderedInvitationProps) {
  const formattedInviteId = inviteId.startsWith('INV-FINAL-') ? inviteId : `INV-FINAL-${inviteId}`;
  const [currentClientId, setCurrentClientId] = useState<string | number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check URL for source parameter
  const urlParams = new URLSearchParams(window.location.search);
  const sourceDashboard = urlParams.get('source');
  
  // Get the current client ID from the global window object
  useEffect(() => {
    // Try to get client ID from global window object
    const clientId = window._currentClientId || null;
    setCurrentClientId(clientId);
    
    // For debugging: log the client ID context
    console.log(`[FLOW] RenderedInvitation - Current client ID context: ${clientId || 'Not set'}`);
  }, []);
  
  // Keep local status in sync with prop status
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);
  
  // Function to handle appointment confirmation button click
  const handleConfirmClick = () => {
    setShowConfirmDialog(true);
  };
  
  // Function to confirm and complete the invitation
  const handleConfirmInvitation = async () => {
    setIsProcessing(true);
    
    try {
      // Extract invitation ID from URL
      const urlParts = window.location.pathname.split('/');
      const invitationHash = urlParts[urlParts.length - 1];
      
      // First, get the numeric ID from the hash
      const inviteResponse = await fetch(`/api/invitations/by-hash/${invitationHash}`);
      if (!inviteResponse.ok) {
        throw new Error('Failed to find invitation');
      }
      
      const inviteData = await inviteResponse.json();
      const numericId = inviteData.id;
      
      // Update the invitation status to "completed" 
      const response = await fetch(`/api/invitations/${numericId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      if (response.ok) {
        // Update local status immediately to show the status change
        setLocalStatus('completed');
        
        // Log the completion for analytics
        try {
          // Get the client ID from context or invitation data
          // Extract the salon ID from the invitation data
          await fetch('/api/activity-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: salonInitiated ? 'appointment_confirmed' : 'gift_accepted',
              description: salonInitiated 
                ? `Appointment for invitation #${numericId} confirmed by ${recipientName}`
                : `Gift invitation #${numericId} accepted by ${recipientName}`,
              clientId: inviteData.clientId, // Use actual client ID from invitation data
              salonId: inviteData.salonId, // Use actual salon ID from invitation data
              timestamp: new Date()
            }),
          });
        } catch (logError) {
          console.error('Failed to log activity:', logError);
        }
        
        toast({
          title: salonInitiated ? "Appointment Confirmed" : "Gift Accepted",
          description: salonInitiated 
            ? "Your appointment has been confirmed! You're all set."
            : "You've accepted the gift! Now you can schedule your appointment."
        });
        
        // Navigate to client dashboard after a short delay to show the toast
        setTimeout(() => {
          setLocation('/client-dashboard?tab=appointments');
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to complete the process. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error completing invitation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };
  
  // SITE-WIDE CRITICAL RULE - UPDATED: 
  // The SEND GIFT button should ONLY appear when ALL conditions are met:
  // 1. We're NOT in preview mode (currentClientId must be set)
  // 2. The invitation status is 'pending'
  // 3. There is a valid onSendGift handler
  // 4. This is NOT a salon-initiated invitation
  // 5. The client is viewing their own invitation (sourceDashboard === 'client')
  
  const isInPreviewMode = !currentClientId;
  const isClientViewingOwnInvitation = currentClientId === recipientName || sourceDashboard === 'client';
  const hasValidSendGiftHandler = Boolean(onSendGift);
  const isPendingStatus = status === 'pending';
  
  // Use localStatus consistently for button logic instead of status
  const isPendingLocalStatus = localStatus === 'pending';
  
  // NEW CASE: Detect when a client is viewing their OWN salon invitation (recipient is self)
  // This is the special case where we show the CONFIRM APPOINTMENT or ACCEPT GIFT button
  const isRecipientViewingSelfInvitation = currentClientId && 
                                         recipientName === currentClientId && 
                                         isPendingLocalStatus; // Use localStatus here
  
  // CRITICAL RULE: Only show the SEND GIFT button when the invitation recipient
  // is viewing their own invitation from the Client Dashboard
  const showButton = !isInPreviewMode && 
                     isClientViewingOwnInvitation && 
                     hasValidSendGiftHandler && 
                     isPendingLocalStatus && // Use localStatus here
                     !salonInitiated &&
                     sourceDashboard === 'client'; // Only show when viewed from client dashboard
  
  // NEW CASE: Determine if we should show the ACCEPT GIFT button for client 
  // or CONFIRM APPOINTMENT for salon-initiated invitations
  const showConfirmButton = !isInPreviewMode && 
                       isPendingLocalStatus && // Use localStatus here
                       isRecipientViewingSelfInvitation;
  
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`[RenderedInvitation] Rendering invitation for ${recipientName} - Status: ${localStatus} - Actions: ${showButton ? 'Send Gift' : ''}${showConfirmButton ? 'Confirm' : ''}`);
  }
  
  return (
    <>
      <Card className={`w-full max-w-md mx-auto shadow-lg overflow-hidden ${className}`}>
        <CardHeader className={`${salonInitiated ? 'bg-amber-50 border-b border-amber-200' : 'bg-pink-100'} pb-2`}>
          {salonInitiated ? (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-purple-700 w-24">Gift Request to:</span>
                <span className="text-sm font-medium text-gray-800">{recipientName}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-purple-700 w-24">Sent from:</span>
                <span className="text-sm font-medium text-gray-800">{salonName}</span>
              </div>
              <div className="flex justify-end">
                <div className="text-xs font-mono text-gray-500">{formattedInviteId}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-purple-700 w-24">Gift Request to:</span>
                  <span className="text-sm font-medium text-gray-800">{recipientName}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-purple-700 w-24">Sent from:</span>
                  <span className="text-sm font-medium text-gray-800">{senderName}</span>
                </div>
                <div className="flex justify-between">
                  <div className="text-xs text-gray-500">{salonName}</div>
                  <div className="text-xs font-mono text-gray-500">{formattedInviteId}</div>
                </div>
              </div>
            </>
          )}
        </CardHeader>
        
        {/* Gradient bar under header (keep this for styling) */}
        <div className={`p-1 bg-gradient-to-r ${salonInitiated 
          ? 'from-amber-300 via-orange-300 to-yellow-300' 
          : 'from-pink-300 via-purple-300 to-indigo-300'}`}></div>
        
        <CardContent className="p-4">
          <div className="mb-4">
            {/* Set fixed height of 120px while maintaining proper aspect ratio */}
            <div className="rounded-md overflow-hidden shadow-md bg-muted h-[120px] flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt={styleOption}
                className="object-contain h-full max-w-full"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className={`text-center italic text-gray-700 px-4 ${salonInitiated ? 'text-sm' : ''}`}>
              {message ? (
                /* For client-sent gifts, show the actual message */
                <div className="whitespace-pre-line">{message}</div>
              ) : salonInitiated ? (
                /* For salon-initiated invitations, show the default salon message */
                <>
                  Hi <span className="font-semibold">{recipientName}</span>, We are joining Ven Me, Baby! VMB fits today's lifestyle. It's direct, it's easy. You choose your {styleOption ? <span className="font-semibold">{styleOption}</span> : "style"}, send your gift request. It's a powerful way to connect on a personal level. Check out the samples, and REGISTER!! Become a Ven Me, Baby!
                  
                  <div className="text-center mt-1">❤️❤️❤️</div>
                  
                  {salonInitiated && (
                    <div className="flex justify-center mt-2 mb-2">
                      {localStatus === 'sent' || localStatus === 'accepted' || localStatus === 'redeemed' || localStatus === 'completed' ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="px-3 py-0.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded flex items-center">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                            {localStatus === 'sent' ? 'GIFT SENT' : 
                             localStatus === 'accepted' ? 'GIFT ACCEPTED' : 
                             localStatus === 'redeemed' ? 'GIFT REDEEMED' : 
                             'COMPLETED'}
                          </div>
                          
                          {/* For completed invitations, show a Schedule button if viewing from client dashboard */}
                          {(localStatus === 'completed' || localStatus === 'redeemed') && 
                           sourceDashboard === 'client' && 
                           !isInPreviewMode && (
                            <Button 
                              className="w-full bg-primary hover:bg-primary/80 text-white flex items-center justify-center gap-2"
                              onClick={() => {
                                setLocation('/client-dashboard?tab=appointments');
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                              Schedule Appointment
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* SPECIAL CASE: Show ACCEPT GIFT or CONFIRM APPT button based on invitation type */}
                          {showConfirmButton ? (
                            <Button 
                              className="h-10 px-4 py-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-medium"
                              onClick={handleConfirmClick}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : salonInitiated ? 'CONFIRM APPT' : 'ACCEPT GIFT'}
                            </Button>
                          ) : showButton ? (
                            <Button 
                              className="h-10 px-4 py-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium"
                              onClick={onSendGift}
                            >
                              SEND GIFT
                            </Button>
                          ) : (
                            <div className="h-10 px-4 py-2 w-full flex items-center justify-center text-sm font-medium rounded-md bg-gray-200 text-gray-600">
                              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                              GIFT UNAVAILABLE
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  Hi <span className="font-semibold">{recipientName}</span>, I would love a fresh set. 
                  My stylist has an opening for <span className="font-semibold">{styleOption}</span>, {price} ({time}) 
                  will you Ven Me, Baby! ❤️❤️❤️ <span className="font-semibold">{senderName}</span>

                  {/* Display status indicators and buttons for client-initiated invitations too */}
                  <div className="flex justify-center mt-3 mb-2">
                    {localStatus === 'sent' || localStatus === 'accepted' || localStatus === 'redeemed' || localStatus === 'completed' ? (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="px-3 py-0.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded flex items-center">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                          {localStatus === 'sent' ? 'GIFT SENT' : 
                           localStatus === 'accepted' ? 'GIFT ACCEPTED' : 
                           localStatus === 'redeemed' ? 'GIFT REDEEMED' : 
                           'COMPLETED'}
                        </div>
                        
                        {/* For completed invitations, show a Schedule button if viewing from client dashboard */}
                        {(localStatus === 'completed' || localStatus === 'redeemed') && 
                         sourceDashboard === 'client' && 
                         !isInPreviewMode && (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/80 text-white flex items-center justify-center gap-2"
                            onClick={() => {
                              setLocation('/client-dashboard?tab=appointments');
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                            Schedule Appointment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* SPECIAL CASE: Show ACCEPT GIFT button */}
                        {showConfirmButton ? (
                          <Button 
                            className="h-10 px-4 py-2 w-full bg-pink-500 hover:bg-pink-600 text-white font-medium"
                            onClick={handleConfirmClick}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : 'ACCEPT GIFT'}
                          </Button>
                        ) : showButton ? (
                          <Button 
                            className="h-10 px-4 py-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium"
                            onClick={onSendGift}
                          >
                            SEND GIFT
                          </Button>
                        ) : (
                          <div className="h-10 px-4 py-2 w-full flex items-center justify-center text-sm font-medium rounded-md bg-gray-200 text-gray-600">
                            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                            GIFT UNAVAILABLE
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-3 text-center text-xs text-gray-500">
          This invitation created on {new Date().toLocaleDateString()}
        </CardFooter>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {salonInitiated ? (
                <>
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Confirm Your Appointment
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-pink-500" />
                  Accept Gift Invitation
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {salonInitiated ? 
                `You're about to confirm your booking for ${styleOption || "a service"} at ${salonName}.` : 
                `You're about to accept a gift for ${styleOption || "a service"} from ${senderName}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className={`${salonInitiated ? 'bg-amber-50 border-amber-200' : 'bg-pink-50 border-pink-200'} p-3 rounded-md border`}>
                <h4 className={`font-medium ${salonInitiated ? 'text-amber-800' : 'text-pink-800'} flex items-center gap-2`}>
                  <ShoppingBag className="h-4 w-4" />
                  {salonInitiated ? 'Appointment Details' : 'Gift Details'}
                </h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{styleOption || "Standard Service"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">{price}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{time}</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500">
                {salonInitiated ? 
                  'By clicking confirm, you agree to schedule this service at the salon.' : 
                  'By accepting this gift, you will be able to schedule an appointment for this service at the salon.'}
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmInvitation}
              className={`${salonInitiated ? 'bg-amber-500 hover:bg-amber-600' : 'bg-pink-500 hover:bg-pink-600'} text-white`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="mr-2">Processing</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {salonInitiated ? 'Confirm Appointment' : 'Accept Gift'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}