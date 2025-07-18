/**
 * SalonPublicPage Component
 * 
 * ✅ WORKS EXACTLY AS INTENDED
 * 🚫 DO NOT MODIFY WITHOUT FULL RETEST
 * 
 * SOLID CODE SEGMENT: This page displays a salon's public-facing information and
 * provides the complete VMB experience for clients. It includes:
 * 
 * 1. Hero section with salon basic info (name, contact, owner photo)
 * 2. VmbStyleOptions component with the 3-step invitation process
 * 3. Business hours section
 * 4. Salon social media and additional information
 * 
 * Automatic checks are in place to handle edge cases such as missing data and
 * appropriate fallbacks are provided for all image loading.
 */

import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useCallback } from "react";
import { getImageUrl } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { DaySchedule } from "@/components/dashboard/WeeklySchedule";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import { PromoDetailsPopup } from "@/components/ui/PromoDetailsPopup";
import { PromoConfirmationPopup } from "@/components/ui/PromoConfirmationPopup";
import { InstructionPopup } from "@/components/ui/InstructionPopup";
import { ContextualHelp } from "@/components/ui/ContextualHelp";
import { Lightbulb } from "lucide-react";

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
  ownerPhotoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // These would come from additional queries or be added to the salon object
  services?: Service[];
  promos?: Promo[];
  schedule?: DaySchedule[];
}

