import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ExternalLinkIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
                    <td className="py-2 px-2 sm:px-4 text-right text-xs sm:text-sm">
                      <Link 
                        to={`/client/${invitation.senderId || ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          // If we have a senderId, use it to navigate to the client's dashboard
                          if (invitation.senderId) {
                            console.log(`Navigating to client dashboard for sender ID: ${invitation.senderId}`);
                            setLocation(`/client/${invitation.senderId}`);
                          } else {
                            // Fallback to checking if the invitation is associated with a client
                            console.log(`Checking client by invitation ID: ${invitation.id}`);
                            fetch(`/api/clients/by-invitation/${invitation.id}`)
                              .then(res => {
                                if (res.ok) {
                                  // If client exists, go to their dashboard
                                  return res.json().then(client => {
                                    console.log(`Found client ID: ${client.id} for invitation: ${invitation.id}`);
                                    setLocation(`/client/${client.id}`);
                                  });
                                } else {
                                  // Try by phone number first
                                  console.log(`No client found by invitation ID: ${invitation.id}, trying by phone: ${invitation.phone}`);
                                  
                                  // Clean phone number (remove non-digits)
                                  const cleanPhone = invitation.phone.replace(/\D/g, '');
                                  
                                  fetch(`/api/clients/by-phone/${cleanPhone}`)
                                    .then(phoneRes => {
                                      if (phoneRes.ok) {
                                        return phoneRes.json().then(client => {
                                          console.log(`Found client by phone: ${client.id}`);
                                          setLocation(`/client/${client.id}`);
                                        });
                                      } else {
                                        // Last resort - if no client exists by phone, try navigating by name
                                        console.log(`No client found by phone: ${cleanPhone}, trying by name: ${invitation.name}`);
                                        fetch(`/api/clients/by-name/${encodeURIComponent(invitation.name)}`)
                                          .then(nameRes => {
                                            if (nameRes.ok) {
                                              return nameRes.json().then(client => {
                                                console.log(`Found client by name: ${client.id}`);
                                                setLocation(`/client/${client.id}`);
                                              });
                                            } else {
                                              console.error("No client found for this invitation.");
                                              // No client found at all, stay on current page
                                              toast({
                                                title: "Client not found",
                                                description: "Cannot locate this client's dashboard.",
                                                variant: "destructive"
                                              });
                                            }
                                          });
                                      }
                                    })
                                    .catch(err => {
                                      console.error("Error finding client by name:", err);
                                    });
                                }
                              })
                              .catch(err => {
                                console.error("Error checking client:", err);
                              });
                          }
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