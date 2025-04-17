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
        {/* Hero Section with Client Info -  Simplified */}
        <section className="bg-pink-100 py-4"> {/*Pink/white color scheme */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-pink-700">{client.name}</h2>
              <p className="text-gray-600 text-sm">Member since {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        {/* Content Section - Single Row Profile Info */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="rounded-xl shadow-soft">
              <CardContent className="px-8 py-2">
                <div className="flex flex-wrap gap-4 text-sm"> {/*Single row, tighter spacing*/}
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-800">{client?.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-800">{client?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-gray-800">{client?.isCurrentClient ? "Current" : "New"}</span>
                  </div>
                  {client?.salonName && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">Salon:</span>
                      <span className="ml-2 text-gray-800">{client.salonName}</span>
                    </div>
                  )}
                  {client?.favoriteServices && client.favoriteServices.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.favoriteServices.map((service: string) => (
                        <span 
                          key={service} 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-200 text-pink-700"
                        >
                          {service}
                        </span>
                      ))}
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