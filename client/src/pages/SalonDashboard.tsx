import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import WeeklySchedule, { DaySchedule } from "@/components/dashboard/WeeklySchedule";
import EditableSalonInfo, { SalonInfo } from "@/components/dashboard/EditableSalonInfo";
import EditablePromo, { PromoData } from "@/components/dashboard/EditablePromo";
import EditableService, { ServiceData } from "@/components/dashboard/EditableService";

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
  
  // States for services, promos, and schedule
  const [services, setServices] = useState<ServiceData[]>([
    {
      id: 1,
      name: "Classic Manicure",
      description: "Nail shaping, cuticle care, hand massage, and polish application",
      price: 30,
      duration: 45,
      featured: true
    },
    {
      id: 2,
      name: "Chic French Tips",
      description: "Classic French manicure with elegant white tips",
      price: 35,
      duration: 50,
      featured: false
    },
    {
      id: 3,
      name: "Luxe Gel Manicure",
      description: "Long-lasting gel polish with nail prep and cuticle care",
      price: 45,
      duration: 60,
      featured: true
    }
  ]);

  const [promos, setPromos] = useState<PromoData[]>([
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
    },
    {
      id: 3,
      title: "Bring a Friend",
      description: "25% off for you and a friend",
      endDate: "2025-08-15"
    }
  ]);

  // State for adding new service/promo
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Weekly schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([
    { dayOfWeek: 0, dayName: "Sunday", isOpen: false, openTime: "10:00", closeTime: "18:00" },
    { dayOfWeek: 1, dayName: "Monday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 2, dayName: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 3, dayName: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 4, dayName: "Thursday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 5, dayName: "Friday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 6, dayName: "Saturday", isOpen: true, openTime: "10:00", closeTime: "16:00" },
  ]);
  
  // Handler functions for services, promos, and salon info
  const handleSaveSalonInfo = (updatedSalon: SalonInfo) => {
    // In a real app, this would be an API call
    console.log("Saving salon info:", updatedSalon);
    // For now, just refresh the data
    refetch();
  };

  const handleSaveService = (updatedService: ServiceData) => {
    setServices(prev => 
      prev.map(service => service.id === updatedService.id ? updatedService : service)
    );
  };

  const handleAddService = (newService: ServiceData) => {
    // In a real app, this would be an API call that returns the new ID
    const newId = Math.max(...services.map(s => s.id), 0) + 1;
    setServices(prev => [...prev, { ...newService, id: newId }]);
    setIsAddingService(false);
  };

  const handleDeleteService = (id: number) => {
    setServices(prev => prev.filter(service => service.id !== id));
  };

  const handleSavePromo = (updatedPromo: PromoData) => {
    setPromos(prev => 
      prev.map(promo => promo.id === updatedPromo.id ? updatedPromo : promo)
    );
  };

  const handleAddPromo = (newPromo: PromoData) => {
    // In a real app, this would be an API call that returns the new ID
    const newId = Math.max(...promos.map(p => p.id), 0) + 1;
    setPromos(prev => [...prev, { ...newPromo, id: newId }]);
    setIsAddingPromo(false);
  };

  const handleDeletePromo = (id: number) => {
    setPromos(prev => prev.filter(promo => promo.id !== id));
  };

  const handleSaveSchedule = () => {
    // In a real app, this would be an API call
    console.log("Saving schedule:", weeklySchedule);
  };
  
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
        
        {/* Salon Info Section with Editable Component */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <EditableSalonInfo
              salon={salon}
              onSave={handleSaveSalonInfo}
            />
          </div>
        </section>
        
        {/* Services Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded shadow-sm">
              <CardContent className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Services</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-pink-200 text-pink-700 hover:bg-pink-50"
                    onClick={() => setIsAddingService(true)}
                  >
                    + Add Service
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {/* Add new service form */}
                  {isAddingService && (
                    <EditableService
                      service={{
                        id: 0,
                        name: "",
                        description: "",
                        price: 0,
                        duration: 30,
                        featured: false
                      }}
                      onSave={handleAddService}
                      onDelete={() => setIsAddingService(false)}
                    />
                  )}
                  
                  {/* Existing services */}
                  {services.map(service => (
                    <EditableService
                      key={service.id}
                      service={service}
                      onSave={handleSaveService}
                      onDelete={handleDeleteService}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Weekly Schedule Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <WeeklySchedule
              salonId={salon.id}
              initialSchedule={weeklySchedule}
              onScheduleSaved={handleSaveSchedule}
            />
          </div>
        </section>
        
        {/* Promotions Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded shadow-sm">
              <CardContent className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Current Promotions</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-pink-200 text-pink-700 hover:bg-pink-50"
                    onClick={() => setIsAddingPromo(true)}
                  >
                    + Add Promo
                  </Button>
                </div>
                
                {/* Add new promo form */}
                {isAddingPromo && (
                  <div className="mb-3">
                    <EditablePromo
                      promo={{
                        id: 0,
                        title: "",
                        description: "",
                        endDate: null
                      }}
                      onSave={handleAddPromo}
                      onDelete={() => setIsAddingPromo(false)}
                    />
                  </div>
                )}
                
                {/* Promo Grid */}
                <div className="grid-cols-responsive">
                  {promos.map(promo => (
                    <EditablePromo
                      key={promo.id}
                      promo={promo}
                      onSave={handleSavePromo}
                      onDelete={handleDeletePromo}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Public Page Preview Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded shadow-sm">
              <CardContent className="p-2 text-center">
                <h3 className="font-medium text-sm mb-2">Preview Your Public Page</h3>
                <p className="text-xs mb-2">See how clients will view your salon's information, services, and promotions.</p>
                <Button 
                  variant="outline"
                  className="text-xs h-8 border-pink-200 text-pink-700 hover:bg-pink-50"
                  onClick={() => window.open(`/salon/${salon.id}`, '_blank')}
                >
                  View Public Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
