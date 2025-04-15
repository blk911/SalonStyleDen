import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";

// Define client interface
interface ClientData {
  id: number;
  name: string;
  phone: string;
  email: string;
  isCurrentClient: boolean;
  notes?: string;
  favoriteServices?: string[];
  salonId?: number;
  salonName?: string;
  type: string;
  createdAt: string;
}

export default function ClientDashboard() {
  const { id } = useParams();
  
  const { data: client, isLoading, error } = useQuery<ClientData>({
    queryKey: [`/api/clients/${id}`],
    refetchOnMount: true,
  });
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !client) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-red-500">Error</h2>
              <p className="mt-2">There was a problem loading your dashboard. Please try again later.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with Client Info */}
        <section className="bg-[#FEE1E8] py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="font-playfair font-bold text-3xl mb-2">{client.name}</h2>
                <p className="text-gray-600 mb-2">Member since {new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center bg-white/50 rounded-lg p-4 shadow-soft">
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Preferred Salon</p>
                  <p className="font-medium text-pink-600">{client.salonName}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Content Section - Condensed Profile Info */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="rounded-xl shadow-soft">
              <CardContent className="px-8 py-2">
                <div className="prose max-w-none">
                  <h4 className="text-xl font-semibold mb-2">Profile Info</h4>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">P:</span>
                      <span className="text-gray-700">{client?.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">E:</span>
                      <span className="text-gray-700">{client?.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Status:</span>
                      <span className="text-gray-700">{client?.isCurrentClient ? "Current" : "New"}</span>
                    </div>
                    {client?.salonName && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Salon:</span>
                        <span className="text-gray-700">{client.salonName}</span>
                      </div>
                    )}
                  </div>
                  {client?.favoriteServices && client.favoriteServices.length > 0 && (
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-1">
                        {client.favoriteServices.map((service: string) => (
                          <span 
                            key={service} 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FEE1E8] text-[#E57C8E]"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}