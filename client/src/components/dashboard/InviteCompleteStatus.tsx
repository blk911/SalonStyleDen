import { Sparkles, CheckCircle, UserIcon, Calendar, Clock, Phone, Mail, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  status: string;
  createdAt: string;
  inviteHash?: string;
  firstServiceDate?: string;
  favoriteServices?: string[];
}

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className={`${compact ? "text-sm" : "text-base"} font-medium cursor-help`}>
                      Invitation Summary
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Overview of invitation activity status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="flex items-center mt-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium whitespace-nowrap cursor-help">
                      COMPLETE
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">These invitations have been sent and processed</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {inviteCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 text-sm text-gray-600 cursor-help">
                        {inviteCount} {inviteCount === 1 ? 'invitation' : 'invitations'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Total number of completed invitations in the system</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center rounded-full bg-emerald-50 p-2 cursor-help">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Completed invitations are ready for client redemption</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
      
      {/* Detailed Invitation Cards */}
      {hasCompletedInvitations && (
        <div className="space-y-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-medium text-gray-700 cursor-help">Completed Invitations</h3>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">These invitations have been fully processed and are active</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {invitations
            .filter(inv => inv.status === 'complete' || inv.status === 'accepted')
            .map(invitation => (
              <Card key={invitation.id} className="overflow-hidden border-emerald-200">
                <CardHeader className="py-2 px-3 bg-gradient-to-r from-emerald-50 to-emerald-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center cursor-help">
                            <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-600" />
                            {invitation.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Client with completed invitation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] cursor-help">
                          ID: {invitation.id}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Unique invitation identifier in database</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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