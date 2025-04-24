import React from 'react';
import { MessageCircleIcon } from 'lucide-react';

interface RenderedInvitationProps {
  recipientName?: string;
  styleOption?: string;
  priceAndTime?: string;
  signature?: string;
  inviteId?: string;
  onVenSelected?: () => void;
  onCashAppSelected?: () => void;
  onZelleSelected?: () => void;
  onDecline?: () => void;
  onPass?: () => void;
}

export const RenderedInvitation: React.FC<RenderedInvitationProps> = ({
  recipientName = "[NAME]",
  styleOption = "[STY OPT]",
  priceAndTime = "[price and time]",
  signature = "[SIGNED]",
  inviteId = "[RANDOM ID]",
  onVenSelected,
  onCashAppSelected,
  onZelleSelected,
  onDecline,
  onPass
}) => {
  return (
    <div className="border-2 border-teal-600 rounded-md p-5 max-w-md mx-auto bg-white">
      <div className="flex items-start gap-2 mb-3">
        <MessageCircleIcon className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
        <div className="text-gray-800 leading-relaxed">
          <p>
            Hi <span className="font-semibold">{recipientName}</span>, I would love a fresh set. My stylist has an opening for a <span className="font-semibold">{styleOption}</span>, {priceAndTime}
          </p>
          <p>will you Ven Me, Baby! <span className="text-red-500">❤️ ❤️ ❤️</span> <span className="font-semibold">{signature}</span></p>
        </div>
      </div>

      <div className="text-center my-3 text-sm">
        Your VMB gift has a unique ID: <span className="font-bold text-pink-600">VMB-{inviteId}</span>
      </div>

      <div className="space-y-2 mt-4">
        {/* Payment option buttons in first row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button 
            className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded border border-green-200 transition-colors"
            onClick={onVenSelected}
          >
            VEN
          </button>
          <button 
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded border border-blue-200 transition-colors"
            onClick={onCashAppSelected}
          >
            C app
          </button>
          <button 
            className="bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-3 rounded border border-orange-200 transition-colors"
            onClick={onZelleSelected}
          >
            Zel
          </button>
        </div>

        {/* Response buttons in second row */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded border border-red-200 transition-colors"
            onClick={onPass}
          >
            Pass
          </button>
          <button 
            className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded border border-green-200 transition-colors"
            onClick={onDecline}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};