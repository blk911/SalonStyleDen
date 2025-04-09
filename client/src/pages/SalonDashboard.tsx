import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  
  // States for services, promos, and schedule
  const [services, setServices] = useState<ServiceData[]>([
    {
      id: 1,
      name: "French Tips / Touch-Up",
      description: "Classic white tips or quick polish refresh.",
      price: 40,
      duration: 30,
      featured: true,
      gifUrl: "https://i.pinimg.com/originals/d8/a8/95/d8a895078a8f73e6be3af12b28fa6afa.gif"
    },
    {
      id: 2,
      name: "Luxe Gel Manicure",
      description: "Glossy, chip-free color with lasting shine.",
      price: 55,
      duration: 45,
      featured: true,
      gifUrl: "https://i.pinimg.com/originals/8d/8e/a1/8d8ea1d328198e3a702762a7d75d4a79.gif"
    },
    {
      id: 3,
      name: "Sculpted Acrylics",
      description: "Custom-shaped acrylics for bold length.",
      price: 70,
      duration: 60,
      featured: true,
      gifUrl: "https://i.pinimg.com/originals/7f/26/e7/7f26e74b9bd52f59295fd7473a2b36ff.gif"
    },
    {
      id: 4,
      name: "Glam Me! Custom Design",
      description: "Fully custom art, gems, 3D extras.",
      price: 125,
      duration: 90,
      featured: true,
      gifUrl: "https://i.pinimg.com/originals/95/c2/64/95c264e66b4b17e68258429e80facc92.gif"
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

  // State for adding new promo
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

  const handleAddDefaultServices = () => {
    // Define the default style options
    const defaultServices = [
      {
        name: "French Tips / Touch-Up",
        description: "Classic white tips or quick polish refresh.",
        price: 40,
        duration: 30,
        featured: true,
        gifUrl: "https://i.pinimg.com/originals/d8/a8/95/d8a895078a8f73e6be3af12b28fa6afa.gif"
      },
      {
        name: "Luxe Gel Manicure",
        description: "Glossy, chip-free color with lasting shine.",
        price: 55,
        duration: 45,
        featured: true,
        gifUrl: "https://i.pinimg.com/originals/8d/8e/a1/8d8ea1d328198e3a702762a7d75d4a79.gif"
      },
      {
        name: "Sculpted Acrylics",
        description: "Custom-shaped acrylics for bold length.",
        price: 70,
        duration: 60,
        featured: true,
        gifUrl: "https://i.pinimg.com/originals/7f/26/e7/7f26e74b9bd52f59295fd7473a2b36ff.gif"
      },
      {
        name: "Glam Me! Custom Design",
        description: "Fully custom art, gems, 3D extras.",
        price: 125,
        duration: 90,
        featured: true,
        gifUrl: "https://i.pinimg.com/originals/95/c2/64/95c264e66b4b17e68258429e80facc92.gif"
      }
    ];

    // Replace existing services with default ones
    // Starting with ID 1 for clean numbering
    const newServices = defaultServices.map((service, index) => ({
      ...service,
      id: index + 1
    }));
    
    // Set the services state to only contain the default services
    setServices(newServices);

    // Show a toast notification
    toast({
      title: "Default styles reset!",
      description: "Style options have been reset to the four standard options.",
      duration: 3000
    });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="font-bold text-xl leading-tight">{salon.name}</h2>
                <p className="text-gray-700 text-sm">Welcome, {salon.ownerName}!</p>
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
        
        {/* Ven Me, Baby! Style Options Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded shadow-sm">
              <CardContent className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Ven Me, Baby! Style Options</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => handleAddDefaultServices()}
                  >
                    Reset Default Styles
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {/* Existing style options */}
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
                <p className="text-xs mb-2">See how clients will view your salon's information, style options, and promotions.</p>
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
