import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import WeeklySchedule, { DaySchedule } from "@/components/dashboard/WeeklySchedule";
import EditableSalonInfo, { SalonInfo } from "@/components/dashboard/EditableSalonInfo";
import EditablePromo, { PromoData } from "@/components/dashboard/EditablePromo";
import EditableService, { ServiceData } from "@/components/dashboard/EditableService";
import ClientInvitation from "@/components/dashboard/ClientInvitation";

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
  services?: ServiceData[];
  promos?: PromoData[];
  ownerPhotoUrl?: string; // Added ownerPhotoUrl to SalonType
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
  const handleSaveSalonInfo = async (updatedSalon: SalonInfo) => {
    try {
      if (!id) return;

      // Save updated salon info via API
      await apiRequest(`/api/salons/${id}`, {
        method: 'PUT',
        data: updatedSalon
      });

      // Refresh the salon data
      refetch();

      // Display success message
      toast({
        title: "Salon information updated",
        description: "Your salon details have been saved.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error saving salon info:', error);
      toast({
        title: "Error",
        description: "Failed to save your salon information. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleSaveService = async (updatedService: ServiceData) => {
    // Update in local state first
    setServices(prev => 
      prev.map(service => service.id === updatedService.id ? updatedService : service)
    );

    // Then send to API to persist
    try {
      if (!id) return;

      // Get the current services
      const updatedServices = services.map(service => 
        service.id === updatedService.id ? updatedService : service
      );

      // Save to database via API and get the updated salon data
      const updatedSalonData = await apiRequest(`/api/salons/${id}/services`, {
        method: 'POST',
        data: { services: updatedServices }
      });

      // Update local state with the data from server
      if (updatedSalonData.services && Array.isArray(updatedSalonData.services)) {
        setServices(updatedSalonData.services);
      }

      // Display success message
      toast({
        title: "Service updated",
        description: "Your style option has been saved to the database.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save your style option. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Gets the appropriate image URL based on service name
  const getImageUrlForService = (serviceName: string): string => {
    const name = serviceName.toLowerCase();

    if (name.includes('french') || name.includes('tips')) {
      return '/assets/french-tips.png';
    } else if (name.includes('gel') || name.includes('manicure') || name.includes('lux')) {
      return '/assets/gel-manicure.png';
    } else if (name.includes('sculpt') || name.includes('acrylic')) {
      return '/assets/sculpted-acrylics.png';
    } else if (name.includes('glam') || name.includes('custom') || name.includes('design')) {
      return '/assets/glam-design.png';
    } else {
      return '/assets/salon-card.png'; // Default fallback
    }
  };

  const handleAddService = async (newService: ServiceData) => {
    // Generate a new ID locally
    const newId = Math.max(...services.map(s => s.id), 0) + 1;

    // Auto-assign the appropriate image URL based on the service name
    const serviceWithImageAndId = { 
      ...newService, 
      id: newId,
      gifUrl: getImageUrlForService(newService.name)
    };

    // Update local state
    const updatedServices = [...services, serviceWithImageAndId];
    setServices(updatedServices);

    // Save to API
    try {
      if (!id) return;

      // Save to database via API and get the updated salon data
      const updatedSalonData = await apiRequest(`/api/salons/${id}/services`, {
        method: 'POST',
        data: { services: updatedServices }
      });

      // Update local state with the data from server
      if (updatedSalonData.services && Array.isArray(updatedSalonData.services)) {
        setServices(updatedSalonData.services);
      }

      toast({
        title: "Service added",
        description: "Your new style option has been added.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        title: "Error",
        description: "Failed to add your new style option. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleDeleteService = async (id: number) => {
    // Update local state
    const updatedServices = services.filter(service => service.id !== id);
    setServices(updatedServices);

    // Save to API
    try {
      if (!salon?.id) return;

      // Save to database via API and get the updated salon data
      const updatedSalonData = await apiRequest(`/api/salons/${salon.id}/services`, {
        method: 'POST',
        data: { services: updatedServices }
      });

      // Update local state with the data from server
      if (updatedSalonData.services && Array.isArray(updatedSalonData.services)) {
        setServices(updatedSalonData.services);
      }

      toast({
        title: "Service deleted",
        description: "The style option has been removed.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete the style option. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleSavePromo = async (updatedPromo: PromoData) => {
    try {
      console.log("SalonDashboard - Updating promo:", JSON.stringify(updatedPromo));
      console.log("SalonDashboard - Current promos state:", JSON.stringify(promos));

      // Update local state
      const newPromos = promos.map(p => 
        p.id === updatedPromo.id ? updatedPromo : p
      );
      setPromos(newPromos);

      // Update promos on the server
      const response = await apiRequest(`/api/salons/${id}/promos`, {
        method: 'POST',
        data: { promos: newPromos }
      });

      console.log("SalonDashboard - Server response:", response);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({
        queryKey: ['/api/salons', id]
      });

      toast({
        title: "Promotion updated",
        description: "Your promotion has been saved to the database.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error saving promo:', error);
      toast({
        title: "Error",
        description: "Failed to save your promotion. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleAddPromo = async (newPromo: PromoData) => {
    // Generate a new ID locally
    const newId = Math.max(...promos.map(p => p.id), 0) + 1;
    const promoWithId = { ...newPromo, id: newId };

    // Update local state
    const updatedPromos = [...promos, promoWithId];
    setPromos(updatedPromos);
    setIsAddingPromo(false);

    console.log('SalonDashboard - Adding new promo:', promoWithId);
    console.log('SalonDashboard - Updated promos list:', updatedPromos);

    // Save to API
    try {
      if (!id) return;

      console.log('SalonDashboard - Sending API request to update promos for salon', id);

      const response = await apiRequest(`/api/salons/${id}/promos`, {
        method: 'POST',
        data: { promos: updatedPromos }
      });

      console.log('SalonDashboard - API response after adding promo:', response);

      // Manually invalidate the salon query to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/salons', id] });

      toast({
        title: "Promotion added",
        description: "Your new promotion has been added.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error adding promo:', error);
      toast({
        title: "Error",
        description: "Failed to add your new promotion. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleDeletePromo = async (id: number) => {
    // Update local state
    const updatedPromos = promos.filter(promo => promo.id !== id);
    setPromos(updatedPromos);

    console.log('SalonDashboard - Deleting promo with id:', id);
    console.log('SalonDashboard - Updated promos after deletion:', updatedPromos);

    // Save to API
    try {
      if (!salon?.id) return;

      const response = await apiRequest(`/api/salons/${salon.id}/promos`, {
        method: 'POST',
        data: { promos: updatedPromos }
      });

      console.log('SalonDashboard - API response after deleting promo:', response);

      // Manually invalidate the salon query to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salon.id] });

      toast({
        title: "Promotion deleted",
        description: "The promotion has been removed.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error deleting promo:', error);
      toast({
        title: "Error",
        description: "Failed to delete the promotion. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleAddDefaultServices = async () => {
    // Define the default style options
    const defaultServices = [
      {
        name: "French Tips / Touch-Up",
        description: "Classic white tips or quick polish refresh.",
        price: 40,
        duration: 30,
        featured: true,
        gifUrl: "/assets/french-tips.png"
      },
      {
        name: "Luxe Gel Manicure",
        description: "Glossy, chip-free color with lasting shine.",
        price: 55,
        duration: 45,
        featured: true,
        gifUrl: "/assets/gel-manicure.png"
      },
      {
        name: "Sculpted Acrylics",
        description: "Custom-shaped acrylics for bold length.",
        price: 70,
        duration: 60,
        featured: true,
        gifUrl: "/assets/sculpted-acrylics.png"
      },
      {
        name: "Glam Me! Custom Design",
        description: "Fully custom art, gems, 3D extras.",
        price: 125,
        duration: 90,
        featured: true,
        gifUrl: "/assets/glam-design.png"
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

    // Save to API
    try {
      if (!id) return;

      // Get the updated salon data (including services)
      const updatedSalonData = await apiRequest(`/api/salons/${id}/services`, {
        method: 'POST',
        data: { services: newServices }
      });

      // Update local state with the data from server
      if (updatedSalonData.services && Array.isArray(updatedSalonData.services)) {
        setServices(updatedSalonData.services);
      }

      // Show a toast notification
      toast({
        title: "Default styles reset!",
        description: "Style options have been reset to the four standard options.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error saving default services:', error);
      toast({
        title: "Error",
        description: "Reset applied locally, but failed to save to database.",
        variant: "destructive",
        duration: 3000
      });
    }
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
    queryFn: getQueryFn<SalonType>({
      on401: "throw"
    }),
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

  // Update local state when salon data changes
  useEffect(() => {
    if (salon) {
      console.log('SalonDashboard - Salon data loaded:', salon);

      // Update services if available
      if (salon.services && Array.isArray(salon.services)) {
        console.log('SalonDashboard - Setting services from salon data:', salon.services);
        setServices(salon.services);
      }

      // Update promos if available
      if (salon.promos && Array.isArray(salon.promos)) {
        console.log('SalonDashboard - Setting promos from salon data:', salon.promos);
        setPromos(salon.promos);
      } else {
        console.log('SalonDashboard - No promos in salon data');
      }
    }
  }, [salon]);

  const getImageUrl = (url: string) => {
    // Add logic to handle image URLs if needed
    return url;
  };


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
              {salon.ownerPhotoUrl && (
                <div className="mt-2 sm:mt-0">
                  <img 
                    src={getImageUrl(salon.ownerPhotoUrl)}
                    alt={salon.ownerName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                </div>
              )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Promotions Section - Temporarily Hidden */}
        {false && (
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
        )}

        {/* Client Invitations Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <ClientInvitation salonId={salon?.id} />
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