export default function SalonPublicPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  // Flag to control display of promotions section - set to false to hide
  const [showPromos, setShowPromos] = useState(true);
  // State for promo popups
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [isPromoDetailsOpen, setIsPromoDetailsOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  // State for current client ID (if authenticated)
  const [currentClientId, setCurrentClientId] = useState<number | undefined>(undefined);
  // State for instruction popup
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  
  // Function to get the current client ID from the URL or session
  const getCurrentClientId = useCallback(async () => {
    try {
      // Check if we have a client ID in the session
      const response = await fetch('/api/session/current-client');
      if (response.ok) {
        const data = await response.json();
        if (data && data.clientId) {
          setCurrentClientId(data.clientId);
          return;
        }
      }
      
      // No client ID found in session, leave as undefined
      setCurrentClientId(undefined);
    } catch (error) {
      console.error("Error fetching current client:", error);
      setCurrentClientId(undefined);
    }
  }, []);

  // Enhanced query configuration with proper query key structure and error handling
  const { 
    data: salon, 
    isLoading, 
    error,
    refetch 
  } = useQuery<SalonType>({
    queryKey: ['/api/salons', id],
    staleTime: 0, // Always consider data stale to force a refresh each time
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Enable refresh on window focus
    gcTime: 1000, // Short cache time for better freshness
    enabled: !!id, // Only run the query if we have an ID
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
          } else if (name.includes('spring') || name.includes('seasonal')) {
            return '/assets/salon-card.png'; // Fixed image for seasonal spring special
          } else {
            return '/assets/LOGO1.png'; // Default fallback
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
          // Filter out Seasonal Spring Special first
          const filteredServices = salonData.services.filter((service: Service) => 
            !service.name.toLowerCase().includes('seasonal spring'));
          
          console.log('SalonPublicPage - Filtered services (removed Seasonal Spring):', filteredServices);
          
          processedServices = filteredServices.map((service: Service) => {
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
    }
  });

  // Auto-redirect if no ID is provided
  useEffect(() => {
    if (!id) {
      setLocation('/salons');
    }
  }, [id, setLocation]);
  
  // Get the current client ID when component mounts
  useEffect(() => {
    getCurrentClientId();
  }, [getCurrentClientId]);
  
  // Set up window focus handling for real-time data refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('SalonPublicPage - Window focused, refreshing data');
        // Invalidate the query cache for this specific salon
        if (id) {
          queryClient.invalidateQueries({ queryKey: ['/api/salons', id] });
          console.log(`SalonPublicPage - Invalidated cache for salon ${id}`);
        }
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

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
              <div className="mb-4">
                <img 
                  src={salon.ownerPhotoUrl ? getImageUrl(salon.ownerPhotoUrl, 'public_hero') : '/assets/salon-card.png'}
                  alt={`${salon.ownerName}'s photo`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                  onError={(e) => {
                    console.log("Owner photo fallback used for:", salon.name);
                    // Special case for Tiffany's salon
                    if (salon.name.includes('Tiffany') || salon.name.includes('5280')) {
                      e.currentTarget.src = '/assets/tiffany_profile.png';
                    } else {
                      // Use the standard fallback
                      e.currentTarget.src = '/assets/salon-card.png';
                    }
                  }}
                />
              </div>
              <h1 className="font-bold text-4xl text-pink-500 leading-tight mb-2">{salon.name}</h1>
              <p className="text-gray-700 text-xl mb-4">
                Welcome... I'm {salon.ownerName}! Let me know how I can serve you!
              </p>
              <div className="absolute top-0 right-0">
                <button
                  onClick={() => {
                    const salonId = salon.id;
                    const dashboardUrl = `/dashboard/salon/${salonId}?edit=true`;
                    console.log("Navigating to salon dashboard:", dashboardUrl);
                    setLocation(dashboardUrl);
                  }}
                  className="bg-white hover:bg-gray-50 text-pink-500 border border-pink-300 font-medium py-1 px-3 rounded-md text-xs transition duration-300 shadow-sm flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                  DASH
                </button>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-2">
            <div className="flex justify-center">
              <div className="bg-teal-50 rounded px-2 py-1 shadow-sm text-xs w-full sm:w-auto">
                <div className="content-section">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-teal-600 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="truncate text-teal-700">{salon.phone}</span>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-teal-600 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="truncate text-teal-700">{salon.email}</span>
                  </div>
                </div>

                {salon.socialMedia && Array.isArray(salon.socialMedia) && salon.socialMedia.length > 0 && (
                  <div className="content-section vspace-xs border-t border-teal-100 pt-1">
                    {salon.socialMedia.map((social) => (
                      <Badge key={social.platform} variant="outline" className="text-mini py-0 px-1 bg-teal-100 text-teal-700 border-teal-200">
                        {social.platform}: {social.handle}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CLIENT VMB PROMO ENGINE - Currently Disabled */}

        {/* VMB STYLE OPTIONS ENGINE - Interactive Style Selection */}
        {(!salon.services || salon.services.length === 0) ? (
          <section className="py-2">
            <div className="container mx-auto px-2">
              <Card className="shadow-sm">
                <CardContent className="p-2">
                  <div className="text-center p-4 bg-pink-50 rounded">
                    <p className="text-lg font-medium text-gray-700">VMB STYLE OPTIONS</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : (
          <section className="relative py-2">
            <ContextualHelp
              id="vmb-style-selection"
              title="Style Selection Guide"
              description="Follow these simple steps to choose your style and send an invitation:"
              steps={[
                "Browse through all available nail styles and click on one that interests you.",
                "Enter the name and contact of the person you'd like to invite.",
                "Add a personal message to make your invitation special.",
                "Submit and we'll send your invitation right away!"
              ]}
              position="top-right"
              autoShow={true}
            />
            <VmbStyleOptions 
              services={salon.services} 
              salonId={salon.id}
              clientId={currentClientId} // Dynamic client ID from session
              onSelectionComplete={(selection) => {
                console.log("Style selected:", selection);
                // You could update UI or redirect here
              }}
            />
          </section>
        )}

        {/* Business Hours Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="shadow-sm">
              <CardContent className="p-2">
                <h2 className="font-bold text-sm mb-2 text-[#FF92A5]">Business Hours</h2>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-1 text-mini text-center">
                  {/* If schedule exists use it, otherwise use the default schedule */}
                  {salon.schedule && Array.isArray(salon.schedule) && salon.schedule.length > 0 ? (
                    // Sort the schedule by dayOfWeek (0 = Sunday, 1 = Monday, etc.)
                    [...salon.schedule]
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((day) => {
                        // Convert times to AM/PM format
                        const formatTime = (time: string) => {
                          const [hours, minutes] = time.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12; // Convert 0 to 12
                          return `${displayHour}:${minutes} ${ampm}`;
                        };
                        
                        return (
                          <div key={day.dayName} className="border rounded p-2">
                            <p className="font-medium text-center">{day.dayName}</p>
                            {day.isOpen ? (
                              <p className="text-center">
                                {formatTime(day.openTime)} - {formatTime(day.closeTime)}
                              </p>
                            ) : (
                              <p className="text-red-500 text-center">Closed</p>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    // Default schedule if none is provided
                    <>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Sunday</p>
                        <p className="text-red-500 text-center">Closed</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Monday</p>
                        <p className="text-center">9:00 AM - 5:00 PM</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Tuesday</p>
                        <p className="text-center">9:00 AM - 5:00 PM</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Wednesday</p>
                        <p className="text-center">9:00 AM - 5:00 PM</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Thursday</p>
                        <p className="text-center">9:00 AM - 5:00 PM</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Friday</p>
                        <p className="text-center">9:00 AM - 5:00 PM</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="font-medium text-center">Saturday</p>
                        <p className="text-center">10:00 AM - 4:00 PM</p>
                      </div>
                    </>
                  )}
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
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <Button 
                  onClick={() => window.location.href = '/salon-registration'}
                  className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-sm"
                >
                  Register Your Salon
                </Button>
                <Button 
                  onClick={() => window.location.href = '/client-registration?mode=invite'}
                  variant="outline"
                  className="border-pink-300 text-pink-700 text-sm"
                >
                  Invite your Friends
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsInstructionOpen(true)}
                  className="border-pink-300 text-pink-700 flex items-center gap-1"
                >
                  <Lightbulb className="h-4 w-4" />
                  How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Instruction Popup */}
        <InstructionPopup
          title="How Ven Me, Baby! Works"
          description="Make connections personal with a few simple steps."
          isOpen={isInstructionOpen}
          onClose={() => setIsInstructionOpen(false)}
          steps={[
            "Select your favorite nail style; click on pic.",
            "Someone who wants your attention? Enter their name and number; send!",
            "You'll know how special if they fill your request.",
            "Your style is paid, set your appointment, ENJOY!"
          ]}
          icon={<Lightbulb className="h-5 w-5" />}
          actionText="Got it!"
        />
      </main>
      <Footer />
    </div>
  );
}
