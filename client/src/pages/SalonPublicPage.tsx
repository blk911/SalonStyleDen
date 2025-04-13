import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { getImageUrl } from "@/lib/utils";

// Define a type for social media
interface SocialMediaItem {
  platform: string;
  handle: string;
}

// Define service type
interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  featured: boolean;
  gifUrl?: string; // Add back the optional gifUrl property
}

// Define promo type
interface Promo {
  id: number;
  title: string;
  description: string;
  endDate: string | null; // null means ongoing
}

// Define our salon type for the public page
interface SalonType {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  socialMedia?: SocialMediaItem[] | null;
  type: string;
  createdAt: string;
  // These would come from additional queries or be added to the salon object
  services?: Service[];
  promos?: Promo[];
}

export default function SalonPublicPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  // Enhanced query configuration with proper query key structure and error handling
  const { 
    data: salon, 
    isLoading, 
    error 
  } = useQuery<SalonType>({
    queryKey: ['/api/salons', id],
    queryFn: async () => {
      try {
        if (!id) throw new Error("No salon ID provided");

        const response = await fetch(`/api/salons/${id}`);
        if (!response.ok) {
          throw new Error(`Error fetching salon: ${response.status}`);
        }

        const salonData = await response.json();

        // Gets the appropriate image URL based on service name
        const getImageUrlForService = (serviceName: string): string => {
          const name = serviceName.toLowerCase();

          if (name.includes('french') || name.includes('tips')) {
            return '/assets/french-tips.png';
          } else if (name.includes('gel') || name.includes('manicure') || name.includes('lux')) {
            return '/assets/daisy-gel-manicure.png';
          } else if (name.includes('sculpt') || name.includes('acrylic')) {
            return '/assets/sculpted-white-acrylic.png';
          } else if (name.includes('glam') || name.includes('custom') || name.includes('design')) {
            return '/assets/custom-glam-lv.png';
          } else {
            return '/assets/salon-card.png'; // Default fallback
          }
        };

        // Use the services from the API if available, or provide defaults
        const defaultServices: Service[] = [
          {
            id: 1,
            name: "French Tips / Touch-Up",
            description: "Classic white tips or quick polish refresh.",
            price: 40,
            duration: 30,
            featured: true,
            gifUrl: "/assets/french-tips.png"
          },
          {
            id: 2,
            name: "Luxe Gel Manicure",
            description: "Glossy, chip-free color with lasting shine.",
            price: 55,
            duration: 45,
            featured: true,
            gifUrl: "/assets/gel-manicure.png"
          },
          {
            id: 3,
            name: "Sculpted Acrylics",
            description: "Custom-shaped acrylics for bold length.",
            price: 70,
            duration: 60,
            featured: true,
            gifUrl: "/assets/sculpted-acrylics.png"
          },
          {
            id: 4,
            name: "Glam Me! Custom Design",
            description: "Fully custom art, gems, 3D extras.",
            price: 125,
            duration: 90,
            featured: true,
            gifUrl: "/assets/glam-design.png"
          }
        ];

        // Default promos if none exist in database
        const defaultPromos: Promo[] = [
          {
            id: 1,
            title: "Summer Special",
            description: "20% off all manicures",
            endDate: "2025-07-31"
          },
          {
            id: 2,
            title: "New Client Offer",
            description: "Free nail art with any service",
            endDate: null
          }
        ];

        // Make sure any services from the API have the correct image paths
        let processedServices = defaultServices;

        if (Array.isArray(salonData.services) && salonData.services.length > 0) {
          processedServices = salonData.services.map((service: Service) => {
            // For each service, ensure it has the correct gifUrl based on its name
            return {
              ...service,
              gifUrl: service.gifUrl || getImageUrlForService(service.name)
            };
          });
        }

        // Add real data from the database if available, otherwise use defaults

        // Log promos received from the API
        console.log('SalonPublicPage - Raw salon data from API:', salonData);

        if (salonData.promos) {
          console.log('SalonPublicPage - Promos received from API:', JSON.stringify(salonData.promos));
        } else {
          console.log('SalonPublicPage - No promos received from API, using defaults');
        }

        // Ensure we're correctly handling promos
        const promos = Array.isArray(salonData.promos) && salonData.promos.length > 0 
          ? salonData.promos 
          : defaultPromos;

        console.log('SalonPublicPage - Final promos being displayed:', JSON.stringify(promos));

        return {
          ...salonData,
          services: processedServices,
          promos: promos
        };
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
      setLocation('/salons');
    }
  }, [id, setLocation]);

  // Images have been removed, so we don't need migration code

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
              <p className="text-xs mt-1">There was a problem loading this salon. Please try again later.</p>
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
        {/* Hero section with salon name and basic info */}
        <section className="bg-[#FEE1E8] py-3">
          <div className="container mx-auto px-2 text-center">
            <div className="relative flex flex-col items-center">
              {salon.ownerPhotoUrl && (
                <div className="mb-4">
                  <img 
                    src={getImageUrl(salon.ownerPhotoUrl)}
                    alt={`${salon.ownerName}'s photo`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                </div>
              )}
              <h1 className="font-bold text-4xl text-pink-500 leading-tight mb-2">{salon.name}</h1>
              <p className="text-gray-700 text-xl mb-4">
                Welcome... I'm {salon.ownerName}! Let me know how I can serve you!
              </p>
              <div className="absolute top-0 right-0">
                <button
                  onClick={() => setLocation(`/dashboard/salon/${salon.id}`)}
                  className="bg-white hover:bg-gray-50 text-pink-500 border border-pink-300 font-medium py-1 px-3 rounded-md text-xs transition duration-300 shadow-sm flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-2">
            <div className="flex justify-center">
              <div className="bg-white rounded px-2 py-1 shadow-sm text-xs w-full sm:w-auto">
                <div className="content-section">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-pink-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="truncate">{salon.phone}</span>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-pink-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="truncate">{salon.email}</span>
                  </div>
                </div>

                {salon.socialMedia && Array.isArray(salon.socialMedia) && salon.socialMedia.length > 0 && (
                  <div className="content-section vspace-xs border-t border-gray-100 pt-1">
                    {salon.socialMedia.map((social) => (
                      <Badge key={social.platform} variant="outline" className="text-mini py-0 px-1">
                        {social.platform}: {social.handle}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Current Promotions */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="shadow-sm">
              <CardContent className="p-2">
                <h2 className="font-bold text-sm mb-2 text-[#FF92A5]">Current Promotions</h2>

                <div className="grid-cols-responsive">
                  {salon.promos && salon.promos.map((promo) => (
                    <div key={promo.id} className="border border-pink-100 rounded overflow-hidden shadow-sm">
                      <div className="h-32 flex items-center justify-center">
                        {promo.title.toLowerCase().includes('summer') || promo.title.toLowerCase().includes('french') ? (
                          <img 
                            src="/assets/french-tips.png" 
                            alt={promo.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(`Failed to load image for promo: ${promo.title}`);
                              e.currentTarget.src = '/assets/salon-card.png';
                            }}
                          />
                        ) : promo.title.toLowerCase().includes('new client') || promo.title.toLowerCase().includes('spring') ? (
                          <img 
                            src="/assets/gel-manicure.png" 
                            alt={promo.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(`Failed to load image for promo: ${promo.title}`);
                              e.currentTarget.src = '/assets/salon-card.png';
                            }}
                          />
                        ) : promo.title.toLowerCase().includes('friend') || promo.title.toLowerCase().includes('bff') || promo.title.toLowerCase().includes('bring') ? (
                          <img 
                            src="/assets/logos/bff-promo.png" 
                            alt={promo.title}
                            className="w-full h-full object-cover rounded-t-sm"
                            onError={(e) => {
                              console.error(`Failed to load image for promo: ${promo.title}`);
                              e.currentTarget.src = '/assets/salon-card.png';
                            }}
                          />
                        ) : (
                          <div className="bg-[#FEE1E8] h-full w-full flex items-center justify-center">
                            <span className="font-medium text-compact text-center px-1">{promo.title}</span>
                          </div>
                        )}
                      </div>
                      <div className="card-content">
                        <h4 className="font-medium text-compact text-center">{promo.title}</h4>
                        <p className="text-mini text-gray-600 text-center">{promo.description}</p>
                        <div className="flex justify-center items-center vspace-xs">
                          <span className="text-micro">
                            {promo.endDate ? `Ends: ${new Date(promo.endDate).toLocaleDateString()}` : 'Ongoing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Ven Me, Baby! Style Options List */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="shadow-sm">
              <CardContent className="p-2">
                <h2 className="font-bold text-sm mb-2 text-[#FF92A5]">Ven Me, Baby! Style Options</h2>

                <div className="flex flex-col gap-2">
                  {salon.services && salon.services.map((service) => (
                    <div 
                      key={service.id} 
                      className={`border rounded px-2 py-3 ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'}`}
                    >
                      <div className="flex">
                        {/* Left side */}
                        <div className="w-3/4">
                          <h3 className="font-medium text-compact">{service.name}</h3>
                          <p className="text-mini text-gray-600">{service.description}</p>

                          <div className="mt-1">
                            <span className="inline-block font-bold text-compact pr-2">${Math.round(service.price)}</span>
                            <span className="inline-block text-micro">{service.duration} min</span>
                          </div>

                          <div className="mt-1">
                            {service.featured && (
                              <Badge className="bg-[#FF92A5] text-white border-0 text-mini">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Right side - Image (25%) */}
                        <div className="w-1/4 flex items-center justify-center">
                          {service.gifUrl ? (
                            <img 
                              src={service.gifUrl}
                              alt={`${service.name} preview`} 
                              className="rounded h-20 max-w-full object-contain"
                            />
                          ) : service.name.toLowerCase().includes('french') || service.name.toLowerCase().includes('tips') ? (
                            <img 
                              src="/assets/french-tips.png" 
                              alt={`${service.name} preview`} 
                              className="rounded h-20 max-w-full object-contain"
                            />
                          ) : service.name.toLowerCase().includes('gel') || service.name.toLowerCase().includes('manicure') || service.name.toLowerCase().includes('lux') ? (
                            <img 
                              src="/assets/daisy-gel-manicure.png" 
                              alt={`${service.name} preview`} 
                              className="rounded h-20 max-w-full object-contain"
                            />
                          ) : service.name.toLowerCase().includes('sculpt') || service.name.toLowerCase().includes('acrylic') ? (
                            <img 
                              src="/assets/sculpted-white-acrylic.png" 
                              alt={`${service.name} preview`} 
                              className="rounded h-20 max-w-full object-contain"
                            />
                          ) : service.name.toLowerCase().includes('glam') || service.name.toLowerCase().includes('custom') || service.name.toLowerCase().includes('design') ? (
                            <img 
                              src="/assets/custom-glam-lv.png" 
                              alt={`${service.name} preview`} 
                              className="rounded h-20 max-w-full object-contain"
                            />
                          ) : (
                            <img 
                              src="/assets/salon-card.png" 
                              alt={`${service.name} preview`} 
                              className="rounded h-20 max-w-full object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="button-container vspace-sm">
                  <Button 
                    className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-center text-xs"
                  >
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Business Hours - Placeholder for now */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="shadow-sm">
              <CardContent className="p-2">
                <h2 className="font-bold text-sm mb-2 text-[#FF92A5]">Business Hours</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 text-mini">
                  <div className="border rounded p-1">
                    <p className="font-medium">Monday</p>
                    <p>9:00 AM - 5:00 PM</p>
                  </div>
                  <div className="border rounded p-1">
                    <p className="font-medium">Tuesday</p>
                    <p>9:00 AM - 5:00 PM</p>
                  </div>
                  <div className="border rounded p-1">
                    <p className="font-medium">Wednesday</p>
                    <p>9:00 AM - 5:00 PM</p>
                  </div>
                  <div className="border rounded p-1">
                    <p className="font-medium">Thursday</p>
                    <p>9:00 AM - 5:00 PM</p>
                  </div>
                  <div className="border rounded p-1">
                    <p className="font-medium">Friday</p>
                    <p>9:00 AM - 5:00 PM</p>
                  </div>
                  <div className="border rounded p-1">
                    <p className="font-medium">Saturday</p>
                    <p>10:00 AM - 4:00 PM</p>
                  </div>
                  <div className="border rounded p-1">
                    <p className="font-medium">Sunday</p>
                    <p>Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <div className="bg-[#FEE1E8] rounded p-3 text-center">
              <h2 className="font-bold text-sm mb-2">Ready to look gorgeous?</h2>
              <p className="text-mini mb-2">Book your appointment at {salon.name} today!</p>
              <Button className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white">Book Now</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}