import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, XCircleIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { processApiUrl } from "@/lib/utils";

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
}

interface RecentVmbInvitationsProps {
  clientId?: number;
  salonId?: number;
  limit?: number;
}

export default function RecentVmbInvitations({ 
  clientId, 
  salonId, 
  limit = 10
}: RecentVmbInvitationsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const filterParams = new URLSearchParams();
  if (limit) filterParams.set('limit', limit.toString());
  if (clientId) filterParams.set('clientId', clientId.toString());
  if (salonId) filterParams.set('salonId', salonId.toString());
  
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['/api/invitations', clientId, salonId, limit],
    queryFn: async () => {
      const response = await fetch(processApiUrl(`/api/invitations?${filterParams}`));
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Invitation[]>;
    }
  });
  
  // Mutation for cancelling an invitation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(processApiUrl(`/api/invitations/${invitationId}/cancel`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel invitation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Show success message
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been successfully cancelled.",
        variant: "default" // Using default since "success" is not in the available variants
      });
      
      // Invalidate and refetch the invitations query to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: Error) => {
      // Show error message
      toast({
        title: "Cancellation Failed",
        description: error.message || "There was an error cancelling the invitation.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 italic text-center">
          No VMB salon invitations have been sent yet.
        </p>
      </Card>
    );
  }

  // All invitations are pre-filtered by salonId on the server side
  // No need to group by sponsor anymore as we only have one salon's invitations

  // Format phone number for display
  const formatPhone = (phone: string) => {
    return "512-555•••";
  };

  return (
    <div>
      {/* Salon Invitations */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">VMB Salon Invitations</h2>
        
        <div className="w-full border rounded-md overflow-x-auto">
          {invitations && invitations.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Name</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Email</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Phone</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Status</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Type</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Date</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-center text-xs sm:text-sm">Actions</th>
                  <th className="py-2 px-2 sm:px-4 font-medium text-right text-xs sm:text-sm">Page</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(invitation => (
                  <tr key={invitation.id} className="border-b">
                    <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{invitation.name}</td>
                    <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{invitation.email}</td>
                    <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">{formatPhone(invitation.phone)}</td>
                    <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">
                      <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap
                        ${invitation.status.toLowerCase() === 'complete' ? 'bg-emerald-100 text-emerald-700' : 
                          invitation.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                          invitation.status.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'}`
                      }>
                        {invitation.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">
                      {invitation.type === 'client_invitation' ? (
                        <span className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          Client
                        </span>
                      ) : (
                        <span className="px-1 sm:px-2 py-0.5 sm:py-1 bg-pink-50 text-pink-700 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          Salon
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                      {new Date(invitation.createdAt).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-2 sm:px-4 text-center text-xs sm:text-sm">
                      {/* Only show CANCEL button for pending invitations */}
                      {invitation.status.toLowerCase() === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 hover:border-red-300 px-2 py-0 h-auto text-xs flex items-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Confirm before cancelling
                            if (window.confirm(`Are you sure you want to cancel this invitation to ${invitation.name}? This action cannot be undone.`)) {
                              cancelInvitationMutation.mutate(invitation.id);
                            }
                          }}
                          disabled={cancelInvitationMutation.isPending}
                        >
                          {cancelInvitationMutation.isPending ? (
                            <>
                              <span className="animate-spin">↻</span> Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-3 w-3" /> CANCEL
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                    <td className="py-2 px-2 sm:px-4 text-right text-xs sm:text-sm">
                      <Link 
                        to={`/client/${invitation.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          // Check if the invitation is associated with an existing client
                          fetch(processApiUrl(`/api/clients/by-invitation/${invitation.id}`))
                            .then(res => {
                              if (res.ok) {
                                // If client exists, go to their dashboard
                                return res.json().then(client => {
                                  setLocation(`/client/${client.id}`);
                                });
                              } else {
                                // If no client exists, go directly to invitation-based dashboard
                                setLocation(`/client/${invitation.id}`); 
                              }
                            })
                            .catch(err => {
                              console.error("Error checking client:", err);
                              // Fallback to invitation-based dashboard
                              setLocation(`/client/${invitation.id}`);
                            });
                        }}
                        className="inline-flex items-center text-pink-600 font-medium gap-1 text-xs sm:text-sm hover:text-pink-800 cursor-pointer whitespace-nowrap"
                      >
                        <ExternalLinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        {invitation.status.toLowerCase() === 'complete' ? `View Client` : 'View Dashboard'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500 italic">
              No VMB salon invitations have been sent yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
