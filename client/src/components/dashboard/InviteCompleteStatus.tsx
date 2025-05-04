import { Sparkles, CheckCircle, UserIcon, Calendar, Clock, Phone, Mail, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Invitation } from "@/types/invitation";

interface InviteCompleteStatusProps {
  inviteCount?: number;
  compact?: boolean;
  showTitle?: boolean;
  invitations?: Invitation[];
}

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumberString: string) {
  const cleaned = phoneNumberString.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumberString;
}

// Helper function to format dates
function formatDate(dateString: string | undefined) {
  if (!dateString) return 'No date';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
}

export default function InviteCompleteStatus({ 
  inviteCount = 0, 
  compact = false,
  showTitle = true,
  invitations = []
}: InviteCompleteStatusProps) {
  const hasCompletedInvitations = invitations.some(
    inv => inv.status === 'complete' || inv.status === 'accepted'
  );

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={`${compact ? "p-3" : "p-4"} border-2 ${inviteCount > 0 ? "border-emerald-300" : "border-gray-200"}`}>
        <CardContent className="p-0 flex items-center justify-between">
          <div>
            {showTitle && (
              <h3 className={`${compact ? "text-sm" : "text-base"} font-medium`}>
                Invitation Summary
              </h3>
            )}
            <div className="flex items-center mt-1">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium whitespace-nowrap">
                COMPLETE
              </span>
              {inviteCount > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {inviteCount} {inviteCount === 1 ? 'invitation' : 'invitations'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center rounded-full bg-emerald-50 p-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Invitation Cards */}
      {hasCompletedInvitations && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Completed Invitations</h3>
          {invitations
            .filter(inv => inv.status === 'complete' || inv.status === 'accepted')
            .map(invitation => (
              <Card key={invitation.id} className="overflow-hidden border-emerald-200">
                <CardHeader className="py-2 px-3 bg-gradient-to-r from-emerald-50 to-emerald-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-600" />
                    {invitation.name}
                  </CardTitle>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                    ID: {invitation.id}
                  </Badge>
                </CardHeader>
                <CardContent className="p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <UserIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="font-medium text-gray-700">Client:</span>
                    <span className="ml-1">{invitation.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-1">{formatPhoneNumber(invitation.phone)}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-1 truncate">{invitation.email}</span>
                  </div>
                  {invitation.salonName && (
                    <div className="flex items-center">
                      <span className="h-3.5 w-3.5 mr-1.5 text-gray-500">💈</span>
                      <span className="font-medium text-gray-700">Salon:</span>
                      <span className="ml-1 truncate">{invitation.salonName}</span>
                    </div>
                  )}
                  {invitation.sponsor && (
                    <div className="flex items-center">
                      <span className="h-3.5 w-3.5 mr-1.5 text-gray-500">👤</span>
                      <span className="font-medium text-gray-700">Sponsor:</span>
                      <span className="ml-1 truncate">{invitation.sponsor}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="font-medium text-gray-700">First Service:</span>
                    <span className="ml-1">{formatDate(invitation.firstServiceDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-1">{formatDate(invitation.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="font-medium text-gray-700">Invite ID:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 truncate text-xs text-emerald-600">{invitation.inviteHash || 'N/A'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{invitation.inviteHash || 'No hash available'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
                    <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-1 mt-1">
                      {invitation.favoriteServices.map(service => (
                        <Badge key={service} variant="outline" className="text-[9px] bg-gray-50">{service}</Badge>
                      ))}
                    </div>
                  )}
                  {invitation.notes && (
                    <div className="col-span-1 sm:col-span-2 mt-1">
                      <p className="text-[10px] text-gray-600 italic">{invitation.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}