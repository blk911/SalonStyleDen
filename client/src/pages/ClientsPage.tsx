import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/card-section";
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
  Gift as GiftIcon,
  Heart as HeartIcon,
  HelpCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl, formatPhoneNumber } from "@/lib/utils";
import TeaserCarousel from "@/components/marketing/TeaserCarousel";
import { ThoughtBubble } from "@/components/ui/ThoughtBubble";

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
  const [showThoughtBubble, setShowThoughtBubble] = useState(true);
  const [salonCardOpen, setSalonCardOpen] = useState(false);
  const [clientCardOpen, setClientCardOpen] = useState(false);

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
        <section className="bg-gradient-to-b from-[#ffd8e6] to-white py-3 lg:py-3 border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center" style={{ marginBottom: '15px' }}>
              <h1 className="logo logo-lg">
                <span className="ven-me">Ven Me, </span> 
                <span className="baby">Baby!</span>
              </h1>
            </div>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed text-gray-700">Empowering. Personal. Connection.</p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-4 md:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            {/* Marketing Teaser Campaign Carousel */}
            <div className="mb-6">

              {/* Import and use TeaserCarousel component */}
              <div className="overflow-hidden rounded-xl border shadow-md">
                <TeaserCarousel />
              </div>
            </div>

            {/* Cards now always stack vertically on all devices */}
            <div className="grid grid-cols-1 gap-2">
              {/* Salon Testimonial */}
              <CollapsibleCard
                title="Salon Owner Benefits"
                description="Michelle S., VMB Certified Stylist"
                isOpen={salonCardOpen}
                onToggle={() => setSalonCardOpen(!salonCardOpen)}
                className="bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-xl transition-all border border-blue-100"
                action={
                  <Link href="/salon/2">
                    <span className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">VIEW</span>
                  </Link>
                }
              >
                <div className="flex flex-col sm:flex-row items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-blue-200 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0">
                    <img 
                      src="/assets/MS-VMBLTD.jpg" 
                      alt="Michelle, Salon Owner" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center sm:text-left flex-grow">
                    <p className="text-blue-700 text-sm">
                      Discover how Ven Me, Baby transforms salon business by creating deeper client connections, 
                      increasing service bookings, and building lasting relationships through personalized gift experiences.
                    </p>
                  </div>
                </div>
              </CollapsibleCard>

              {/* Client Testimonial */}
              <CollapsibleCard
                title="Client Success Stories"
                description="Kendra T., Premium Client"
                isOpen={clientCardOpen}
                onToggle={() => setClientCardOpen(!clientCardOpen)}
                className="bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-xl transition-all border border-green-100"
                action={
                  <Link href="/salon/2">
                    <span className="text-green-600 hover:text-green-800 text-sm font-medium cursor-pointer">VIEW</span>
                  </Link>
                }
              >
                <div className="flex flex-col sm:flex-row items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-green-200 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0">
                    <img 
                      src="/assets/kendra.png" 
                      alt="Kendra, Client" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center sm:text-left flex-grow">
                    <p className="text-green-700 text-sm">
                      Experience the joy of receiving personalized nail service gifts from people who care. 
                      See how clients build stronger connections and enjoy premium beauty experiences through Ven Me, Baby.
                    </p>
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Welcome ThoughtBubble - Positioned to right side of carousel with padding */}
      <ThoughtBubble
        position="top-right"
        isOpen={showThoughtBubble}
        onClose={() => setShowThoughtBubble(false)}
        className="z-50 fixed top-[450px] right-[50px] max-w-[280px]"
      />
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