import React from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { SiZelle, SiVenmo, SiCashapp } from 'react-icons/si';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

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
  salonInitiated = false
}: RenderedInvitationProps) {
  const formattedInviteId = inviteId.startsWith('INV-FINAL-') ? inviteId : `INV-FINAL-${inviteId}`;
  
  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg overflow-hidden ${className}`}>
      <CardHeader className={`${salonInitiated ? 'bg-amber-100' : 'bg-pink-100'} pb-2`}>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">{salonName}</div>
          <div className="text-xs font-mono text-gray-600">{formattedInviteId}</div>
        </div>
        <h3 className={`text-xl font-semibold ${salonInitiated ? 'text-amber-800' : 'text-pink-800'} text-center mt-2`}>
          {salonInitiated ? "SALON INVITE" : "Ven Me, Baby! Gift Request"}
        </h3>
      </CardHeader>
      
      <div className={`p-1 bg-gradient-to-r ${salonInitiated 
        ? 'from-amber-300 via-orange-300 to-yellow-300' 
        : 'from-pink-300 via-purple-300 to-indigo-300'}`}></div>
      
      <CardContent className="p-4">
        <div className="mb-4">
          <AspectRatio ratio={4/3} className="bg-muted rounded-md overflow-hidden">
            <img 
              src={imageUrl} 
              alt={styleOption}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
        
        <div className="space-y-4">
          <div className="text-center italic text-gray-700 px-4">
            Hi <span className="font-semibold">{recipientName}</span>, I would love a fresh set. 
            My stylist has an opening for <span className="font-semibold">{styleOption}</span>, {price} ({time}) 
            will you Ven Me, Baby! ❤️❤️❤️ <span className="font-semibold">{senderName}</span>
          </div>
          
          <div className="flex justify-center space-x-4 mt-4">
            <Button className="bg-[#00D632] hover:bg-[#00B82D] text-white flex items-center space-x-2">
              <FaMoneyBillWave className="h-5 w-5" />
              <span>CashApp</span>
            </Button>
            <Button className="bg-[#3D95CE] hover:bg-[#3272A0] text-white flex items-center space-x-2">
              <FaMoneyBillWave className="h-5 w-5" />
              <span>Zelle</span>
            </Button>
            <Button className="bg-[#008CFF] hover:bg-[#0070CC] text-white flex items-center space-x-2">
              <FaMoneyBillWave className="h-5 w-5" />
              <span>Venmo</span>
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-3 text-center text-xs text-gray-500">
        This invitation created on {new Date().toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}