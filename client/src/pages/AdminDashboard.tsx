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
import { ExternalLink as ExternalLinkIcon } from "lucide-react";



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

          {/* Salon to Client Invitations - Grouped by Salon */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Salon to Client Invitations</h2>
              
              {/* Group invitations by salon */}
              {invitations && invitations.length > 0 ? (
                <div className="space-y-6">
                  {/* Process and group invitations by salon */}
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
                            setLocation(`/salon/${firstInvite.salonId}`);
                          }
                        }}
                      >
                        <h3 className="font-bold text-pink-700">{salonName}</h3>
                        <div className="flex items-center">
                          <Badge className="mr-2 bg-pink-100 text-pink-700 border-pink-200">
                            {salonInvites.length} Invitations
                          </Badge>
                          <Link 
                            to={`/salon/${salonInvites[0]?.salonId}`}
                            className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the salon header click
                              if (salonInvites[0]?.salonId) {
                                setLocation(`/salon/${salonInvites[0].salonId}`);
                              }
                            }}
                          >
                            <span className="hidden md:inline mr-1">View Salon</span>
                            <ExternalLinkIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                      
                      {/* Invitations Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="py-2 px-4">Name</th>
                              <th className="py-2 px-4">Email</th>
                              <th className="py-2 px-4">Phone</th>
                              <th className="py-2 px-4">Status</th>
                              <th className="py-2 px-4">Date</th>
                              <th className="py-2 px-4 text-right">Page</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {salonInvites.map((invitation) => (
                              <tr key={invitation.id} className="hover:bg-gray-50">
                                <td className="py-2 px-4">{invitation.name}</td>
                                <td className="py-2 px-4">{invitation.email}</td>
                                <td className="py-2 px-4">{formatPhoneNumber(invitation.phone)}</td>
                                <td className="py-2 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                                    ${invitation.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : ''}
                                    ${invitation.status === 'style_selected' ? 'bg-green-50 text-green-700' : ''}
                                    ${invitation.status === 'completed' ? 'bg-blue-50 text-blue-700' : ''}
                                    ${!invitation.status ? 'bg-gray-50 text-gray-700' : ''}
                                  `}>
                                    {invitation.status || 'pending'}
                                  </span>
                                </td>
                                <td className="py-2 px-4">{new Date(invitation.createdAt).toLocaleDateString()}</td>
                                <td className="py-2 px-4 text-right">
                                  <Link 
                                    to={`/invitation/${invitation.inviteHash}`}
                                    className="inline-flex items-center text-pink-600 font-medium gap-1 text-sm hover:text-pink-800 cursor-pointer"
                                    onClick={() => {
                                      // Navigate to client invitation page using the invitation hash
                                      setLocation(`/invitation/${invitation.inviteHash}`);
                                    }}
                                  >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No invitations have been sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>



          <div className="grid gap-6">

            


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
                              <Link 
                                to={`/client/${client.id}`}
                                onClick={() => setLocation(`/client/${client.id}`)}
                                className="px-2 py-1 text-[10px] bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92]"
                              >
                                Client
                              </Link>
                              {client.salonId && (
                                <Link 
                                  to={`/salon/${client.salonId}`}
                                  onClick={() => setLocation(`/salon/${client.salonId}`)}
                                  className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                                >
                                  Salon
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
                              <Link 
                                to={`/salon/${salon.id}`}
                                onClick={() => setLocation(`/salon/${salon.id}`)}
                                className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                              >
                                Salon Page
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