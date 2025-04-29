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
            <h1 className="text-3xl font-bold text-pink-800 flex items-center justify-center">
              <span className="logo logo-md mr-2"><span className="ven-me">Ven Me, </span><span className="baby">Baby!</span></span> 
              Client Info Hub
            </h1>
            <p className="mt-2 text-gray-600">New Salons, Premium Offers, and More</p>
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Single Card at the top */}
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-pink-50 to-purple-50 shadow-md hover:shadow-xl transition-all border border-pink-100">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="text-pink-600 mr-6 mb-4 md:mb-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 17V8c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v9c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4z"/>
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M7 18h10"/>
                      </svg>
                    </div>
                    <div className="flex-grow text-center md:text-left">
                      <h3 className="text-2xl font-serif font-semibold text-pink-800 mb-3">Lorem Ipsum Dolor</h3>
                      <div className="text-gray-600 mb-6">
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nisl vitae nisl. Sed vitae nisl euismod, aliquam nisl eget.</p>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Button className="bg-pink-600 hover:bg-pink-700 text-white">Lorem Ipsum</Button>
                        <Button variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">Dolor Sit</Button>
                        <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">Amet Consec</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Two cards side by side in a 1x2 grid */}
            <div className="grid grid-cols-2 gap-8">
              {/* Grid Item 1 */}
              <Card className="bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-xl transition-all border border-blue-100 h-full">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="text-blue-600 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                      <line x1="16" x2="16" y1="2" y2="6"/>
                      <line x1="8" x2="8" y1="2" y2="6"/>
                      <line x1="3" x2="21" y1="10" y2="10"/>
                      <path d="M8 14h.01"/>
                      <path d="M12 14h.01"/>
                      <path d="M16 14h.01"/>
                      <path d="M8 18h.01"/>
                      <path d="M12 18h.01"/>
                      <path d="M16 18h.01"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-blue-800 mb-3">Lorem Ipsum</h3>
                  <div className="text-gray-600 flex-grow mb-6">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies.</p>
                  </div>
                  <div className="mt-auto">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2">Dolor Sit</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Item 2 */}
              <Card className="bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-xl transition-all border border-green-100 h-full">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="text-green-600 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-green-800 mb-3">Consectetur</h3>
                  <div className="text-gray-600 flex-grow mb-6">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
                  </div>
                  <div className="mt-auto">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-2">Adipiscing</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
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