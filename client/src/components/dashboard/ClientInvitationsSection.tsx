import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import PendingSalonInvitations from "@/components/dashboard/PendingSalonInvitationsFixed";

interface ClientInvitationsSectionProps {
  clientId: number;
}

export default function ClientInvitationsSection({ clientId }: ClientInvitationsSectionProps) {
  const [showPendingInvitations, setShowPendingInvitations] = useState(true);

  console.log('[FLOW] ClientInvitationsSection mounted with clientId:', clientId);

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 pb-2 pt-2">
        <CardTitle className="text-base flex items-center justify-between gap-2 text-amber-700">
          <div className="flex items-center gap-2">
            <StarIcon className="h-4 w-4" />
            <span>Pending Invitations From Salons</span>
          </div>
          <button 
            onClick={() => setShowPendingInvitations(!showPendingInvitations)} 
            className="flex items-center text-sm text-amber-600 hover:text-amber-800"
            aria-label={showPendingInvitations ? "Hide pending invitations" : "Show pending invitations"}
          >
            {showPendingInvitations ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className={`pt-4 ${showPendingInvitations ? 'block' : 'hidden'}`}>
        <PendingSalonInvitations 
          clientId={clientId} 
          limit={5} 
        />
      </CardContent>
    </Card>
  );
}