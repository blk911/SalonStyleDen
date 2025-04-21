import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserIcon, CalendarIcon, CheckIcon, ClockIcon } from "lucide-react";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  type?: string | null;
  salonId: number | null;
  senderId?: number | null;
  sponsor: string | null;
  status: string;
  inviteHash: string;
  createdAt: string;
  firstServiceDate?: string;
}

interface InlineVmbInvitationsProps {
  clientId?: number;
  salonId?: number;
  limit?: number;
}

export default function InlineVmbInvitations({ 
  clientId, 
  salonId, 
  limit = 10
}: InlineVmbInvitationsProps) {
  const filterParams = new URLSearchParams();
  if (limit) filterParams.set('limit', limit.toString());
  if (clientId) filterParams.set('clientId', clientId.toString());
  if (salonId) filterParams.set('salonId', salonId.toString());
  
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['/api/invitations', clientId, salonId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/invitations?${filterParams}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Invitation[]>;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card className="p-4 bg-pink-50 border-pink-100">
        <p className="text-gray-500 italic text-center text-sm">
          No VMB salon invitations have been sent yet.
        </p>
      </Card>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: '2-digit',
      year: '2-digit' 
    }).format(date);
  };

  // Get status color
  const getStatusStyles = (status: string) => {
    switch(status.toLowerCase()) {
      case 'accepted':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {invitations.map(invitation => {
        const statusStyles = getStatusStyles(invitation.status);
        
        return (
          <Card key={invitation.id} className="border border-pink-100">
            <CardContent className="p-3">
              <div className="flex flex-row justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-pink-500" />
                  <span className="font-medium">{invitation.name}</span>
                </div>
                <Badge className={`${statusStyles.bg} ${statusStyles.text}`}>
                  {invitation.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  <span>Invited: {formatDate(invitation.createdAt)}</span>
                </div>
                
                {invitation.firstServiceDate && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>Appt: {formatDate(invitation.firstServiceDate)}</span>
                  </div>
                )}
                
                {invitation.status === 'accepted' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckIcon className="h-3 w-3" />
                    <span>Accepted</span>
                  </div>
                )}
              </div>
              
              {invitation.sponsor && (
                <div className="text-xs text-gray-500 mt-1">
                  <span>Sponsored by: {invitation.sponsor}</span>
                </div>
              )}
              
              {invitation.message && (
                <div className="text-xs italic text-gray-600 mt-2 border-t border-gray-100 pt-1">
                  "{invitation.message}"
                </div>
              )}
              
              {invitation.type === 'client_invitation' && (
                <div className="text-xs text-blue-500 mt-0.5">
                  <span>Client referral</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}