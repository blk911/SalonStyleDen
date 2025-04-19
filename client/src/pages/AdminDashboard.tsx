import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";



interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  salonName?: string;
  isCurrentClient: boolean;
  salonId?: number; // Added salonId to Client interface
}

interface Salon {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
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

  const { data: clients, error: clientError, isLoading: clientIsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'], // Fixed query key to match the actual API endpoint
    queryFn: async () => {
      try {
        console.log('Fetching clients from API...');
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const data = await response.json();
        console.log('Fetched clients:', data);
        return data;
      } catch (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
    },
  });

  const { data: salons, error: salonError, isLoading: salonIsLoading } = useQuery<Salon[]>({
    queryKey: ['/api/salons'], // Fixed query key to match the actual API endpoint
    queryFn: async () => {
      try {
        console.log('Fetching salons from API...');
        const response = await fetch('/api/salons');
        if (!response.ok) {
          throw new Error('Failed to fetch salons');
        }
        const data = await response.json();
        console.log('Fetched salons:', data);
        return data;
      } catch (error) {
        console.error('Error fetching salons:', error);
        throw error;
      }
    },
  });
  
  // New query to fetch all invitations
  const { data: invitations, error: inviteError, isLoading: inviteIsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    queryFn: async () => {
      try {
        console.log('Fetching invitations from API...');
        const response = await fetch('/api/invitations?limit=50'); // Get more invitations for admin view
        if (!response.ok) {
          throw new Error('Failed to fetch invitations');
        }
        const data = await response.json();
        console.log('Fetched invitations:', data);
        return data;
      } catch (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }
    },
  });
  
  // Query to fetch activity logs, especially VMB invitation logs
  const { data: activityLogs, error: logsError, isLoading: logsIsLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      try {
        console.log('Fetching activity logs from API...');
        const response = await fetch('/api/activity-logs?limit=50'); // Get more logs for admin view
        if (!response.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        const data = await response.json();
        console.log('Fetched activity logs:', data);
        return data;
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
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

  if (clientIsLoading || salonIsLoading || inviteIsLoading || logsIsLoading) return <div>Loading...</div>;
  if (clientError) return <div>Error loading clients: {clientError.message}</div>;
  if (salonError) return <div>Error loading salons: {salonError.message}</div>;
  if (inviteError) return <div>Error loading invitations: {inviteError.message}</div>;
  if (logsError) return <div>Error loading activity logs: {logsError.message}</div>;


  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Ven Me Baby Style Options */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Ven Me, Baby! Style Options</h2>
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
            </CardContent>
          </Card>



          <div className="grid gap-6">

            
            {/* VMB Activity Logs */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">VMB Activity Logs</h2>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="max-h-[30px]">
                        <TableHead className="max-h-[30px] py-1">Type</TableHead>
                        <TableHead className="max-h-[30px] py-1">Description</TableHead>
                        <TableHead className="max-h-[30px] py-1">Client ID</TableHead>
                        <TableHead className="max-h-[30px] py-1">Salon ID</TableHead>
                        <TableHead className="max-h-[30px] py-1">Date/Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs?.filter(log => log.type === 'vmb_invitation_sent').map((log: ActivityLog) => (
                        <TableRow
                          key={log.id}
                          className="hover:bg-gray-50 h-[28px]"
                        >
                          <TableCell className="py-0">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200">
                              {log.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-0">
                            {log.description.length > 40 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {log.description.substring(0, 38)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{log.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              log.description
                            )}
                          </TableCell>
                          <TableCell className="py-0">
                            {log.clientId ? (
                              <Link to={`/client/${log.clientId}`} className="text-blue-600 hover:underline">
                                {log.clientId}
                              </Link>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell className="py-0">
                            {log.salonId ? (
                              <Link to={`/salon/${log.salonId}`} className="text-blue-600 hover:underline">
                                {log.salonId}
                              </Link>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell className="py-0">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {activityLogs?.filter(log => log.type === 'vmb_invitation_sent').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No VMB salon invitation activity found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Clients Table */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Current Clients</h2>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="max-h-[30px]">
                        <TableHead className="max-h-[30px] py-1">Name</TableHead>
                        <TableHead className="max-h-[30px] py-1">Email</TableHead>
                        <TableHead className="max-h-[30px] py-1">Phone</TableHead>
                        <TableHead className="max-h-[30px] py-1">Salon</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients?.filter((client: Client) => client.isCurrentClient).map((client: Client) => (
                        <TableRow
                          key={client.id}
                          className="hover:bg-gray-50 h-[28px]"
                        >
                          {/* Name with truncation */}
                          <TableCell className="py-0">
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
                          <TableCell className="py-0">
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
                          
                          {/* Phone with truncation */}
                          <TableCell className="py-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {client.phone.substring(0, 7)}•••
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{client.phone}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          
                          {/* Salon name with truncation */}
                          <TableCell className="py-0">
                            {client.salonName && client.salonName.length > 10 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {client.salonName.substring(0, 8)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{client.salonName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              client.salonName || 'N/A'
                            )}
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="py-0 text-right">
                            <div className="flex justify-end gap-1">
                              <Link href={`/client/${client.id}`}>
                                <button className="px-2 py-1 text-[10px] bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92]">
                                  Client
                                </button>
                              </Link>
                              {client.salonId && (
                                <Link href={`/salon/${client.salonId}`}>
                                  <button className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200">
                                    Salon
                                  </button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Salons Table */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Salons</h2>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="max-h-[30px]">
                        <TableHead className="max-h-[30px] py-1">ID</TableHead>
                        <TableHead className="max-h-[30px] py-1">Name</TableHead>
                        <TableHead className="max-h-[30px] py-1">Owner</TableHead>
                        <TableHead className="max-h-[30px] py-1">Email</TableHead>
                        <TableHead className="max-h-[30px] py-1">Phone</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salons?.map((salon: Salon) => (
                        <TableRow
                          key={salon.id}
                          className="hover:bg-gray-50 h-[30px]"
                        >
                          <TableCell className="py-0">{salon.id}</TableCell>
                          <TableCell className="py-0">{salon.name}</TableCell>
                          <TableCell className="py-0">{salon.ownerName}</TableCell>
                          <TableCell className="py-0">{salon.email}</TableCell>
                          <TableCell className="py-0">{salon.phone}</TableCell>
                          <TableCell className="py-0 text-right">
                            <div className="flex justify-end gap-1">
                              <Link href={`/salon/${salon.id}`.replace(/\/\//g, '/')}>
                                <button className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200">
                                  Salon Page
                                </button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}