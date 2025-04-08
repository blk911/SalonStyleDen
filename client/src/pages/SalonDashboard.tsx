import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";

export default function SalonDashboard() {
  const { id } = useParams();
  
  const { data: salon, isLoading, error } = useQuery({
    queryKey: [`/api/salons/${id}`],
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
  
  if (error || !salon) {
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
        {/* Hero Section for Slug Page */}
        <section className="bg-[#FEE1E8] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-playfair font-bold text-3xl mb-4">Salon Dashboard</h2>
            <p className="text-gray-600">Manage your salon profile, services, and client appointments.</p>
          </div>
        </section>
        
        {/* Content Section for Slug Page */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="rounded-xl shadow-soft">
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-semibold mb-4">Welcome to Your Salon Dashboard</h3>
                  <p>Thank you for registering your salon with Den Be Baby! Here you can manage your salon profile and services.</p>
                  
                  <div className="bg-[#FEE1E8] p-4 rounded-lg mt-6">
                    <h4 className="font-medium">Quick Actions</h4>
                    <ul className="mt-2 space-y-1">
                      <li>▸ Complete your salon profile</li>
                      <li>▸ Add your service offerings</li>
                      <li>▸ Set your availability calendar</li>
                      <li>▸ Customize booking settings</li>
                    </ul>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-xl font-semibold mb-4">Your Salon Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Salon Name:</p>
                        <p className="text-gray-700">{salon.name}</p>
                      </div>
                      <div>
                        <p className="font-medium">Owner:</p>
                        <p className="text-gray-700">{salon.ownerName}</p>
                      </div>
                      <div>
                        <p className="font-medium">Phone:</p>
                        <p className="text-gray-700">{salon.phone}</p>
                      </div>
                      <div>
                        <p className="font-medium">Email:</p>
                        <p className="text-gray-700">{salon.email}</p>
                      </div>
                    </div>
                    
                    {salon.socialMedia && salon.socialMedia.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium">Social Media:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {salon.socialMedia.map((social: any) => (
                            <span 
                              key={social.platform} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {social.platform}: {social.handle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
