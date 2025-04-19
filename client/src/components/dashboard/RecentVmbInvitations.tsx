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
import { CalendarIcon, UserIcon } from "lucide-react";

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
    <div className="space-y-6">
      <Card className="border-pink-100">
        <CardHeader className="bg-pink-50 pb-3">
          <CardTitle className="text-base">Salon to Client Invitations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.entries(groupedInvitations).map(([sponsor, sponsorInvitations]) => (
            <div key={sponsor} className="mb-4">
              {/* Sponsor header */}
              <div className="bg-pink-50 px-4 py-2 font-semibold text-pink-700 border-y border-pink-100">
                {sponsor}
              </div>
              
              {/* Invitations table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Name</TableHead>
                      <TableHead className="w-[180px]">Email</TableHead>
                      <TableHead className="w-[120px]">Phone</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sponsorInvitations.map(invitation => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.name}</TableCell>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{formatPhone(invitation.phone)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`
                              ${invitation.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                              ${invitation.status === 'style_selected' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              ${invitation.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            `}
                          >
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}