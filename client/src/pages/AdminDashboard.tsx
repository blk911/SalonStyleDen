import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InviteCompleteStatus from "@/components/dashboard/InviteCompleteStatus";
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
  ExternalLink as ExternalLinkIcon, 
  Loader as LoaderIcon, 
  AlertTriangle as AlertTriangleIcon, 
  User as UserIcon, 
  Network as NetworkIcon,
  RefreshCw, 
  Download,
  Code, 
  Eye,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChevronDown,
  ChevronUp
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
  salonId?: number; // Added salonId to Client interface
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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedLayout, setSelectedLayout] = useState('dot');
  const [focusPath, setFocusPath] = useState('fullapp');
  const [generating, setGenerating] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  
  // Section visibility states (stored in localStorage for persistence)
  const [styleOptionsOpen, setStyleOptionsOpen] = useState(true);
  const [loremIpsumOpen, setLoremIpsumOpen] = useState(true);
  const [networkVisualizationOpen, setNetworkVisualizationOpen] = useState(true);
  const [invitationsOpen, setInvitationsOpen] = useState(true);
  const [clientsOpen, setClientsOpen] = useState(true);
  const [activityLogsOpen, setActivityLogsOpen] = useState(true);
  const [salonDirectoryOpen, setSalonDirectoryOpen] = useState(true);
  
  // State to track which salon details are expanded (initially all closed)
  const [expandedSalon, setExpandedSalon] = useState<number | null>(null);
  
  // Load section states from localStorage
  useEffect(() => {
    const loadSectionStates = () => {
      try {
        const styleOpt = localStorage.getItem('adminDashboard_styleOptionsOpen');
        const loremIpsum = localStorage.getItem('adminDashboard_loremIpsumOpen');
        const networkVis = localStorage.getItem('adminDashboard_networkVisualizationOpen');
        const invites = localStorage.getItem('adminDashboard_invitationsOpen');
        const clients = localStorage.getItem('adminDashboard_clientsOpen');
        const logs = localStorage.getItem('adminDashboard_activityLogsOpen');
        const salons = localStorage.getItem('adminDashboard_salonDirectoryOpen');
        const expanded = localStorage.getItem('adminDashboard_expandedSalon');
        
        if (styleOpt !== null) setStyleOptionsOpen(styleOpt === 'true');
        if (loremIpsum !== null) setLoremIpsumOpen(loremIpsum === 'true');
        if (networkVis !== null) setNetworkVisualizationOpen(networkVis === 'true');
        if (invites !== null) setInvitationsOpen(invites === 'true');
        if (clients !== null) setClientsOpen(clients === 'true');
        if (logs !== null) setActivityLogsOpen(logs === 'true');
        if (salons !== null) setSalonDirectoryOpen(salons === 'true');
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
      localStorage.setItem('adminDashboard_loremIpsumOpen', loremIpsumOpen.toString());
      localStorage.setItem('adminDashboard_networkVisualizationOpen', networkVisualizationOpen.toString());
      localStorage.setItem('adminDashboard_invitationsOpen', invitationsOpen.toString());
      localStorage.setItem('adminDashboard_clientsOpen', clientsOpen.toString());
      localStorage.setItem('adminDashboard_activityLogsOpen', activityLogsOpen.toString());
      localStorage.setItem('adminDashboard_salonDirectoryOpen', salonDirectoryOpen.toString());
    } catch (error) {
      console.error('Error saving section states to localStorage:', error);
    }
  }, [styleOptionsOpen, loremIpsumOpen, networkVisualizationOpen, invitationsOpen, clientsOpen, activityLogsOpen, salonDirectoryOpen]);
  
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
    if (!clientsList || clientsList.length === 0) return null;
    
    // Match by phone number (most reliable identifier)
    const matchingClient = clientsList.find(client => 
      client.phone === invitation.phone
    );
    
    return matchingClient ? matchingClient.id : null;
  };

  const { data: clients, error: clientError, isLoading: clientIsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      try {
        console.log('Fetching clients from API...');
        const response = await fetch('/api/clients');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        console.log('Fetched clients:', data);
        return data;
      } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
      }
    },
  });

  const { data: salons, error: salonError, isLoading: salonIsLoading } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    queryFn: async () => {
      try {
        console.log('Fetching salons from API...');
        const response = await fetch('/api/salons');
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch salons: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        console.log('Fetched salons:', data);
        return data;
      } catch (error) {
        console.error('Error fetching salons:', error);
        return [];
      }
    },
  });
  
  const { data: invitations, error: inviteError, isLoading: inviteIsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    queryFn: async () => {
      try {
        console.log('Fetching invitations from API...');
        const response = await fetch('/api/invitations?limit=50'); // Get more invitations for admin view
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch invitations: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        console.log('Fetched invitations:', data);
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
        console.log('Fetching activity logs from API...');
        const response = await fetch('/api/activity-logs?limit=50'); // Get more logs for admin view
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details available');
          throw new Error(`Failed to fetch activity logs: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        console.log('Fetched activity logs:', data);
        return data;
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }
    },
  });

  // Format phone numbers for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

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
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Ven Me Baby Style Options */}
          <CollapsibleCard 
            title="Ven Me, Baby! Style Options"
            isOpen={styleOptionsOpen}
            onToggle={() => setStyleOptionsOpen(!styleOptionsOpen)}
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

          {/* New Column Preparation Format with Collapsible Sections */}
          <CollapsibleCard 
            title="Lorem Ipsum Preparation"
            isOpen={loremIpsumOpen}
            onToggle={() => setLoremIpsumOpen(!loremIpsumOpen)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                <Card className="border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Dolor Sit Amet</CardTitle>
                    <CardDescription>Primary system configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CollapsibleCard
                      title="Consectetur Adipiscing"
                      isOpen={false}
                      onToggle={() => {}}
                      className="bg-blue-50 rounded-md"
                    >
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-gray-700">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies.</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border rounded p-2 text-xs bg-white">
                            <span className="font-medium block">Eleifend:</span>
                            <span className="text-gray-600">Vestibulum ante</span>
                          </div>
                          <div className="border rounded p-2 text-xs bg-white">
                            <span className="font-medium block">Primis:</span>
                            <span className="text-gray-600">In faucibus orci</span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleCard>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <Card className="border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Luctus et Ultrices</CardTitle>
                    <CardDescription>Secondary processing module</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CollapsibleCard
                      title="Posuere Cubilia Curae"
                      isOpen={false}
                      onToggle={() => {}}
                      className="bg-indigo-50 rounded-md"
                    >
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-gray-700">Donec lacinia congue felis in faucibus. Pellentesque habitant morbi tristique senectus et netus.</p>
                        <div className="flex justify-between items-center">
                          <Badge className="bg-indigo-100 text-indigo-800">Malesuada</Badge>
                          <span className="text-xs text-gray-500">Fames ac turpis</span>
                        </div>
                      </div>
                    </CollapsibleCard>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleCard>
          
          {/* Salon to Client Invitations section - completely removed as requested */}

          <div className="grid gap-6">
            {/* Current Clients section - completely removed as requested */}

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
                  <p className="text-sm text-red-600">{salonError.message}</p>
                </div>
              )}
              
              {/* Empty state */}
              {!salonIsLoading && !salonError && (!salons || salons.length === 0) && (
                <div className="py-8 text-center border rounded-md bg-gray-50">
                  <UserIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No salons found</p>
                </div>
              )}
              
              {/* Salons with collapsible entries */}
              {!salonIsLoading && !salonError && salons && salons.length > 0 && (
                <ScrollArea className="h-[400px] mt-2">
                  <div className="space-y-3">
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
                                    <dd>{clients?.filter(c => c.salonId === salon.id).length || 0} clients</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CollapsibleCard>

            {/* Network Visualization with Madge + Graphviz */}
            <CollapsibleCard
              title="Network Visualization"
              description="Explore component dependencies and relationships using Madge + Graphviz"
              isOpen={networkVisualizationOpen}
              onToggle={() => setNetworkVisualizationOpen(!networkVisualizationOpen)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Side - Controls */}
                <div className="lg:col-span-1 space-y-4 border-r pr-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Layout Algorithm</label>
                    <Select
                      value={selectedLayout}
                      onValueChange={setSelectedLayout}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dot">Hierarchical (dot)</SelectItem>
                        <SelectItem value="fdp">Force-Directed (fdp)</SelectItem>
                        <SelectItem value="twopi">Radial (twopi)</SelectItem>
                        <SelectItem value="circo">Circular (circo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Focus Path (optional)</label>
                    <Select
                      value={focusPath}
                      onValueChange={setFocusPath}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fullapp">Full Application</SelectItem>
                        <SelectItem value="client/src/components">Components</SelectItem>
                        <SelectItem value="client/src/pages">Pages</SelectItem>
                        <SelectItem value="client/src/hooks">Hooks</SelectItem>
                        <SelectItem value="client/src/contexts">Contexts</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Focus the visualization on a specific area of the codebase</p>
                  </div>
                  
                  <Button 
                    variant="default" 
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={generating}
                    onClick={async () => {
                      try {
                        setGenerating(true);
                        
                        const response = await fetch('/api/madge/generate', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            layout: selectedLayout,
                            format: 'svg',
                            focus: focusPath === 'fullapp' ? '' : focusPath,
                          }),
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || 'Failed to generate visualization');
                        }
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          setSelectedVisualization(data.path);
                          toast({
                            title: "Visualization generated",
                            description: `Created ${data.filename} (${data.size}KB)`,
                          });
                        } else {
                          throw new Error('Failed to generate visualization');
                        }
                      } catch (error: any) {
                        console.error('Error generating visualization:', error);
                        toast({
                          title: "Generation failed",
                          description: error.message,
                          variant: "destructive",
                        });
                      } finally {
                        setGenerating(false);
                      }
                    }}
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code className="h-4 w-4 mr-2" />
                        Generate Visualization
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Right Side - Visualization Display */}
                <div className="lg:col-span-3 min-h-[400px] border rounded-md p-2 flex items-center justify-center relative">
                  {!selectedVisualization ? (
                    <div className="text-center text-gray-500 space-y-3">
                      <NetworkIcon className="h-16 w-16 mx-auto text-gray-300" />
                      <p>Generate a network visualization to see component relationships</p>
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-auto flex items-center justify-center">
                      <img 
                        src={selectedVisualization} 
                        alt="Network Visualization" 
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
                            <p>Open in new tab</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a 
                              href={selectedVisualization} 
                              download
                              className="p-1 bg-white rounded-md border shadow hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4 text-gray-600" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download visualization</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}