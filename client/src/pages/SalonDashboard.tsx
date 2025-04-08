import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import type { Salon } from "@shared/schema";

// Define a type for the social media object that might be in the API response
interface SocialMediaItem {
  platform: string;
  handle: string;
}

// Define an interface for the Salon response that includes all necessary fields
interface SalonResponse {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  socialMedia?: SocialMediaItem[] | null;
  type: string;
  createdAt: string;
}

export default function SalonDashboard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  
  // Enhanced query configuration with proper query key structure and error handling
  const { 
    data: salon, 
    isLoading, 
    error,
    refetch 
  } = useQuery<SalonResponse>({
    queryKey: ['/api/salons', id],
    queryFn: async () => {
      try {
        if (!id) throw new Error("No salon ID provided");
        
        const response = await fetch(`/api/salons/${id}`);
        if (!response.ok) {
          throw new Error(`Error fetching salon: ${response.status}`);
        }
        return response.json();
      } catch (err) {
        console.error("Error fetching salon data:", err);
        throw err;
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    enabled: !!id, // Only run the query if we have an ID
  });
  
  // Auto-redirect if no ID is provided
  useEffect(() => {
    if (!id) {
      setLocation('/');
    }
  }, [id, setLocation]);
  
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
        <section className="bg-[#FEE1E8] py-6">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-3">
              <div>
                <h2 className="font-playfair font-bold text-2xl mb-1">{salon.name}</h2>
                <p className="text-gray-700 text-lg">Welcome back, {salon.ownerName}!</p>
                <p className="text-gray-600 mt-1">Manage your salon profile, services, and client appointments.</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm mt-3 md:mt-0">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-sm">{salon.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-sm">{salon.email}</span>
                  </div>
                  {salon.socialMedia && salon.socialMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {salon.socialMedia.map((social: any) => (
                        <span key={social.platform} className="inline-flex items-center text-xs text-gray-700">
                          <span className="font-medium mr-1">{social.platform}:</span> {social.handle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Content Section for Slug Page */}
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <Card className="rounded-xl shadow-soft">
              <CardContent className="p-4">
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold mb-2">Welcome to Your Salon Dashboard</h3>
                  <p>Thank you for registering your salon with Den Be Baby! Here you can manage your salon profile and services.</p>
                  
                  <div className="bg-[#FEE1E8] p-3 rounded-lg mt-4">
                    <h4 className="font-medium">Quick Actions</h4>
                    <ul className="mt-1 space-y-1">
                      <li>▸ Complete your salon profile</li>
                      <li>▸ Add your service offerings</li>
                      <li>▸ Set your availability calendar</li>
                      <li>▸ Customize booking settings</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">Your Salon Details</h4>
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
