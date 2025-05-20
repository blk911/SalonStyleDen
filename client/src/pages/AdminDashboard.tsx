import { useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import InviteCompleteStatus from "@/components/dashboard/InviteCompleteStatus";
import { SvgVisualizer } from "@/components/visualization/SvgVisualizer";
import { VisualizationSelector } from "@/components/visualization/VisualizationSelector";
import { BatchActionsBar } from "@/components/admin/BatchActionsBar";
import { EnhancedDeleteConfirmation } from "@/components/admin/EnhancedDeleteConfirmation";
import { AdminActionButton, ActionGroup } from "@/components/admin/AdminActionButton";
import DebugControls from "@/components/admin/DebugControls";
import { SimpleSalonList } from "@/components/admin/SimpleSalonList";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckIcon, 
  ChevronDown, 
  ChevronUp, 
  ClipboardList, 
  Copy, 
  CopyCheck, 
  Edit, 
  Eye, 
  Mail, 
  MoreHorizontal, 
  Phone, 
  Plus, 
  SearchIcon, 
  Server, 
  ShieldCheck, 
  User, 
  UserIcon, 
  XCircle, 
  CheckCircle2,
  Filter,
  XCircleIcon,
  PencilIcon,
  TrashIcon
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPhoneNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  salonName?: string;
  isCurrentClient: boolean;
  salonId?: number; // Direct salon association
  sponsor?: string; // Sponsor name
  sponsorName?: string; // Alternative sponsor name field
  sponsorSalonId?: number; // Sponsor salon ID for relationship tracking
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
  featured?: boolean;
  gifUrl?: string;
}

interface Promo {
  id: number;
  title: string;
  description?: string;
  endDate?: string;
}

interface Salon {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  services?: Service[];
  promos?: Promo[];
  licenseStatus?: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  licenseNumber?: string;
  licenseState?: string;
  licenseVerificationDate?: string;
  suspended?: boolean;
}

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  favoriteServices: string[];
  salonId?: number;
  salonName?: string;
  status?: string;
  sponsor?: string;
  sponsorSalonId?: number;
  firstServiceDate?: string;
  createdAt: string;
  inviteHash?: string;
}

interface ActivityLog {
  id: number;
  type: string;
  description: string;
  userId?: number;
  salonId?: number;
  clientId?: number;
  timestamp: string;
}

interface Gift {
  id: number;
  senderId: number;
  senderName?: string;
  senderPhone?: string;
  recipientId?: number | null;
  recipientPhone: string | null;
  recipientEmail?: string | null;
  recipientName?: string;
  amount: number;
  message: string | null;
  status: string;
  salonId: number | null;
  salonName?: string;
  giftType?: string;
  giftHash: string;
  createdAt: string;
  redeemedAt?: string | null;
}

