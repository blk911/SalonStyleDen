import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

// Define a type for the social media object that might be in the API response
interface SocialMediaItem {
  platform: string;
  handle: string;
}

// Define our own Salon type for the frontend (consistent with SalonsPage)
interface SalonType {
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
  } = useQuery<SalonType>({
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
          <div className="text-center text-sm">
            <p>Loading...</p>
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
          <Card className="w-full max-w-sm mx-2 shadow-sm">
            <CardContent className="p-2">
              <h2 className="text-sm font-bold text-red-500">Error</h2>
              <p className="text-xs mt-1">There was a problem loading your dashboard. Please try again later.</p>
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
        {/* Condensed Hero Section */}
        <section className="bg-[#FEE1E8] py-3">
          <div className="container mx-auto px-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="font-bold text-xl leading-tight">{salon.name}</h2>
                <p className="text-gray-700 text-sm">Welcome, {salon.ownerName}!</p>
              </div>
              <div className="bg-white rounded px-2 py-1 shadow-sm text-xs w-full sm:w-auto">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-pink-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="truncate">{salon.phone}</span>
                </div>
                <div className="flex items-center mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-pink-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="truncate">{salon.email}</span>
                </div>
                {salon.socialMedia && Array.isArray(salon.socialMedia) && salon.socialMedia.length > 0 && (
                  <div className="content-section vspace-xs">
                    {salon.socialMedia.map((social: SocialMediaItem) => (
                      <span key={social.platform} className="text-mini text-gray-700">
                        <span className="font-medium">{social.platform}:</span> {social.handle}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Condensed Content Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded shadow-sm">
              <CardContent className="p-2">
                <div className="text-sm">
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center">
                    <h3 className="font-medium text-sm">Salon Dashboard</h3>
                    <span className="text-[10px] text-gray-500">Registered {new Date(salon.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs mt-2">
                    <div className="bg-[#FEE1E8] p-1 rounded">
                      <h4 className="font-medium text-xs">Quick Actions</h4>
                      <ul className="text-[10px] space-y-0 mt-1">
                        <li>▸ Update profile</li>
                        <li>▸ Add services</li>
                        <li>▸ Set availability</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-1 rounded">
                      <h4 className="font-medium text-xs">Stats</h4>
                      <ul className="text-[10px] space-y-0 mt-1">
                        <li>▸ 0 bookings</li>
                        <li>▸ 0 reviews</li>
                        <li>▸ Profile 25% complete</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-2 border-t border-gray-100 pt-1">
                    <h4 className="text-xs font-medium">Salon Details</h4>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[10px]">
                      <div><span className="font-medium">Name:</span> {salon.name}</div>
                      <div><span className="font-medium">Owner:</span> {salon.ownerName}</div>
                      <div><span className="font-medium">Phone:</span> {salon.phone}</div>
                      <div><span className="font-medium">Email:</span> {salon.email}</div>
                    </div>
                    
                    {salon.socialMedia && Array.isArray(salon.socialMedia) && salon.socialMedia.length > 0 && (
                      <div className="mt-1">
                        <span className="text-[10px] font-medium">Social:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {salon.socialMedia.map((social: SocialMediaItem) => (
                            <span 
                              key={social.platform} 
                              className="inline-flex items-center px-1 py-0 rounded text-[10px] bg-gray-100"
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
        
        {/* Promotions Section - Three Column Layout */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded shadow-sm">
              <CardContent className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Current Promotions</h3>
                  <button className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-[10px] px-2 py-0.5 rounded-sm">
                    + Add Promo
                  </button>
                </div>
                
                {/* Three Column Promo Grid */}
                <div className="grid-cols-responsive">
                  {/* Promo Placeholder 1 */}
                  <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-48">
                    <div className="bg-[#FEE1E8] h-24 flex items-center justify-center">
                      <span className="text-mini text-pink-700">Promo Image</span>
                    </div>
                    <div className="card-content">
                      <h4 className="font-medium text-compact">Summer Special</h4>
                      <p className="text-mini text-gray-600">20% off all manicures</p>
                      <div className="flex justify-between items-center vspace-xs">
                        <span className="text-micro">Ends: 7/31/25</span>
                        <button className="text-micro text-pink-500 hover:text-pink-700">Edit</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promo Placeholder 2 */}
                  <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-48">
                    <div className="bg-[#FEE1E8] h-24 flex items-center justify-center">
                      <span className="text-mini text-pink-700">Promo Image</span>
                    </div>
                    <div className="card-content">
                      <h4 className="font-medium text-compact">New Client Offer</h4>
                      <p className="text-mini text-gray-600">Free nail art with any service</p>
                      <div className="flex justify-between items-center vspace-xs">
                        <span className="text-micro">Ongoing</span>
                        <button className="text-micro text-pink-500 hover:text-pink-700">Edit</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promo Placeholder 3 */}
                  <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-48">
                    <div className="bg-[#FEE1E8] h-24 flex items-center justify-center">
                      <span className="text-mini text-pink-700">Promo Image</span>
                    </div>
                    <div className="card-content">
                      <h4 className="font-medium text-compact">Bring a Friend</h4>
                      <p className="text-mini text-gray-600">25% off for you and a friend</p>
                      <div className="flex justify-between items-center vspace-xs">
                        <span className="text-micro">Ends: 8/15/25</span>
                        <button className="text-micro text-pink-500 hover:text-pink-700">Edit</button>
                      </div>
                    </div>
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
