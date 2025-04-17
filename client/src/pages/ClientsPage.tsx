import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search as SearchIcon, 
  User as UserIcon, 
  Phone as PhoneIcon, 
  AtSign as AtSignIcon,
  ArrowUpDown as SortIcon,
  Filter as FilterIcon,
  Calendar as CalendarIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl, formatPhoneNumber } from "@/lib/utils";

// Define interfaces
interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  isCurrentClient: boolean;
  salonId?: number;
  salonName?: string;
  createdAt: string;
  photoUrl?: string;
}

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  salonId: number;
  salonName?: string;
  sponsor?: string;
  createdAt: string;
  inviteHash?: string;
  firstServiceDate?: string;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all-clients");

  // Fetch clients data
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    }
  });
  
  // Fetch invitations data
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    queryFn: async () => {
      const response = await fetch('/api/invitations');
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }
      return response.json();
    }
  });

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );
  
  // Filter invitations based on search term
  const filteredInvitations = invitations.filter(invite => 
    invite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.phone.includes(searchTerm) ||
    (invite.inviteHash && invite.inviteHash.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get statistics
  const totalClients = clients.length;
  const activeClients = clients.filter(client => client.isCurrentClient).length;
  const totalInvitations = invitations.length;
  const pendingInvitations = invitations.filter(invite => invite.status === 'pending').length;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-pink-100 to-pink-50 py-8 border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold text-pink-800">Client Directory</h1>
            <p className="mt-2 text-gray-600">Manage and view all clients and invitations in one place</p>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-6 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-pink-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Total Clients</p>
                  <p className="text-3xl font-semibold text-pink-700">{totalClients}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Active Clients</p>
                  <p className="text-3xl font-semibold text-pink-700">{activeClients}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">All Invitations</p>
                  <p className="text-3xl font-semibold text-pink-700">{totalInvitations}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Pending Invitations</p>
                  <p className="text-3xl font-semibold text-pink-700">{pendingInvitations}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search and filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search clients by name, email, phone or hash..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <SortIcon className="h-4 w-4" />
                  Sort
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <FilterIcon className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="all-clients" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all-clients">All Clients</TabsTrigger>
                <TabsTrigger value="invitations">Invitations</TabsTrigger>
                <TabsTrigger value="active-clients">Active Clients</TabsTrigger>
              </TabsList>
              
              {/* All Clients Tab */}
              <TabsContent value="all-clients" className="mt-4">
                {clientsLoading ? (
                  <div className="text-center py-8">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No clients match your search' : 'No clients found'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map(client => (
                      <ClientCard key={client.id} client={client} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Invitations Tab */}
              <TabsContent value="invitations" className="mt-4">
                {invitationsLoading ? (
                  <div className="text-center py-8">Loading invitations...</div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No invitations match your search' : 'No invitations found'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInvitations.map(invitation => (
                      <InvitationCard key={invitation.id} invitation={invitation} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Active Clients Tab */}
              <TabsContent value="active-clients" className="mt-4">
                {clientsLoading ? (
                  <div className="text-center py-8">Loading clients...</div>
                ) : filteredClients.filter(c => c.isCurrentClient).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No active clients match your search' : 'No active clients found'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients
                      .filter(client => client.isCurrentClient)
                      .map(client => (
                        <ClientCard key={client.id} client={client} />
                      ))
                    }
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

// Client Card Component
function ClientCard({ client }: { client: Client }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border border-pink-100">
              <AvatarImage 
                src={client.photoUrl ? getImageUrl(client.photoUrl) : undefined}
                onError={(e) => { e.currentTarget.src = '/assets/salon-card.png' }}
                alt={client.name} 
              />
              <AvatarFallback className="bg-pink-100 text-pink-800">
                {client.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">{client.name}</CardTitle>
              {client.salonName && (
                <p className="text-xs text-gray-500">Client at {client.salonName}</p>
              )}
            </div>
          </div>
          <Badge variant={client.isCurrentClient ? "default" : "outline"} className="text-xs">
            {client.isCurrentClient ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          <div className="flex items-center text-gray-600">
            <PhoneIcon className="h-3 w-3 mr-2" />
            <span>{formatPhoneNumber(client.phone)}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <AtSignIcon className="h-3 w-3 mr-2" />
            <span className="truncate">{client.email}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="h-3 w-3 mr-2" />
            <span>Since {new Date(client.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Link href={`/client/${client.id}`}>
          <Button variant="outline" size="sm" className="w-full">View Profile</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Invitation Card Component
function InvitationCard({ invitation }: { invitation: Invitation }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border border-pink-100">
              <AvatarFallback className="bg-pink-50 text-pink-800">
                {invitation.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">{invitation.name}</CardTitle>
              {invitation.sponsor && (
                <p className="text-xs text-gray-500">Invited by {invitation.sponsor}</p>
              )}
            </div>
          </div>
          <Badge 
            variant={invitation.status === 'pending' ? "outline" : "default"}
            className={`text-xs ${invitation.status === 'pending' ? 'border-orange-200 bg-orange-50 text-orange-700' : ''}`}
          >
            {invitation.status || 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          <div className="flex items-center text-gray-600">
            <PhoneIcon className="h-3 w-3 mr-2" />
            <span>{formatPhoneNumber(invitation.phone)}</span>
          </div>
          
          {invitation.email && (
            <div className="flex items-center text-gray-600">
              <AtSignIcon className="h-3 w-3 mr-2" />
              <span className="truncate">{invitation.email}</span>
            </div>
          )}
          
          {invitation.inviteHash && (
            <div className="flex items-center text-gray-500 text-xs mt-1">
              <span className="font-mono">#{invitation.inviteHash}</span>
            </div>
          )}
          
          {invitation.firstServiceDate && (
            <div className="flex items-center text-gray-600">
              <CalendarIcon className="h-3 w-3 mr-2" />
              <span>Service: {new Date(invitation.firstServiceDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
}