interface FilterCriteria {
  status?: string;
  salonId?: number;
  searchQuery?: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLayout, setSelectedLayout] = useState('dot');
  const [focusPath, setFocusPath] = useState('fullapp');
  const [generating, setGenerating] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
  const [clientToSuspend, setClientToSuspend] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [invitationFilter, setInvitationFilter] = useState<FilterCriteria>({});
  const [expandedSalon, setExpandedSalon] = useState<number | null>(null);
  const [salonToSuspend, setSalonToSuspend] = useState<Salon | null>(null);
  const [licenseViewSalon, setLicenseViewSalon] = useState<Salon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [reportPeriod, setReportPeriod] = useState("30");
  
  // Effect to reset expanded state when search changes
  useEffect(() => {
    setExpandedSalon(null);
  }, [searchQuery]);
  
  // Salon data fetching
  const { 
    data: salons = [],
    isLoading: salonIsLoading,
    error: salonError,
    refetch: refetchSalons
  } = useQuery({
    queryKey: ['/api/salons'],
    retry: 1
  });
  
  // Client data fetching
  const { 
    data: clients = [],
    isLoading: clientIsLoading,
    error: clientError,
    refetch: refetchClients
  } = useQuery({
    queryKey: ['/api/clients'],
    retry: 1
  });
  
  // Invitation data fetching with filters
  const { 
    data: invitations = [],
    isLoading: invitationIsLoading,
    error: invitationError,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['/api/invitations', invitationFilter],
    queryFn: async ({ queryKey }) => {
      const [_, filters] = queryKey;
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.salonId) queryParams.append('salonId', filters.salonId.toString());
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return apiRequest(`/api/invitations${queryString}`);
    },
    retry: 1
  });
  
  // Activity Logs fetching
  const { 
    data: activityLogs = [],
    isLoading: logsIsLoading,
    error: logsError
  } = useQuery({
    queryKey: ['/api/activitylogs'],
    retry: 1
  });
  
  // Gift data fetching
  const { 
    data: gifts = [],
    isLoading: giftsIsLoading,
    error: giftsError
  } = useQuery({
    queryKey: ['/api/gifts'],
    retry: 1
  });
  
  // Reporting data
  const { 
    data: reportingData,
    isLoading: reportingIsLoading
  } = useQuery({
    queryKey: ['/api/reporting', reportPeriod],
    queryFn: async ({ queryKey }) => {
      const [_, period] = queryKey;
      return apiRequest(`/api/reporting?period=${period}`);
    }
  });
  
  // Mutations
  
  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest(`/api/invitations/${invitationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      toast({
        title: "Invitation deleted",
        description: "The invitation has been successfully deleted."
      });
      setInvitationToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting invitation",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Suspend client mutation
  const suspendClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest(`/api/clients/${clientId}/suspend`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client suspended",
        description: "The client has been suspended successfully."
      });
      setClientToSuspend(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error suspending client",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Suspend salon mutation
  const suspendSalonMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}/suspend`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "Salon suspended",
        description: "The salon has been suspended successfully."
      });
      setSalonToSuspend(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error suspending salon",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest(`/api/clients/${clientId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client deleted",
        description: "The client has been permanently deleted."
      });
      setClientToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting client",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "Salon deleted",
        description: "The salon has been permanently deleted."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting salon",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // License verification mutation
  const verifyLicenseMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}/verify-license`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "License verified",
        description: "The salon license has been verified successfully."
      });
      setLicenseViewSalon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error verifying license",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // License rejection mutation
  const rejectLicenseMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}/reject-license`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "License rejected",
        description: "The salon license has been rejected."
      });
      setLicenseViewSalon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting license",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Helper Functions
  
  const findClientIdForInvitation = (invitation: Invitation, clientsList: Client[] | undefined): number | null => {
    if (!clientsList) return null;
    
    const matchingClient = clientsList.find(client => 
      client.phone === invitation.phone || 
      client.email === invitation.email
    );
    
    return matchingClient ? matchingClient.id : null;
  };
  
  // Filter clients based on search query
  const filteredClients = clients?.filter((client: Client) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchQuery) ||
      client.salonName?.toLowerCase().includes(searchLower)
    );
  });
  
  // Filter salons based on search query
  const filteredSalons = salons?.filter((salon: Salon) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      salon.name?.toLowerCase().includes(searchLower) ||
      salon.ownerName?.toLowerCase().includes(searchLower) ||
      salon.email?.toLowerCase().includes(searchLower) ||
      salon.phone?.includes(searchQuery)
    );
  });
  
  // Filter invitations based on search query and other criteria
  const filteredInvitations = invitations?.filter((invitation: Invitation) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      invitation.name?.toLowerCase().includes(searchLower) ||
      invitation.email?.toLowerCase().includes(searchLower) ||
      invitation.phone?.includes(searchQuery) ||
      invitation.salonName?.toLowerCase().includes(searchLower)
    );
  });
  
  // Calculate statistics
  const totalSalons = salons?.length || 0;
  const activeSalons = salons?.filter((salon: Salon) => !salon.suspended).length || 0;
  const suspendedSalons = salons?.filter((salon: Salon) => salon.suspended).length || 0;
  
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter((client: Client) => client.isCurrentClient).length || 0;
  
  const totalInvitations = invitations?.length || 0;
  const pendingInvitations = invitations?.filter((invitation: Invitation) => 
    invitation.status === 'pending' || !invitation.status
  ).length || 0;
  const completedInvitations = invitations?.filter((invitation: Invitation) => 
    invitation.status === 'completed'
  ).length || 0;
  
  const pendingGifts = gifts?.filter((gift: Gift) => 
    gift.status === 'pending' || gift.status === 'created'
  ) || [];
  
  // Get recent activity logs (last 15)
  const recentLogs = [...(activityLogs || [])]
    .sort((a: ActivityLog, b: ActivityLog) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 15);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-6 bg-gray-50/50">
        {/* Admin Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage the entire VMB platform</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                refetchSalons();
                refetchClients();
                refetchInvitations();
                toast({
                  title: "Data refreshed",
                  description: "All data has been refreshed from the server."
                });
              }}
            >
              Refresh Data
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search salons, clients, or invitations..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="salons">Salons</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="system" className="hidden lg:block">System</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Salons Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Salons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSalons}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">{activeSalons} active</span>
                    {suspendedSalons > 0 && (
                      <span className="ml-3 text-red-600">{suspendedSalons} suspended</span>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Clients Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClients}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">{activeClients} active</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Invitations Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInvitations}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-yellow-600">{pendingInvitations} pending</span>
                    <span className="ml-3 text-green-600">{completedInvitations} completed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Pending Requests Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pending Gifts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Gift Redemptions</CardTitle>
                  <CardDescription>Gifts that are pending recipient claim</CardDescription>
                </CardHeader>
                <CardContent>
                  {giftsIsLoading ? (
                    <div className="py-4 text-center text-gray-500">Loading gifts...</div>
                  ) : giftsError ? (
                    <div className="py-4 text-center text-red-500">Error loading gifts</div>
                  ) : pendingGifts.length === 0 ? (
                    <div className="py-4 text-center text-gray-500">No pending gift redemptions</div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-4">
                        {pendingGifts.map((gift: Gift) => (
                          <div key={gift.id} className="flex justify-between items-center p-3 rounded-md border border-gray-200 bg-white">
                            <div>
                              <div className="font-medium">${gift.amount} Gift</div>
                              <div className="text-sm text-gray-500">
                                From: {gift.senderName || "Unknown"} • To: {gift.recipientName || gift.recipientPhone || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-400">
                                Created: {new Date(gift.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Link
                              to={`/gifts/${gift.giftHash}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/gifts/${gift.giftHash}`);
                              }}
                              className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest events across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {logsIsLoading ? (
                    <div className="py-4 text-center text-gray-500">Loading activity...</div>
                  ) : logsError ? (
                    <div className="py-4 text-center text-red-500">Error loading activity logs</div>
                  ) : recentLogs.length === 0 ? (
                    <div className="py-4 text-center text-gray-500">No recent activity</div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {recentLogs.map((log: ActivityLog) => (
                          <div key={log.id} className="text-sm border-l-2 border-pink-300 pl-3 py-1">
                            <div className="font-medium">{log.type}</div>
                            <div className="text-gray-500">{log.description}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Reporting Panel Section */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Reports</CardTitle>
                <CardDescription>
                  Platform usage and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Performance reporting dashboard will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Salons Tab Content */}
          <TabsContent value="salons">
            <Card>
              <CardHeader>
                <CardTitle>Salon Directory</CardTitle>
                <CardDescription>
                  Manage all salons on the VMB platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchQuery && filteredSalons && filteredSalons.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No salons match your search
                  </div>
                ) : (
                  <SimpleSalonList 
                    salons={filteredSalons || []} 
                    isLoading={salonIsLoading} 
                    error={salonError}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Clients Tab Content */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Client Directory</CardTitle>
                <CardDescription>
                  Manage all clients on the VMB platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientIsLoading ? (
                  <div className="py-8 text-center text-gray-500">Loading clients...</div>
                ) : clientError ? (
                  <div className="py-8 text-center text-red-500">Error loading clients</div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {searchQuery ? "No clients match your search" : "No clients found"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Salon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client: Client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> 
                                {client.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> 
                                {formatPhoneNumber(client.phone)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.salonName || (
                              <span className="text-gray-400">No salon</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {client.isCurrentClient ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setClientToSuspend(client)}
                                className="h-7 px-2 text-orange-700"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Suspend
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setClientToDelete(client)}
                                className="h-7 px-2 text-red-700"
                              >
                                <TrashIcon className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Invitations Tab Content */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Management</CardTitle>
                <CardDescription>
                  Monitor and manage client invitations across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filter controls */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant={!invitationFilter.status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInvitationFilter({...invitationFilter, status: undefined})}
                  >
                    All
                  </Button>
                  <Button 
                    variant={invitationFilter.status === 'pending' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInvitationFilter({...invitationFilter, status: 'pending'})}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={invitationFilter.status === 'completed' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInvitationFilter({...invitationFilter, status: 'completed'})}
                  >
                    Completed
                  </Button>
                </div>
                
                {invitationIsLoading ? (
                  <div className="py-8 text-center text-gray-500">Loading invitations...</div>
                ) : invitationError ? (
                  <div className="py-8 text-center text-red-500">Error loading invitations</div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {searchQuery || Object.keys(invitationFilter).length > 0 
                      ? "No invitations match your filters" 
                      : "No invitations found"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation: Invitation) => (
                      <div 
                        key={invitation.id} 
                        className={`p-4 border rounded-md ${
                          invitation.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <div className="font-medium text-gray-900">{invitation.name}</div>
                            <div className="text-sm text-gray-500">
                              {invitation.email} • {formatPhoneNumber(invitation.phone)}
                            </div>
                            <div className="text-sm flex items-center mt-1">
                              <span className="text-gray-600 mr-2">From:</span>
                              <span className="font-medium text-pink-700">{invitation.salonName || 'Unknown Salon'}</span>
                              {invitation.sponsor && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Sponsor: {invitation.sponsor})
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:items-end gap-2">
                            <div className="flex items-center">
                              <InviteCompleteStatus status={invitation.status} />
                              <span className="ml-2 text-xs text-gray-500">
                                {new Date(invitation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              {/* Copy Invite Link Button */}
                              {invitation.inviteHash && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            `${window.location.origin}/invite/${invitation.inviteHash}`
                                          );
                                          toast({
                                            title: "Copied!",
                                            description: "Invitation link copied to clipboard"
                                          });
                                        }}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy invite link</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              {/* Preview Button */}
                              {invitation.inviteHash && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7"
                                  onClick={() => {
                                    setLocation(`/invitations/preview/${invitation.inviteHash}`);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Preview
                                </Button>
                              )}
                              
                              {/* Delete Button */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-7 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setInvitationToDelete(invitation)}
                              >
                                <TrashIcon className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Service Preferences */}
                        {invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-1">Favorite Services:</div>
                            <div className="flex flex-wrap gap-1">
                              {invitation.favoriteServices.map((service, index) => (
                                <Badge key={index} variant="secondary" className="text-[10px]">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Notes */}
                        {invitation.notes && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-1">Notes:</div>
                            <div className="text-sm bg-gray-50 p-2 rounded">{invitation.notes}</div>
                          </div>
                        )}
                        
                        {/* Client Link (if applicable) */}
                        {invitation.status === 'completed' && (
                          <div className="mt-3 text-sm">
                            <div className="flex items-center text-green-700">
                              <CheckIcon className="h-3.5 w-3.5 mr-1" />
                              <span>
                                Connected to client ID: 
                                {findClientIdForInvitation(invitation, clients) || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Tab Content */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>System Visualization</CardTitle>
                  <CardDescription>
                    Visual representation of the VMB platform architecture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <VisualizationSelector 
                      selectedVisualization={selectedVisualization}
                      onSelect={setSelectedVisualization}
                    />
                  </div>
                  
                  <div className="w-full h-[400px] bg-white border rounded-md overflow-hidden">
                    {selectedVisualization ? (
                      <SvgVisualizer 
                        selectedLayout={selectedLayout} 
                        focusPath={focusPath}
                        selectedVisualization={selectedVisualization}
                        generating={generating}
                        onSelectPath={setFocusPath}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        Select a visualization to display
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedLayout === 'dot' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedLayout('dot')}
                      >
                        Standard
                      </Button>
                      <Button 
                        variant={selectedLayout === 'fdp' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedLayout('fdp')}
                      >
                        Force-directed
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setGenerating(true);
                        setTimeout(() => setGenerating(false), 500);
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Troubleshooting Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting Tools</CardTitle>
                  <CardDescription>
                    Admin utilities for system maintenance and debugging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TroubleshootPanel />
                </CardContent>
              </Card>
              
              {/* Audit Log Viewer */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>System Audit Logs</CardTitle>
                  <CardDescription>
                    Detailed record of all system events and user actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AuditLogViewer logs={activityLogs} isLoading={logsIsLoading} error={logsError} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      
      {/* Confirmation Dialogs */}
      
      {/* Delete Invitation Confirmation */}
      {invitationToDelete && (
        <AlertDialog open={!!invitationToDelete} onOpenChange={(open) => !open && setInvitationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the invitation for <strong>{invitationToDelete.name}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-500 hover:bg-red-600"
                onClick={() => deleteInvitationMutation.mutate(invitationToDelete.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Suspend Client Confirmation */}
      {clientToSuspend && (
        <AlertDialog open={!!clientToSuspend} onOpenChange={(open) => !open && setClientToSuspend(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend <strong>{clientToSuspend.name}</strong>?
                They will no longer be able to access their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => suspendClientMutation.mutate(clientToSuspend.id)}
              >
                Suspend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Delete Client Confirmation */}
      {clientToDelete && (
        <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete <strong>{clientToDelete.name}</strong>?
                This will remove all of their data and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-500 hover:bg-red-600"
                onClick={() => deleteClientMutation.mutate(clientToDelete.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* License Viewing/Approval Dialog */}
      {licenseViewSalon && (
        <AlertDialog open={!!licenseViewSalon} onOpenChange={(open) => !open && setLicenseViewSalon(null)}>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>License Information - {licenseViewSalon.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Review and manage license verification for this salon
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div 
                className={`p-4 mb-4 rounded-md border ${
                  licenseViewSalon.licenseStatus === 'verified' ? 'bg-green-50 border-green-100 text-green-800' :
                  licenseViewSalon.licenseStatus === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                  licenseViewSalon.licenseStatus === 'rejected' ? 'bg-red-50 border-red-100 text-red-800' :
                  'bg-gray-50 border-gray-100 text-gray-800'
                }`}
              >
                <div className="font-medium">
                  Status: {' '}
                  {licenseViewSalon.licenseStatus === 'verified' && 'Verified'}
                  {licenseViewSalon.licenseStatus === 'pending' && 'Pending Verification'}
                  {licenseViewSalon.licenseStatus === 'rejected' && 'Rejected'}
                  {(!licenseViewSalon.licenseStatus || licenseViewSalon.licenseStatus === 'not_submitted') && 'Not Submitted'}
                </div>
              </div>
              
              <div className="space-y-4">
                <dl className="space-y-2">
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-600">License Number:</dt>
                    <dd>{licenseViewSalon.licenseNumber || 'Not provided'}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-600">State/Region:</dt>
                    <dd>{licenseViewSalon.licenseState || 'Not provided'}</dd>
                  </div>
                  {licenseViewSalon.licenseVerificationDate && (
                    <div className="flex">
                      <dt className="w-32 font-medium text-gray-600">Verified On:</dt>
                      <dd>{licenseViewSalon.licenseVerificationDate}</dd>
                    </div>
                  )}
                </dl>
                
                {/* Approval/Rejection Buttons */}
                {(licenseViewSalon.licenseStatus === 'pending' || !licenseViewSalon.licenseStatus || licenseViewSalon.licenseStatus === 'not_submitted') && (
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    <div className="text-sm text-gray-500 mb-2">
                      Approving this license will grant the salon full platform access.
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        if (licenseViewSalon) {
                          verifyLicenseMutation.mutate(licenseViewSalon.id);
                        }
                      }}
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Approve License
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        if (licenseViewSalon) {
                          rejectLicenseMutation.mutate(licenseViewSalon.id);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject License
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Suspend Salon Confirmation */}
      {salonToSuspend && (
        <AlertDialog open={!!salonToSuspend} onOpenChange={(open) => !open && setSalonToSuspend(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend Salon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend <strong>{salonToSuspend.name}</strong>?
                This will temporarily disable their account access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  if (salonToSuspend) {
                    suspendSalonMutation.mutate(salonToSuspend.id);
                  }
                }}
              >
                Suspend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}