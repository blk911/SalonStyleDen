import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, HeartIcon, MessageSquareIcon } from "lucide-react";

interface ActivityLog {
  id: number;
  type: string;
  description: string;
  userId?: number | null;
  clientId?: number | null;
  salonId?: number | null;
  timestamp: string;
}

interface RecentVmbInvitationsProps {
  clientId?: number;
  salonId?: number;
  limit?: number;
}

export default function RecentVmbInvitations({ 
  clientId, 
  salonId, 
  limit = 5
}: RecentVmbInvitationsProps) {
  const filterParams = new URLSearchParams();
  if (limit) filterParams.set('limit', limit.toString());
  
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['/api/activity-logs', clientId, salonId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/activity-logs?${filterParams}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<ActivityLog[]>;
    }
  });

  // Filter for VMB invitations only
  const vmbInvitations = activityLogs?.filter(log => 
    log.type === 'vmb_invitation' && 
    // If clientId is provided, filter by clientId
    (clientId ? log.clientId === clientId : true) &&
    // If salonId is provided, filter by salonId
    (salonId ? log.salonId === salonId : true)
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (vmbInvitations.length === 0) {
    return (
      <p className="text-gray-500 italic text-center py-3">
        No VMB invitations have been sent yet.
      </p>
    );
  }

  function truncateDescription(description: string): string {
    const maxLength = 80;
    return description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description;
  }

  return (
    <div className="space-y-3">
      {vmbInvitations.map(log => (
        <Card key={log.id} className="overflow-hidden border-pink-100 hover:border-pink-200 transition-colors">
          <CardContent className="p-3">
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center">
                  <MessageSquareIcon className="h-4 w-4 text-pink-500 mr-2" />
                  <span className="font-medium text-sm">VMB Invitation</span>
                </div>
                <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-100">
                  Sent
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700 mb-1">
                {truncateDescription(log.description)}
              </p>
              
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}