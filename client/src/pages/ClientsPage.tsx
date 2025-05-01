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
  Calendar as CalendarIcon,
  Gift as GiftIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl, formatPhoneNumber } from "@/lib/utils";
import TeaserCarousel from "@/components/marketing/TeaserCarousel";

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
        <section className="bg-gradient-to-r from-pink-100 to-pink-50 py-4 md:py-8 border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-pink-800 flex items-center justify-center">
              <span className="mr-1">❤️</span>
              <span className="logo logo-md"><span className="ven-me">Ven Me, </span><span className="baby">Baby!</span></span>
              <span className="ml-1">❤️</span>
            </h1>
            <p className="mt-1 md:mt-2 text-base md:text-lg font-medium text-gray-700">Make Connections Personal!</p>
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-4 md:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            {/* Marketing Teaser Campaign Carousel */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base md:text-xl font-serif font-bold text-pink-800 flex items-center justify-center w-full">
                  <span className="mr-1">❤️</span>
                  <span className="ven-me">Ven Me,</span> <span className="baby">Baby!</span>
                  <span className="mx-1">❤️</span>
                  Make Connections Personal!
                  <span className="ml-1">❤️</span>
                </h3>
              </div>
              
              {/* Import and use TeaserCarousel component */}
              <div className="overflow-hidden rounded-xl border shadow-md">
                <TeaserCarousel />
              </div>
            </div>

            {/* Cards now always stack vertically on all devices */}
            <div className="grid grid-cols-1 gap-4">
              {/* Salon Testimonial */}
              <Card className="bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-xl transition-all border border-blue-100 h-full">
                <CardContent className="p-4 md:p-8 flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row items-center mb-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-blue-200 mb-3 sm:mb-0 sm:mr-4 flex-shrink-0">
                      <img 
                        src="/assets/MS-VMBLTD.jpg" 
                        alt="Michelle, Salon Owner" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl md:text-2xl font-serif font-semibold text-blue-800">Salon Owner Benefits</h3>
                      <p className="text-blue-600 text-sm font-medium">Michelle S., VMB Certified Stylist</p>
                    </div>
                  </div>
                  <div className="text-gray-700 flex-grow mb-6">
                    <p className="italic text-xs sm:text-sm leading-relaxed">"VMB has transformed how I connect with clients. The personalized invitation feature makes client acquisition effortless, and I've seen a 40% increase in client retention! The system's intuitive design has streamlined my scheduling process so I can focus on what matters - delivering exceptional service."</p>
                    <div className="mt-4 flex flex-col sm:flex-row items-center">
                      <div className="text-yellow-500 mr-1">★★★★★</div>
                      <span className="text-xs sm:text-sm text-gray-500">Verified VMB Partner</span>
                    </div>
                  </div>
                  <div className="mt-auto text-center">
                    <Link href="/salon/2">
                      <Button className="px-6 bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm">HOW EASY? SEE FOR YOUR SELF</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Client Testimonial */}
              <Card className="bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-xl transition-all border border-green-100 h-full">
                <CardContent className="p-4 md:p-8 flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row items-center mb-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-green-200 mb-3 sm:mb-0 sm:mr-4 flex-shrink-0">
                      <img 
                        src="/assets/kendra.png" 
                        alt="Kendra, Client" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl md:text-2xl font-serif font-semibold text-green-800">Client Success Stories</h3>
                      <p className="text-green-600 text-sm font-medium">Kendra T., Premium Client</p>
                    </div>
                  </div>
                  <div className="text-gray-700 flex-grow mb-6">
                    <p className="italic text-xs sm:text-sm leading-relaxed">"I adore the personalized VMB experience! Receiving an invitation makes me feel valued and special. The style selection is intuitive and helps me explore new options. Since discovering VMB, I've scheduled all my appointments through the platform - it's become essential to my self-care routine and I recommend it to everyone!"</p>
                    <div className="mt-4 flex flex-col sm:flex-row items-center">
                      <div className="text-yellow-500 mr-1">★★★★★</div>
                      <span className="text-xs sm:text-sm text-gray-500">VMB Member since 2024</span>
                    </div>
                  </div>
                  <div className="mt-auto text-center">
                    <Link href="/salon/2">
                      <Button className="px-6 bg-green-600 hover:bg-green-700 text-white py-2 text-sm">
                        CREATE A GIFT INVITATION 
                        <GiftIcon className="ml-1 h-4 w-4" stroke="gold" strokeWidth={2.5} />
                      </Button>
                    </Link>
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