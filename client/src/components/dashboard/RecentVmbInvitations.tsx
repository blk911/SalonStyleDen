import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLinkIcon } from "lucide-react";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  salonId: number | null;
  salonName?: string;
  sponsor: string | null;
  status: string;
  inviteHash: string;
  firstServiceDate?: string;
  createdAt: string;
  favoriteServices?: string[];
  notes?: string | null;
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
      <Card className="border-pink-100">
        <CardHeader className="bg-pink-50 pb-3">
          <CardTitle className="text-base">VMB Salon Invitations Sent</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500 italic text-center">
            No VMB salon invitations have been sent yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group invitations by sponsor
  const groupedInvitations: Record<string, Invitation[]> = {};
  
  invitations.forEach(invitation => {
    const sponsor = invitation.sponsor || 'Unknown Salon';
    if (!groupedInvitations[sponsor]) {
      groupedInvitations[sponsor] = [];
    }
    groupedInvitations[sponsor].push(invitation);
  });

  // Format phone number for display
  const formatPhone = (phone: string) => {
    // Show only last 3 digits for privacy
    return phone.replace(/\d(?=\d{3})/g, "•");
  };

  return (
    <Card className="border-pink-100">
      <CardHeader className="bg-pink-50 pb-3">
        <CardTitle className="text-base">VMB Salon Invitations Sent</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-pink-50 p-4">
          <h3 className="text-base font-semibold mb-2">Salon to Client Invitations</h3>
          
          {Object.entries(groupedInvitations).map(([sponsor, sponsorInvitations]) => (
            <div key={sponsor} className="mb-4">
              {/* Sponsor header */}
              <div className="bg-pink-50 px-4 py-2 font-semibold text-pink-700 border-b border-pink-200">
                {sponsor}
              </div>
              
              {/* Invitations table */}
              <div className="overflow-x-auto bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Phone</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium text-right">Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsorInvitations.map(invitation => (
                      <tr key={invitation.id} className="border-b">
                        <td className="p-3">{invitation.name}</td>
                        <td className="p-3">{invitation.email}</td>
                        <td className="p-3">{formatPhone(invitation.phone)}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                            {invitation.status}
                          </span>
                        </td>
                        <td className="p-3">{new Date(invitation.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <a 
                            href={`/invitation/${invitation.inviteHash}`}
                            className="inline-flex items-center text-pink-600 font-medium gap-1 text-sm hover:text-pink-800"
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}