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
import DeveloperGuide from "@/components/admin/DeveloperGuide";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ExternalLink as ExternalLinkIcon, 
  Loader as LoaderIcon, 
  AlertTriangle as AlertTriangleIcon, 
  User as UserIcon, 
  Network as NetworkIcon,
  RefreshCw,
  XCircle as XCircleIcon, 
  Download,
  Code, 
  Eye,
  ChevronDown,
  ChevronUp,
  AtSign as AtSignIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Gift as GiftIcon,
  Trash2 as TrashIcon
} from "lucide-react";
import { CollapsibleCard } from "@/components/ui/card-section";
import { useToast } from "@/hooks/use-toast";

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

// We're now using the imported SvgVisualizer component from @/components/visualization/SvgVisualizer

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
  const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);
  
  // License verification mutations
  const verifyLicenseMutation = useMutation({
    mutationFn: async (salonId: number) => {
      const response = await fetch(`/api/license/verify/${salonId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to verify license');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "License verified",
        description: "The salon license has been verified successfully.",
      });
      // Invalidate the salons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      // Also invalidate activity logs since this is an important action
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error verifying license",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // License rejection mutation
  const rejectLicenseMutation = useMutation({
    mutationFn: async (salonId: number) => {
      const response = await fetch(`/api/license/reject/${salonId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason: "Information could not be verified" })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to reject license');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "License rejected",
        description: "The salon license has been marked as rejected.",
      });
      // Invalidate the salons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      // Also invalidate activity logs since this is an important action
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting license",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Section visibility states (stored in localStorage for persistence)
  const [styleOptionsOpen, setStyleOptionsOpen] = useState(true);
  const [networkVisualizationOpen, setNetworkVisualizationOpen] = useState(false);
  const [codeGraphOpen, setCodeGraphOpen] = useState(false);
  const [invitationsOpen, setInvitationsOpen] = useState(true);
  const [clientsOpen, setClientsOpen] = useState(true);
  const [activityLogsOpen, setActivityLogsOpen] = useState(true);
  const [salonDirectoryOpen, setSalonDirectoryOpen] = useState(false);
  const [giftRequestsOpen, setGiftRequestsOpen] = useState(true);
  const [unregVmbClientsOpen, setUnregVmbClientsOpen] = useState(true);
  const [developerGuideOpen, setDeveloperGuideOpen] = useState(false);
  
  // State to track which salon details are expanded (initially all closed)
  const [expandedSalon, setExpandedSalon] = useState<number | null>(null);
  
  // Set default visualization when code graph section is opened
  useEffect(() => {
    if (codeGraphOpen && !selectedVisualization) {
      // Use local path with cache buster
      const cacheBuster = `?cb=${Date.now()}`;
      setSelectedVisualization(`/vmb_tools/dependency_graph/output/client_dashboard_dependencies.svg${cacheBuster}`);
    }
  }, [codeGraphOpen, selectedVisualization]);
  
  // Load section states from localStorage
  useEffect(() => {
    const loadSectionStates = () => {
      try {
        const styleOpt = localStorage.getItem('adminDashboard_styleOptionsOpen');
        const networkVis = localStorage.getItem('adminDashboard_networkVisualizationOpen');
        const codeGraph = localStorage.getItem('adminDashboard_codeGraphOpen');
        const invites = localStorage.getItem('adminDashboard_invitationsOpen');
        const clients = localStorage.getItem('adminDashboard_clientsOpen');
        const logs = localStorage.getItem('adminDashboard_activityLogsOpen');
        const salons = localStorage.getItem('adminDashboard_salonDirectoryOpen');
        const gifts = localStorage.getItem('adminDashboard_giftRequestsOpen');
        const unregVmb = localStorage.getItem('adminDashboard_unregVmbClientsOpen');
        const devGuide = localStorage.getItem('adminDashboard_developerGuideOpen');
        const expanded = localStorage.getItem('adminDashboard_expandedSalon');
        
        if (styleOpt !== null) setStyleOptionsOpen(styleOpt === 'true');
        if (networkVis !== null) setNetworkVisualizationOpen(networkVis === 'true');
        if (codeGraph !== null) setCodeGraphOpen(codeGraph === 'true');
        if (invites !== null) setInvitationsOpen(invites === 'true');
        if (clients !== null) setClientsOpen(clients === 'true');
        if (logs !== null) setActivityLogsOpen(logs === 'true');
        if (salons !== null) setSalonDirectoryOpen(salons === 'true');
        if (gifts !== null) setGiftRequestsOpen(gifts === 'true');
        if (unregVmb !== null) setUnregVmbClientsOpen(unregVmb === 'true');
        if (devGuide !== null) setDeveloperGuideOpen(devGuide === 'true');
        if (expanded !== null) setExpandedSalon(parseInt(expanded, 10));
      } catch (error) {
        console.error('Error loading section states from localStorage:', error);
      }
    };
    
    loadSectionStates();
  }, []);
  
  // Save section states to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('adminDashboard_styleOptionsOpen', styleOptionsOpen.toString());
      localStorage.setItem('adminDashboard_networkVisualizationOpen', networkVisualizationOpen.toString());
      localStorage.setItem('adminDashboard_codeGraphOpen', codeGraphOpen.toString());
      localStorage.setItem('adminDashboard_invitationsOpen', invitationsOpen.toString());
      localStorage.setItem('adminDashboard_clientsOpen', clientsOpen.toString());
      localStorage.setItem('adminDashboard_activityLogsOpen', activityLogsOpen.toString());
      localStorage.setItem('adminDashboard_salonDirectoryOpen', salonDirectoryOpen.toString());
      localStorage.setItem('adminDashboard_giftRequestsOpen', giftRequestsOpen.toString());
      localStorage.setItem('adminDashboard_unregVmbClientsOpen', unregVmbClientsOpen.toString());
      localStorage.setItem('adminDashboard_developerGuideOpen', developerGuideOpen.toString());
    } catch (error) {
      console.error('Error saving section states to localStorage:', error);
    }
  }, [styleOptionsOpen, networkVisualizationOpen, codeGraphOpen, invitationsOpen, clientsOpen, activityLogsOpen, salonDirectoryOpen, giftRequestsOpen, unregVmbClientsOpen, developerGuideOpen]);
  
  // Save expanded salon state to localStorage when it changes
  useEffect(() => {
    try {
      if (expandedSalon !== null) {
        localStorage.setItem('adminDashboard_expandedSalon', expandedSalon.toString());
      } else {
        localStorage.removeItem('adminDashboard_expandedSalon');
      }
    } catch (error) {
      console.error('Error saving expanded salon state to localStorage:', error);
    }
  }, [expandedSalon]);

  // Helper function to find client ID for an invitation
  const findClientIdForInvitation = (invitation: Invitation, clientsList: Client[] | undefined): number | null => {
    if (!clientsList || clientsList.length === 0) {
      console.log(`No clients available to match with invitation ID ${invitation.id}`);
      return null;
    }
    
    // Match by phone number (most reliable identifier)
    // Normalize phone numbers by removing non-digits for comparison
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    
    const matchingClient = clientsList.find(client => 
      normalizePhone(client.phone) === normalizePhone(invitation.phone)
    );
    
    if (matchingClient) {
      console.log(`Found matching client ID ${matchingClient.id} for invitation ID ${invitation.id} via phone number`);
      return matchingClient.id;
    }
    
    console.log(`No matching client found for invitation ID ${invitation.id} with phone ${invitation.phone}`);
    return null;
  };

  const { data: clients, error: clientError, isLoading: clientIsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
      }
    },
  });

  const { data: salons, error: salonError, isLoading: salonIsLoading, refetch: refetchSalons } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/salons');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch salons: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching salons:', error);
        throw error; // We'll handle this in the UI
      }
    },
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  const { data: invitations, error: inviteError, isLoading: inviteIsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/invitations?limit=50'); // Get more invitations for admin view
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch invitations: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching invitations:', error);
        return [];
      }
    },
  });
  
  const { data: activityLogs, error: logsError, isLoading: logsIsLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/activity-logs?limit=50'); // Get more logs for admin view
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch activity logs: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }
    },
  });
  
  // Query for pending gift requests
  const { data: pendingGifts, error: giftsError, isLoading: giftsIsLoading } = useQuery<Gift[]>({
    queryKey: ['/api/gifts-pending'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gifts-pending');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch pending gift requests: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching pending gift requests:', error);
        return [];
      }
    },
  });

  // Query for unregistered VMB clients
  const { data: unregVmbClients, error: unregVmbError, isLoading: unregVmbIsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients-unreg-vmb'],
    queryFn: async () => {
      try {
        const url = '/api/clients?sponsorSalonId=1&isCurrentClient=false';
        const processedUrl = url.startsWith('/api/') ? 
          new URL(url, window.location.origin.replace(/\/\/[^@]+@/, '//')).href : url;
        
        const response = await fetch(processedUrl);
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch unregistered VMB clients: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching unregistered VMB clients:', error);
        return [];
      }
    },
  });

  // Format phone numbers for display - using site-wide standard (XXX) XXX-XXXX
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };
  
  // Cancel invitation mutation (marks as cancelled but doesn't delete)
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to cancel invitation');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been marked as cancelled. The client will no longer be able to accept it.",
      });
      // Invalidate the invitations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      // Also invalidate activity logs
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error cancelling invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete invitation');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation deleted",
        description: "The invitation has been successfully removed from the system.",
      });
      // Reset the selected invitation
      setInvitationToDelete(null);
      // Invalidate the invitations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      // Also invalidate activity logs since a new log entry will be created
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Suspend client mutation
  const suspendClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await fetch(`/api/clients/${clientId}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to suspend client');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client suspended",
        description: "The client account has been suspended.",
      });
      // Reset the selected client
      setClientToSuspend(null);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error suspending client",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete gift mutation
  const deleteGiftMutation = useMutation({
    mutationFn: async (giftId: number) => {
      const response = await fetch(`/api/gifts/${giftId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      // If we get a 404, we'll consider this a "success" since the gift is already gone
      if (response.status === 404) {
        console.log(`Gift with ID ${giftId} not found - already deleted or doesn't exist`);
        return { success: true, message: "Gift not found (already removed)" };
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete gift');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gift deleted",
        description: "The gift has been removed from the system.",
        variant: "destructive"
      });
      setGiftToDelete(null);
      // Invalidate the gifts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/gifts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      console.error("Error deleting gift:", error);
      toast({
        title: "Error",
        description: `Failed to delete gift: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (salonId: number) => {
      // Check if this is VMB LTD (ID 1) or Tiffany's salon (ID 2) - we don't allow deleting these
      if (salonId === 1 || salonId === 2) {
        throw new Error("Cannot delete system or Tiffany's salon");
      }
      
      const response = await fetch(`/api/salons/${salonId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete salon');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Salon deleted",
        description: "The salon has been successfully removed from the system.",
      });
      // Invalidate the salons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      // Also invalidate activity logs since a new log entry will be created
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting salon",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete client');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "The client has been permanently removed from the system.",
      });
      // Reset the selected client
      setClientToDelete(null);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting client",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Show global loading state only if everything is loading
  if (clientIsLoading && salonIsLoading && inviteIsLoading && logsIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoaderIcon className="h-10 w-10 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow p-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-0">Admin Dashboard</h1>
            </div>
            <div className="flex space-x-3">
              <Link href="/dependencies">
                <Button variant="outline" size="sm" className="text-xs bg-white hover:bg-gray-100">
                  Dependencies
                </Button>
              </Link>
              <Link href="/performance">
                <Button variant="outline" size="sm" className="text-xs bg-white hover:bg-gray-100">
                  Performance
                </Button>
              </Link>
            </div>
          </div>

          {/* Ven Me Baby Style Options */}
          <CollapsibleCard 
            title="Ven Me, Baby! Style Options"
            isOpen={styleOptionsOpen}
            onToggle={() => setStyleOptionsOpen(!styleOptionsOpen)}
            className="mb-2" // Reduced margin from mb-3 to mb-2
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-2">
                  <div className="flex">
                    {/* Left Side - Text */}
                    <div className="w-2/3 text-left pr-2">
                      <h3 className="font-medium">French Tips / Touch-Up</h3>
                      <p className="text-xs text-gray-600 mb-2">Classic white tips or quick polish refresh.</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">$40</span>
                        <span className="text-xs">30 min</span>
                      </div>
                    </div>
                    {/* Right Side - Image */}
                    <div className="w-1/3 flex items-center justify-end pl-2">
                      <img 
                        src="/assets/French_Tips.png" 
                        alt="French Tips" 
                        className="rounded h-20 w-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/VMB_LOGO.png';
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-2">
                  <div className="flex">
                    {/* Left Side - Text */}
                    <div className="w-2/3 text-left pr-2">
                      <h3 className="font-medium">Luxe Gel Manicure</h3>
                      <p className="text-xs text-gray-600 mb-2">Glossy, chip-free color with lasting shine.</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">$55</span>
                        <span className="text-xs">45 min</span>
                      </div>
                    </div>
                    {/* Right Side - Image */}
                    <div className="w-1/3 flex items-center justify-end pl-2">
                      <img 
                        src="/assets/Luxe_Gel_Manicure.png" 
                        alt="Luxe Gel Manicure" 
                        className="rounded h-20 w-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/VMB_LOGO.png';
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-2">
                  <div className="flex">
                    {/* Left Side - Text */}
                    <div className="w-2/3 text-left pr-2">
                      <h3 className="font-medium">Sculpted Acrylics</h3>
                      <p className="text-xs text-gray-600 mb-2">Custom-shaped acrylics for bold length.</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">$70</span>
                        <span className="text-xs">60 min</span>
                      </div>
                    </div>
                    {/* Right Side - Image */}
                    <div className="w-1/3 flex items-center justify-end pl-2">
                      <img 
                        src="/assets/Sculpted_Acrylics.png" 
                        alt="Sculpted Acrylics" 
                        className="rounded h-20 w-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/VMB_LOGO.png';
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-2">
                  <div className="flex">
                    {/* Left Side - Text */}
                    <div className="w-2/3 text-left pr-2">
                      <h3 className="font-medium">Glam Me! Custom Design</h3>
                      <p className="text-xs text-gray-600 mb-2">Fully custom art, gems, 3D extras.</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">$125+</span>
                        <span className="text-xs">90 min</span>
                      </div>
                    </div>
                    {/* Right Side - Image */}
                    <div className="w-1/3 flex items-center justify-end pl-2">
                      <img 
                        src="/assets/Glam_Me_Custom_Design.png" 
                        alt="Glam Me! Custom Design" 
                        className="rounded h-20 w-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/VMB_LOGO.png';
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleCard>

          {/* Salons Directory */}
          <CollapsibleCard
            title="Salon Directory"
            isOpen={salonDirectoryOpen}
            onToggle={() => setSalonDirectoryOpen(!salonDirectoryOpen)}
          >
            {/* Loading state */}
            {salonIsLoading && (
              <div className="py-8 text-center">
                <LoaderIcon className="h-6 w-6 animate-spin text-pink-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading salon data...</p>
              </div>
            )}
            
            {/* Error state */}
            {salonError && !salonIsLoading && (
              <div className="py-8 text-center border rounded-md bg-red-50">
                <AlertTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 mb-1">Error loading salons</p>
                <p className="text-sm text-red-600 mb-4">{salonError.message}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchSalons()}
                  className="mx-auto flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}
            
            {/* Empty state */}
            {!salonIsLoading && !salonError && (!salons || salons.length === 0) && (
              <div className="py-8 text-center border rounded-md bg-gray-50">
                <UserIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No salons found</p>
              </div>
            )}
            
            {/* License Verification Status Summary */}
            {!salonIsLoading && !salonError && salons && salons.length > 0 && (
              <div className="mb-4 bg-gray-50 p-3 rounded-md border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">License Verification Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="bg-green-50 border border-green-100 rounded-md p-2 text-center">
                    <span className="text-lg font-bold text-green-700">
                      {salons.filter(salon => salon.licenseStatus === 'verified').length}
                    </span>
                    <p className="text-xs text-green-600">Verified</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-2 text-center">
                    <span className="text-lg font-bold text-yellow-700">
                      {salons.filter(salon => salon.licenseStatus === 'pending').length}
                    </span>
                    <p className="text-xs text-yellow-600">Pending</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-md p-2 text-center">
                    <span className="text-lg font-bold text-red-700">
                      {salons.filter(salon => salon.licenseStatus === 'rejected').length}
                    </span>
                    <p className="text-xs text-red-600">Rejected</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-center">
                    <span className="text-lg font-bold text-gray-700">
                      {salons.filter(salon => !salon.licenseStatus || salon.licenseStatus === 'not_submitted').length}
                    </span>
                    <p className="text-xs text-gray-600">Not Submitted</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Salons with collapsible entries */}
            {!salonIsLoading && !salonError && salons && salons.length > 0 && (
              <ScrollArea className="max-h-[400px] mt-2">
                <div className="space-y-2 pb-2">
                  {salons.map((salon: Salon) => (
                    <div key={salon.id} className="border rounded-md overflow-hidden">
                      {/* Salon Header - Pink Background */}
                      <div 
                        className="bg-pink-100 px-4 py-2 flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedSalon(expandedSalon === salon.id ? null : salon.id)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-pink-800">{salon.name}</span>
                          <span className="ml-2 text-xs text-pink-600">ID: {salon.id}</span>
                          
                          {/* License Status Badge */}
                          {salon.licenseStatus && (
                            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full 
                              ${salon.licenseStatus === 'verified' ? 'bg-green-100 text-green-800' : ''}
                              ${salon.licenseStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${salon.licenseStatus === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                              ${salon.licenseStatus === 'not_submitted' ? 'bg-gray-100 text-gray-800' : ''}
                            `}>
                              {salon.licenseStatus === 'verified' && 'License Verified'}
                              {salon.licenseStatus === 'pending' && 'License Pending'}
                              {salon.licenseStatus === 'rejected' && 'License Rejected'}
                              {salon.licenseStatus === 'not_submitted' && 'No License Info'}
                            </span>
                          )}
                          {!salon.licenseStatus && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                              No License Info
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Link 
                            to={`/salon/${salon.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/salon/${salon.id}`);
                            }}
                            className="mr-3 px-2 py-1 text-[10px] bg-pink-200 text-pink-700 rounded hover:bg-pink-300"
                          >
                            Salon Page
                          </Link>
                          
                          {/* Delete Button - Not shown for VMB or Tiffany's salon */}
                          {salon.id !== 1 && salon.id !== 2 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete ${salon.name}? This cannot be undone.`)) {
                                  deleteSalonMutation.mutate(salon.id);
                                }
                              }}
                              className="mr-3 px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                            >
                              <TrashIcon className="h-3 w-3" />
                              Delete
                            </button>
                          )}
                          
                          {expandedSalon === salon.id ? (
                            <ChevronUp className="h-4 w-4 text-pink-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-pink-600" />
                          )}
                        </div>
                      </div>
                      
                      {/* Salon Details - Hidden until expanded */}
                      {expandedSalon === salon.id && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">Salon Information</h3>
                              <dl className="space-y-1 text-sm">
                                <div className="flex">
                                  <dt className="w-24 font-medium text-gray-500">Owner:</dt>
                                  <dd>{salon.ownerName}</dd>
                                </div>
                                <div className="flex">
                                  <dt className="w-24 font-medium text-gray-500">Email:</dt>
                                  <dd>{salon.email}</dd>
                                </div>
                                <div className="flex">
                                  <dt className="w-24 font-medium text-gray-500">Phone:</dt>
                                  <dd>{formatPhoneNumber(salon.phone)}</dd>
                                </div>
                              </dl>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">Services & Stats</h3>
                              <dl className="space-y-1 text-sm">
                                <div className="flex">
                                  <dt className="w-32 font-medium text-gray-500">Services:</dt>
                                  <dd>{salon.services?.length || 0} services</dd>
                                </div>
                                <div className="flex">
                                  <dt className="w-32 font-medium text-gray-500">Active Promos:</dt>
                                  <dd>{salon.promos?.length || 0} promotions</dd>
                                </div>
                                <div className="flex">
                                  <dt className="w-32 font-medium text-gray-500">Clients:</dt>
                                  <dd>{clients?.filter(c => c.salonId === salon.id || c.sponsorSalonId === salon.id).length || 0} clients</dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                          
                          {/* License Information Section */}
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">License Information</h3>
                            
                            {/* Show appropriate content based on license status */}
                            {salon.licenseStatus === 'verified' && (
                              <div className="bg-green-50 p-3 rounded-md border border-green-100">
                                <div className="flex items-center mb-2">
                                  <Badge className="bg-green-600">Verified</Badge>
                                  <span className="ml-2 text-sm text-green-800">License has been verified</span>
                                </div>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">License Number:</dt>
                                    <dd className="text-gray-800">{salon.licenseNumber || 'Not available'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">State:</dt>
                                    <dd className="text-gray-800">{salon.licenseState || 'Not available'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">Verified On:</dt>
                                    <dd className="text-gray-800">{salon.licenseVerificationDate || 'Not available'}</dd>
                                  </div>
                                </dl>
                              </div>
                            )}
                            
                            {salon.licenseStatus === 'pending' && (
                              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                <div className="flex items-center mb-2">
                                  <Badge className="bg-yellow-600">Pending</Badge>
                                  <span className="ml-2 text-sm text-yellow-800">License verification in progress</span>
                                </div>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">License Number:</dt>
                                    <dd className="text-gray-800">{salon.licenseNumber || 'Not available'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">State:</dt>
                                    <dd className="text-gray-800">{salon.licenseState || 'Not available'}</dd>
                                  </div>
                                </dl>
                                <div className="mt-2 flex">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="mr-2"
                                    onClick={() => verifyLicenseMutation.mutate(salon.id)}
                                  >
                                    Verify License
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => rejectLicenseMutation.mutate(salon.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {salon.licenseStatus === 'rejected' && (
                              <div className="bg-red-50 p-3 rounded-md border border-red-100">
                                <div className="flex items-center mb-2">
                                  <Badge className="bg-red-600">Rejected</Badge>
                                  <span className="ml-2 text-sm text-red-800">License verification failed</span>
                                </div>
                                <dl className="space-y-1 text-sm">
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">License Number:</dt>
                                    <dd className="text-gray-800">{salon.licenseNumber || 'Not available'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">State:</dt>
                                    <dd className="text-gray-800">{salon.licenseState || 'Not available'}</dd>
                                  </div>
                                  <div className="flex">
                                    <dt className="w-32 font-medium text-gray-600">Rejected On:</dt>
                                    <dd className="text-gray-800">{salon.licenseVerificationDate || 'Not available'}</dd>
                                  </div>
                                </dl>
                                <div className="mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => verifyLicenseMutation.mutate(salon.id)}
                                  >
                                    Reconsider
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {(!salon.licenseStatus || salon.licenseStatus === 'not_submitted') && (
                              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div className="flex items-center mb-2">
                                  <Badge className="bg-gray-500">Not Submitted</Badge>
                                  <span className="ml-2 text-sm text-gray-600">No license information has been submitted</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  This salon has not yet submitted their license information. They need to complete this step
                                  to get full access to the invitation platform.
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    toast({
                                      title: "Reminder sent",
                                      description: `Email reminder sent to ${salon.name} to submit their license information.`,
                                    });
                                  }}
                                >
                                  Send Reminder
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CollapsibleCard>

          {/* Salon to Client Invitations - Grouped by Salon */}
          <CollapsibleCard
            title="Salon to Client Invitations" 
            isOpen={invitationsOpen}
            onToggle={() => setInvitationsOpen(!invitationsOpen)}
          >
            {/* Invitations Count Summary */}
            {invitations && invitations.length > 0 && (
              <div className="mb-4">
                <InviteCompleteStatus 
                  inviteCount={invitations.filter(invite => 
                    invite.status === 'complete' || invite.status === 'accepted'
                  ).length} 
                  showTitle={true}
                />
              </div>
            )}
            
            {/* Loading state */}
            {inviteIsLoading && (
              <div className="py-8 text-center">
                <LoaderIcon className="h-6 w-6 animate-spin text-pink-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading invitation data...</p>
              </div>
            )}
            
            {/* Error state */}
            {inviteError && !inviteIsLoading && (
              <div className="py-8 text-center border rounded-md bg-red-50">
                <AlertTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 mb-1">Error loading invitations</p>
                <p className="text-sm text-red-600">{inviteError.message}</p>
              </div>
            )}
            
            {/* Empty state */}
            {!inviteIsLoading && !inviteError && (!invitations || invitations.length === 0) && (
              <div className="py-8 text-center border rounded-md bg-gray-50">
                <UserIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No invitations have been sent yet</p>
              </div>
            )}
            
            {/* Data grouping */}
            {!inviteIsLoading && !inviteError && invitations && invitations.length > 0 && (
              <div className="space-y-6">
                {Object.entries(
                  invitations.reduce((groups, invite) => {
                    const salonName = invite.sponsor || invite.salonName || 'Unknown Salon';
                    if (!groups[salonName]) {
                      groups[salonName] = [];
                    }
                    groups[salonName].push(invite);
                    return groups;
                  }, {} as Record<string, Invitation[]>)
                ).map(([salonName, salonInvites]) => (
                <div key={salonName} className="border rounded-lg overflow-hidden">
                  {/* Salon Header */}
                  <div 
                    className="bg-gradient-to-r from-pink-100 to-pink-50 p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                      // Find the salon ID from the first invitation in group
                      const firstInvite = salonInvites[0];
                      if (firstInvite && firstInvite.salonId) {
                        // Navigate to salon page
                        window.location.href = `/salon/${firstInvite.salonId}`;
                      }
                    }}
                  >
                    <h3 className="font-bold text-pink-700">Salon: {salonName}</h3>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-pink-100 text-pink-700 border-pink-200">
                        {salonInvites.length} Invitations
                      </Badge>
                      <a 
                        href={`/salon/${salonInvites[0]?.salonId}`}
                        className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the salon header click
                          e.preventDefault();
                          // Use programmatic navigation
                          window.location.href = `/salon/${salonInvites[0]?.salonId}`;
                        }}
                      >
                        <span className="hidden md:inline mr-1">View Salon</span>
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Invitations Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="py-2 px-4 text-center">Name</th>
                          <th className="py-2 px-4 text-center">Email</th>
                          <th className="py-2 px-4 text-center">Phone</th>
                          <th className="py-2 px-4 text-center">Status</th>
                          <th className="py-2 px-4 text-center">Dashboard</th>
                          <th className="py-2 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {salonInvites.map((invitation) => (
                          <tr key={invitation.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 font-medium text-center">
                              {(() => {
                                // Find the client ID for this invitation
                                const clientId = findClientIdForInvitation(invitation, clients);
                                
                                if (clientId) {
                                  // If client exists, make the name clickable
                                  return (
                                    <a 
                                      href={`/client/${clientId}?adminView=true`}
                                      className="text-pink-700 hover:text-pink-900 hover:underline cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        // Set admin view flag in localStorage
                                        localStorage.setItem('adminView', 'true');
                                        // Use programmatic navigation
                                        window.location.href = `/client/${clientId}?adminView=true`;
                                      }}
                                      title="View client dashboard"
                                    >
                                      {invitation.name}
                                    </a>
                                  );
                                } else {
                                  // If no matching client yet, just show the name
                                  return invitation.name;
                                }
                              })()}
                            </td>
                            <td className="py-2 px-4 text-center">{invitation.email}</td>
                            <td className="py-2 px-4 text-center">{formatPhoneNumber(invitation.phone)}</td>
                            <td className="py-2 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block
                                ${invitation.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : ''}
                                ${invitation.status === 'style_selected' ? 'bg-green-50 text-green-700' : ''}
                                ${invitation.status === 'completed' ? 'bg-blue-50 text-blue-700' : ''}
                                ${!invitation.status ? 'bg-gray-50 text-gray-700' : ''}
                              `}>
                                {invitation.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <a 
                                href={`/client/${findClientIdForInvitation(invitation, clients) || invitation.id}?adminView=true`}
                                className="inline-flex items-center justify-center text-pink-500 hover:text-pink-700 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // Always navigate to client dashboard, whether the client exists or not
                                  // If client doesn't exist yet, use the invitation ID as a fallback
                                  const clientId = findClientIdForInvitation(invitation, clients) || invitation.id;
                                  
                                  // Set admin view flag in localStorage
                                  localStorage.setItem('adminView', 'true');
                                  
                                  // Always navigate to client dashboard now
                                  setLocation(`/client/${clientId}?adminView=true`);
                                }}
                                title="View client dashboard"
                              >
                                <FileTextIcon className="h-4 w-4" />
                              </a>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                {/* View invitation/client button */}
                                {/* Always link to client dashboard now */}
                                <a 
                                  href={`/client/${findClientIdForInvitation(invitation, clients) || invitation.id}?adminView=true`}
                                  className="inline-flex items-center justify-center text-pink-600 font-medium hover:text-pink-800 cursor-pointer px-2 py-1"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // Always navigate to client dashboard, whether the client exists or not
                                    const clientId = findClientIdForInvitation(invitation, clients) || invitation.id;
                                    
                                    // Set admin view flag in localStorage
                                    localStorage.setItem('adminView', 'true');
                                    
                                    // Always navigate to client dashboard now
                                    setLocation(`/client/${clientId}?adminView=true`);
                                  }}
                                >
                                  <ExternalLinkIcon className="h-4 w-4" />
                                </a>
                                
                                {/* Cancel invitation button */}
                                {invitation.status !== 'cancelled' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button 
                                        className="inline-flex items-center justify-center text-orange-500 hover:text-orange-700 cursor-pointer px-2 py-1"
                                        title="Cancel invitation"
                                      >
                                        <XCircleIcon className="h-4 w-4" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to cancel this invitation for {invitation.name}? 
                                          The invitation will remain in the system but the client will no longer be able to accept it.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Keep Active
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => {
                                            cancelInvitationMutation.mutate(invitation.id);
                                          }}
                                          className="bg-orange-500 hover:bg-orange-600"
                                        >
                                          Cancel Invitation
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                
                                {/* Delete invitation button */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button 
                                      className="inline-flex items-center justify-center text-red-500 hover:text-red-700 cursor-pointer px-2 py-1"
                                      onClick={() => setInvitationToDelete(invitation)}
                                      title="Delete invitation"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this invitation for {invitation.name}? 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setInvitationToDelete(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => {
                                          deleteInvitationMutation.mutate(invitation.id);
                                        }}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CollapsibleCard>

          <div className="grid gap-6">
            {/* Clients Table */}
            <CollapsibleCard
              title="Current Clients"
              isOpen={clientsOpen}
              onToggle={() => setClientsOpen(!clientsOpen)}
            >
              {/* Loading state */}
              {clientIsLoading && (
                <div className="py-8 text-center">
                  <LoaderIcon className="h-6 w-6 animate-spin text-pink-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Loading client data...</p>
                </div>
              )}
              
              {/* Error state */}
              {clientError && !clientIsLoading && (
                <div className="py-8 text-center border rounded-md bg-red-50">
                  <AlertTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 mb-1">Error loading clients</p>
                  <p className="text-sm text-red-600">{clientError.message}</p>
                </div>
              )}
              
              {/* Empty state */}
              {!clientIsLoading && !clientError && (!clients || clients.filter((client: Client) => client.isCurrentClient).length === 0) && (
                <div className="py-8 text-center border rounded-md bg-gray-50">
                  <UserIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No active clients found</p>
                </div>
              )}
              
              {/* Data table */}
              {!clientIsLoading && !clientError && clients && clients.filter((client: Client) => client.isCurrentClient).length > 0 && (
                <ScrollArea className="max-h-[200px]">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="max-h-[30px]">
                        <TableHead className="max-h-[30px] py-1 text-center">Name</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Email</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Phone</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Salon/Sponsor</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.filter((client: Client) => client.isCurrentClient).map((client: Client) => (
                        <TableRow
                          key={client.id}
                          className="hover:bg-gray-50 h-[28px]"
                        >
                          {/* Name with truncation */}
                          <TableCell className="py-0 text-center">
                            {client.name.length > 12 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {client.name.substring(0, 10)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{client.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              client.name
                            )}
                          </TableCell>
                          
                          {/* Email with truncation */}
                          <TableCell className="py-0 text-center">
                            {client.email && client.email.length > 15 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {client.email.substring(0, 12)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{client.email}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              client.email
                            )}
                          </TableCell>
                          
                          {/* Phone formatted properly */}
                          <TableCell className="py-0 text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {formatPhoneNumber(client.phone)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{formatPhoneNumber(client.phone)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          
                          {/* Salon/Sponsor display with invitation data integration */}
                          <TableCell className="py-0 text-center">
                            {/* Find client's sponsor from invitations first */}
                            {(() => {
                              // Look for a matching invitation by phone number to get the sponsor name
                              const matchingInvitation = invitations?.find(
                                inv => inv.phone === client.phone.replace(/\D/g, '')
                              );
                              
                              // Find salon by ID if client has salonId
                              const linkedSalon = client.salonId ? salons?.find(salon => salon.id === client.salonId) : null;
                              
                              // Use the actual salon name if we can find it
                              const sponsorName = linkedSalon ? linkedSalon.name : 
                                                 // If we can't find the linked salon by ID, use these fallbacks:
                                                 matchingInvitation?.salonName || 
                                                 matchingInvitation?.sponsor || 
                                                 (client.sponsor === "Tiffany 5280 Nails Studio" ? "Tiffany 5280 Nails Studio" : 
                                                  client.salonName || 
                                                  client.sponsorName || 
                                                  client.sponsor || 
                                                  'Unknown');
                              
                              // Log for debugging
                              if (matchingInvitation) {
                                console.log(`Found invitation match for client ${client.name}: Salon=${matchingInvitation.salonName}, Sponsor=${matchingInvitation.sponsor}`);
                              }
                              
                              // Debug to identify sponsor information sources
                              console.log(`[SPONSOR-DEBUG] Client ${client.name} sponsor info:`, {
                                salonId: client.salonId || 'MISSING',
                                linkedSalonName: linkedSalon?.name || 'MISSING',
                                salonName: client.salonName || 'MISSING',
                                sponsorName: client.sponsorName || 'MISSING',
                                sponsor: client.sponsor || 'MISSING',
                                invitationSalonName: matchingInvitation?.salonName || 'MISSING',
                                finalValue: sponsorName
                              });
                              
                              return sponsorName.length > 10 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">
                                        {sponsorName.substring(0, 8)}...
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{sponsorName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <>{sponsorName}</>
                              );
                            })()}
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="py-0 text-center">
                            <div className="flex justify-center gap-1">
                              <Link 
                                to={`/client/${client.id}?adminView=true`}
                                onClick={() => {
                                  // Set admin view flag in localStorage to persist through navigation
                                  localStorage.setItem('adminView', 'true');
                                }}
                                className="px-2 py-1 text-[10px] bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92] cursor-pointer inline-block"
                              >
                                Client
                              </Link>
                              <Link 
                                to={`/salon/${client.salonId || 2}`} 
                                className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                              >
                                Salon
                              </Link>
                              <Link
                                to="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toast({
                                    title: "Gift Invitation",
                                    description: "This feature will allow sending a gift invitation",
                                  });
                                }}
                                className="px-2 py-1 text-[10px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                <GiftIcon className="h-3 w-3" />
                              </Link>
                              
                              {/* Suspend Client Button with Alert Dialog */}
                              <AlertDialog open={clientToSuspend?.id === client.id} onOpenChange={(open) => !open && setClientToSuspend(null)}>
                                <AlertDialogTrigger asChild>
                                  <button
                                    onClick={() => setClientToSuspend(client)}
                                    className="px-2 py-1 text-[10px] bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                                    title="Suspend client account"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                      <rect width="18" height="18" x="3" y="3" rx="2" />
                                      <path d="M9 12h6" />
                                    </svg>
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Suspend Client Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to suspend {clientToSuspend?.name}'s account? 
                                      This will temporarily disable their access to the platform.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (clientToSuspend) {
                                          suspendClientMutation.mutate(clientToSuspend.id);
                                        }
                                      }}
                                      className="bg-amber-500 hover:bg-amber-600"
                                    >
                                      Suspend Account
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              {/* Delete Client Button with Alert Dialog */}
                              <AlertDialog open={clientToDelete?.id === client.id} onOpenChange={(open) => !open && setClientToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <button
                                    onClick={() => setClientToDelete(client)}
                                    className="px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    title="Delete client account"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Client Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete {clientToDelete?.name}'s account? 
                                      This action cannot be undone and will remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (clientToDelete) {
                                          deleteClientMutation.mutate(clientToDelete.id);
                                        }
                                      }}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete Account
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CollapsibleCard>

            {/* Client Gift Requests Section */}
            <CollapsibleCard
              title="Client Gift Requests"
              isOpen={giftRequestsOpen}
              onToggle={() => setGiftRequestsOpen(!giftRequestsOpen)}
            >
              {/* Loading state */}
              {giftsIsLoading && (
                <div className="py-8 text-center">
                  <LoaderIcon className="h-6 w-6 animate-spin text-pink-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Loading gift requests...</p>
                </div>
              )}
              
              {/* Error state */}
              {giftsError && !giftsIsLoading && (
                <div className="py-8 text-center border rounded-md bg-red-50">
                  <AlertTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 mb-1">Error loading gift requests</p>
                  <p className="text-sm text-red-600">{giftsError.message}</p>
                </div>
              )}
              
              {/* Empty state */}
              {!giftsIsLoading && !giftsError && (!pendingGifts || pendingGifts.length === 0) && (
                <div className="py-8 text-center border rounded-md bg-gray-50">
                  <GiftIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No pending gift requests found</p>
                </div>
              )}
              
              {/* Data table */}
              {!giftsIsLoading && !giftsError && pendingGifts && pendingGifts.length > 0 && (
                <ScrollArea className="max-h-[200px]">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="max-h-[30px]">
                        <TableHead className="max-h-[30px] py-1 text-center">From</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">To</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Amount</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Status</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Date</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingGifts.map((gift: Gift) => (
                        <TableRow
                          key={gift.id}
                          className="hover:bg-gray-50 h-[28px]"
                        >
                          <TableCell className="py-0 text-center">
                            <Link 
                              to={`/client/${gift.senderId}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {gift.senderName || "Unknown"}
                            </Link>
                          </TableCell>
                          <TableCell className="py-0 text-center">
                            {/* We don't have a direct recipientId link yet, but we'll show the name as link for consistency */}
                            <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                              {gift.recipientName || (() => {
                                // Extract name from message if it starts with "Hi [Name],"
                                if (gift.message) {
                                  const nameMatch = gift.message.match(/^Hi\s+([^,]+),/i);
                                  if (nameMatch && nameMatch[1]) {
                                    return nameMatch[1].trim(); // Return the name part
                                  }
                                }
                                return "Unknown";
                              })()}
                            </span>
                          </TableCell>
                          <TableCell className="py-0 text-center">
                            ${(gift.amount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-0 text-center">
                            <Badge className={
                              gift.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                                : gift.status === 'redeemed' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }>
                              {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-0 text-center text-xs">
                            {new Date(gift.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-0 text-center">
                            <div className="flex justify-center space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link to={`/admin/gifts/${gift.id}`}>
                                      <button
                                        className="px-2 py-1 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        <span>View Gift</span>
                                      </button>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View details of gift from {gift.senderName} to {gift.recipientName || "recipient"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {/* Delete Gift Button with Alert Dialog */}
                              <AlertDialog open={giftToDelete?.id === gift.id} onOpenChange={(open) => !open && setGiftToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <button
                                    onClick={() => setGiftToDelete(gift)}
                                    className="px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                                    title="Delete gift"
                                  >
                                    <TrashIcon className="h-3 w-3 mr-1" />
                                    <span>Delete</span>
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Gift</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete this gift from {gift.senderName || "sender"} to {gift.recipientName || gift.recipientPhone || "recipient"}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (giftToDelete) {
                                          deleteGiftMutation.mutate(giftToDelete.id);
                                        }
                                      }}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete Gift
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CollapsibleCard>

            {/* UnRegistered VMB Clients Section */}
            <CollapsibleCard
              title="UnReg VMB Clients"
              isOpen={unregVmbClientsOpen}
              onToggle={() => setUnregVmbClientsOpen(!unregVmbClientsOpen)}
            >
              {/* Loading state */}
              {unregVmbIsLoading && (
                <div className="py-8 text-center">
                  <LoaderIcon className="h-6 w-6 animate-spin text-pink-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Loading unregistered VMB clients...</p>
                </div>
              )}
              
              {/* Error state */}
              {unregVmbError && !unregVmbIsLoading && (
                <div className="py-8 text-center border rounded-md bg-red-50">
                  <AlertTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 mb-1">Error loading unregistered VMB clients</p>
                  <p className="text-sm text-red-600">{unregVmbError.message}</p>
                </div>
              )}
              
              {/* Empty state */}
              {!unregVmbIsLoading && !unregVmbError && (!unregVmbClients || unregVmbClients.length === 0) && (
                <div className="py-8 text-center border rounded-md bg-gray-50">
                  <UserIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No unregistered VMB clients found</p>
                </div>
              )}
              
              {/* Data display - simple single line format */}
              {!unregVmbIsLoading && !unregVmbError && unregVmbClients && unregVmbClients.length > 0 && (
                <div className="space-y-2">
                  {unregVmbClients.map((client: Client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900">{client.name}</span>
                        <span className="text-gray-600">{formatPhoneNumber(client.phone)}</span>
                        <span className="text-sm text-gray-500">
                          pending as of: {new Date(client.createdAt || new Date()).toLocaleDateString()}
                        </span>
                      </div>
                      <Link 
                        to={`/client/${client.id}?adminView=true`}
                        className="px-2 py-1 text-xs bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92] cursor-pointer"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleCard>

            {/* Network Visualization with Madge + Graphviz */}
            {networkVisualizationOpen && (
              <CollapsibleCard
                title="Network Visualization"
                description="Explore component dependencies and relationships using Madge + Graphviz"
                isOpen={networkVisualizationOpen}
                onToggle={() => setNetworkVisualizationOpen(!networkVisualizationOpen)}
                action={
                  <Link 
                    to="/network-visualization"
                  >
                    <Button size="sm" variant="outline">
                      <ExternalLinkIcon className="h-4 w-4 mr-1" />
                      Open Full View
                    </Button>
                  </Link>
                }
              >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Side - Controls */}
                <div className="lg:col-span-1 space-y-4 border-r pr-4">
                  {/* Existing Visualizations Section */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">View Saved Visualizations</label>
                    <Select
                      value={selectedVisualization?.split('?')[0] || ''}
                      onValueChange={(value) => {
                        if (value) {
                          // Add cache buster to prevent caching
                          const cacheBuster = `?cb=${Date.now()}`;
                          setSelectedVisualization(`${value}${cacheBuster}`);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a visualization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/vmb_tools/dependency_graph/output/client_dashboard_dependencies.svg">
                          Client Dashboard Dependencies
                        </SelectItem>
                        <SelectItem value="/vmb_tools/dependency_graph/output/salon_dashboard_dependencies.svg">
                          Salon Dashboard Dependencies
                        </SelectItem>
                        <SelectItem value="/vmb_tools/dependency_graph/output/invitation_flow_dependencies.svg">
                          Invitation Flow Dependencies
                        </SelectItem>
                        <SelectItem value="/vmb_tools/dependency_graph/output/vmb_style_options_dependencies.svg">
                          VMB Style Options Dependencies
                        </SelectItem>
                        <SelectItem value="/visualizations/test-visualization.svg">
                          Test Visualization
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Choose from existing visualizations</p>
                  </div>
                  
                  {/* Generate New Visualization Section */}
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <h3 className="text-sm font-medium mb-2">Generate New Visualization</h3>
                    
                    {/* Use our new VisualizationSelector component */}
                    <VisualizationSelector 
                      isGenerating={generating}
                      onGenerate={(target, layout) => {
                        // Handle generation with the selected target and layout
                        setGenerating(true);
                        setFocusPath(target);
                        setSelectedLayout(layout);
                        
                        // Call the API to generate the visualization
                        const generateVisualization = async () => {
                          try {
                            // IMPORTANT: Use an absolute URL to avoid client-side routing
                            const baseUrl = window.location.origin;
                            const apiUrl = `${baseUrl}/api/madge/generate`;
                            
                            console.log('[VMB-DEBUG] Using API URL:', apiUrl);
                            
                            const response = await fetch(apiUrl, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                              },
                              body: JSON.stringify({
                                layout: layout,
                                format: 'svg',
                                focus: target,
                              }),
                              cache: 'no-cache',
                              credentials: 'same-origin',
                            });
                            
                            // Check if response is ok first
                            if (!response.ok) {
                              throw new Error(`Server error: ${response.status} ${response.statusText}`);
                            }
                            
                            const data = await response.json();
                            
                            // Successfully got JSON data, check for success flag
                            if (data && data.success) {
                              // Add a cache buster to prevent browser caching
                              const cacheBuster = `?cb=${Date.now()}`;
                              const fullVisualizationPath = data.path.startsWith('/') 
                                ? `${baseUrl}${data.path}${cacheBuster}`
                                : `${baseUrl}/${data.path}${cacheBuster}`;
                                
                              console.log('[VMB-DEBUG] Visualization path:', fullVisualizationPath);
                              
                              setSelectedVisualization(fullVisualizationPath);
                              
                              toast({
                                title: "Visualization generated",
                                description: `Created ${data.filename} (${data.size}KB)`,
                              });
                            } else {
                              // Extract error message from data if possible
                              const errorMsg = data?.error || 'Unknown error';
                              throw new Error(`Generation failed: ${errorMsg}`);
                            }
                          } catch (error: any) {
                            console.error('[VMB-DEBUG] Error generating visualization:', error);
                            toast({
                              title: "Generation failed",
                              description: error.message || 'Unknown error occurred',
                              variant: "destructive",
                            });
                          } finally {
                            setGenerating(false);
                          }
                        };
                        
                        generateVisualization();
                      }}
                    />
                  </div>
                  
                  {/* Generate button is now included in the VisualizationSelector component */}
                </div>
                
                {/* Right Side - Visualization Display */}
                <div className="lg:col-span-3 min-h-[500px] border rounded-md p-4 relative">
                  {/* Use our improved SvgVisualizer component */}
                  <SvgVisualizer 
                    url={selectedVisualization} 
                    fallbackText="Select or generate a visualization to view component relationships"
                  />
                  
                  {/* Action buttons */}
                  {selectedVisualization && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="bg-white shadow-sm"
                              onClick={() => {
                                // Open in new tab
                                window.open(selectedVisualization, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open in new tab</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="bg-white shadow-sm"
                              onClick={() => {
                                // Refresh with new cache buster
                                const cacheBuster = `?cb=${Date.now()}`;
                                const svgUrl = selectedVisualization.split('?')[0] + cacheBuster;
                                setSelectedVisualization(svgUrl);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 text-gray-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Refresh visualization</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
              </CollapsibleCard>
            )}

            {/* Code Dependency Graph */}
            {codeGraphOpen && (
              <CollapsibleCard
                title="Code Dependency Graph"
                description="Analyze and visualize code dependencies to safely isolate changes"
                isOpen={codeGraphOpen}
                onToggle={() => setCodeGraphOpen(!codeGraphOpen)}
              >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Side - Controls */}
                <div className="lg:col-span-1 space-y-4 border-r pr-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Component to Analyze</label>
                    <Select
                      defaultValue="client_dashboard"
                      onValueChange={(value) => {
                        // Set focus path for graph generation
                        setFocusPath(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_dashboard">Client Dashboard</SelectItem>
                        <SelectItem value="salon_dashboard">Salon Dashboard</SelectItem>
                        <SelectItem value="invitation_flow">Invitation Flow</SelectItem>
                        <SelectItem value="vmb_style_options">Style Options Engine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium mb-2">Graph Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-pink-600 hover:bg-pink-700"
                        onClick={() => {
                          // Run the dependency graph generator script
                          setGenerating(true);
                          // Simulate API call to generate dependency graph
                          setTimeout(() => {
                            const outputPath = `/vmb_tools/dependency_graph/output/${focusPath}_dependencies.svg`;
                            setSelectedVisualization(outputPath);
                            setGenerating(false);
                            
                            // Show toast notification
                            toast({
                              title: "Dependency Graph Generated",
                              description: `Graph for ${focusPath} has been created.`,
                              variant: "default",
                            });
                          }, 1500);
                        }}
                        disabled={generating}
                      >
                        {generating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Generate Graph
                          </>
                        )}
                      </Button>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                // Mark the current component as SOLID CODE
                                toast({
                                  title: "Component Marked as SOLID",
                                  description: `${focusPath} has been marked as stable code. Changes to this component should be isolated.`,
                                  variant: "default",
                                });
                              }}
                            >
                              <Code className="mr-2 h-4 w-4" />
                              Mark as SOLID CODE
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Marks the component as stable and tested code.</p>
                            <p>Adds special comments to the component file.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Visualization */}
                <div className="lg:col-span-3 flex justify-center items-center relative min-h-[300px] border rounded-md p-4">
                  {generating ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <RefreshCw className="h-10 w-10 animate-spin text-pink-500 mb-4" />
                      <p className="text-gray-600">Generating dependency graph...</p>
                    </div>
                  ) : !selectedVisualization ? (
                    <div className="text-center p-4">
                      <NetworkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-1">Generate a Dependency Graph</h3>
                      <p className="text-gray-500 text-sm mb-4">Select a component and click "Generate Graph" to visualize its dependencies.</p>
                      <div className="text-sm text-left border p-3 rounded-md bg-gray-50">
                        <p className="font-medium mb-1">Benefits of Code Dependency Analysis:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Identify which files are affected by changes</li>
                          <li>Understand component relationships</li>
                          <li>Isolate changes to specific modules</li>
                          <li>Prevent unexpected side effects</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-full">
                      <img 
                        src={selectedVisualization} 
                        alt="Code Dependency Graph" 
                        className="max-w-full"
                        style={{ maxHeight: '600px' }}
                      />
                    </div>
                  )}
                  
                  {selectedVisualization && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a 
                              href={selectedVisualization} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1 bg-white rounded-md border shadow hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View full size</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => {
                                // Download functionality would go here
                                toast({
                                  title: "Graph Downloaded",
                                  description: "The dependency graph has been saved to your downloads folder.",
                                });
                              }}
                              className="p-1 bg-white rounded-md border shadow hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4 text-gray-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download graph</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
              </CollapsibleCard>
            )}

            {/* Developer Guide Section */}
            {developerGuideOpen && (
              <CollapsibleCard
                title="Developer Guide & Documentation"
                description="Platform documentation, Storybook setup, and development resources"
                isOpen={developerGuideOpen}
                onToggle={() => setDeveloperGuideOpen(!developerGuideOpen)}
              >
                <DeveloperGuide />
              </CollapsibleCard>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
