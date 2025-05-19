import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { getImageUrl } from "@/lib/utils";
import { ChevronDown, FileText, Info } from "lucide-react";
import WeeklySchedule, { DaySchedule } from "@/components/dashboard/WeeklySchedule";
import EditableSalonInfo, { SalonInfo } from "@/components/dashboard/EditableSalonInfo";
import EditablePromo, { PromoData } from "@/components/dashboard/EditablePromo";
import EditableService, { ServiceData } from "@/components/dashboard/EditableService";
import ClientInvitation from "@/components/dashboard/ClientInvitation";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


// Define a type for the social media object that might be in the API response
interface SocialMediaItem {
  platform: string;
  handle: string;
}

// We're using SalonInfo type from EditableSalonInfo for consistency
// Enhanced with the additional properties we need
interface EnhancedSalonInfo extends SalonInfo {
  createdAt?: string;
  services?: ServiceData[];
  promos?: PromoData[];
  schedule?: DaySchedule[];
  licenseNumber?: string;
  licenseState?: string;
  licenseStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  licenseVerificationDate?: string;
  metadata?: {
    registrationTrackingId?: string;
    registrationTimestamp?: string;
    registrationComplete?: boolean;
    lastUpdated?: string;
  };
}

// License form schema definition (moved outside the component to avoid duplicate declarations)
const licenseFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  licenseNumber: z.string().min(3, "License number is required"),
  licenseState: z.string().min(2, "State is required"),
  exactMatch: z.boolean().default(true),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms"
  })
});

// License form type
type LicenseFormValues = z.infer<typeof licenseFormSchema>;

export default function SalonDashboard() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // We want to track whether the edit form was opened from a URL parameter,
  // but we no longer directly pass this to initiate editing mode automatically
  console.log('Current location in SalonDashboard:', location);
  const shouldOpenEditForm = false; // Always start with form fields hidden
  console.log('shouldOpenEditForm value:', shouldOpenEditForm, 'URL search params:', window.location.search);

  // State for salon data 
  const [salonData, setSalonData] = useState<EnhancedSalonInfo | null>(null);
  
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
  
  // State for section visibility with localStorage persistence
  const [styleSectionOpen, setStyleSectionOpen] = useState(() => {
    const saved = localStorage.getItem('vmb-style-section-open');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [scheduleSectionOpen, setScheduleSectionOpen] = useState(() => {
    const saved = localStorage.getItem('vmb-schedule-section-open');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [invitationSectionOpen, setInvitationSectionOpen] = useState(() => {
    const saved = localStorage.getItem('vmb-invitation-section-open');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [accountSectionOpen, setAccountSectionOpen] = useState(() => {
    const saved = localStorage.getItem('vmb-account-section-open');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Sub-sections inside Account Management
  const [bankingSectionOpen, setBankingSectionOpen] = useState(false);
  const [credentialsSectionOpen, setCredentialsSectionOpen] = useState(false);
  const [vmbPspSectionOpen, setVmbPspSectionOpen] = useState(false);
  
  // License dialog state
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  
  // Setup license form with default empty values
  const licenseForm = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      fullName: salonData?.ownerName || '',
      licenseNumber: salonData?.licenseNumber || '',
      licenseState: salonData?.licenseState || '',
      exactMatch: true,
      agreeToTerms: false
    }
  });
  
  // Save section states to localStorage when they change
  useEffect(() => {
    localStorage.setItem('vmb-style-section-open', JSON.stringify(styleSectionOpen));
  }, [styleSectionOpen]);
  
  useEffect(() => {
    localStorage.setItem('vmb-schedule-section-open', JSON.stringify(scheduleSectionOpen));
  }, [scheduleSectionOpen]);
  
  useEffect(() => {
    localStorage.setItem('vmb-invitation-section-open', JSON.stringify(invitationSectionOpen));
  }, [invitationSectionOpen]);
  
  useEffect(() => {
    localStorage.setItem('vmb-account-section-open', JSON.stringify(accountSectionOpen));
  }, [accountSectionOpen]);

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

      // Update data from the server
      await updateLocalDataFromServer();

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

      // Update data from the server
      await updateLocalDataFromServer();

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
      if (!salonData?.id) return;

      // Save to database via API and get the updated salon data
      const updatedSalonData = await apiRequest(`/api/salons/${salonData.id}/services`, {
        method: 'POST',
        data: { services: updatedServices }
      });

      // Update local state with the data from server
      if (updatedSalonData.services && Array.isArray(updatedSalonData.services)) {
        setServices(updatedSalonData.services);
      }

      // Update data from the server
      await updateLocalDataFromServer();

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
      if (!salonData?.id) return;

      const response = await apiRequest(`/api/salons/${salonData.id}/promos`, {
        method: 'POST',
        data: { promos: updatedPromos }
      });

      console.log('SalonDashboard - API response after deleting promo:', response);

      // Manually invalidate the salon query to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonData.id] });

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
  
  /* License form schema moved up to avoid duplicated declaration errors */
  
  // Function to handle license submission
  const handleLicenseSubmission = async (data: LicenseFormValues) => {
    if (!salonData?.id) return;
    
    try {
      console.log('Submitting license data:', data);
      
      // Update the salon license information
      const response = await apiRequest(`/api/salons/${salonData.id}/license`, {
        method: 'POST',
        data: {
          licenseNumber: data.licenseNumber,
          licenseState: data.licenseState,
          licenseStatus: 'pending',
          ownerName: data.fullName,
          exactNameMatch: data.exactMatch,
          timestamp: new Date().toISOString(),
          trackingId: salonData.metadata?.registrationTrackingId || `license_${Date.now()}_${salonData.id}`
        }
      });
      
      console.log('License submission response:', response);
      
      // Close the dialog
      setLicenseDialogOpen(false);
      
      // Refresh salon data
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonData.id] });
      
      toast({
        title: "License submitted",
        description: "Your license information has been submitted for verification.",
        duration: 5000
      });
      
    } catch (error) {
      console.error('Error submitting license:', error);
      toast({
        title: "Error",
        description: "Failed to submit license information. Please try again.",
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

      // Update data from the server
      await updateLocalDataFromServer();

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

  const handleSaveSchedule = (updatedSchedule: DaySchedule[]) => {
    console.log("Schedule saved in SalonDashboard:", updatedSchedule);
    
    // Update the local state with the new schedule
    setWeeklySchedule(updatedSchedule);
    
    // Update the salon data with the new schedule to keep everything in sync
    setSalonData(prevSalonData => {
      if (!prevSalonData) return null;
      return {
        ...prevSalonData,
        schedule: updatedSchedule
      };
    });
    
    // Show success toast
    toast({
      title: "Schedule updated",
      description: "Your business hours have been updated.",
      duration: 3000
    });
    
    // Invalidate the query to ensure fresh data on next fetch
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', id] });
    }
  };

  // Enhanced query configuration with proper query key structure and error handling
  const { 
    data: salonApiData, 
    isLoading, 
    error,
    refetch 
  } = useQuery<EnhancedSalonInfo>({
    queryKey: ['/api/salons', id],
    queryFn: async () => {
      console.log("Fetching salon data for id:", id);
      try {
        if (!id) throw new Error("No salon ID provided");
        
        // Force fetch directly from API to bypass any caching
        const response = await fetch(`/api/salons/${id}`);
        if (!response.ok) {
          throw new Error(`Error fetching salon: ${response.status}`);
        }
        
        const salonData = await response.json();
        console.log("SalonDashboard - Salon data loaded:", salonData);
        
        if (!salonData.services) {
          console.log("SalonDashboard - No services in salon data");
        }
        
        if (!salonData.promos) {
          console.log("SalonDashboard - No promos in salon data");
        }
        
        return salonData as EnhancedSalonInfo;
      } catch (err) {
        console.error("API request error:", err);
        throw err;
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Enable refresh on window focus to handle changes
    staleTime: 0, // Always consider data stale to force a refresh each time
    gcTime: 1000, // Cache for only 1 second to ensure fresh data (renamed from cacheTime)
    enabled: !!id, // Only run the query if we have an ID
  });
  
  // Internal helper function for data consistency - not exposed in UI
  const updateLocalDataFromServer = async () => {
    console.log('SalonDashboard - Updating data for salon ID:', id);
    
    try {
      // Invalidate cache first
      await queryClient.invalidateQueries({ queryKey: ['/api/salons', id] });
      
      // Trigger regular refetch to update UI
      const { data: freshData } = await refetch();
      
      // Only update if we received data
      if (freshData) {
        // Update local state
        if (freshData.services && Array.isArray(freshData.services)) {
          const filteredServices = freshData.services.filter((service: ServiceData) => 
            !service.name.toLowerCase().includes('seasonal spring'));
          setServices(filteredServices);
        }
        
        if (freshData.promos && Array.isArray(freshData.promos)) {
          setPromos(freshData.promos);
        }
      }
    } catch (error) {
      console.error('Error updating salon data:', error);
    }
  };

  // Auto-redirect if no ID is provided
  useEffect(() => {
    if (!id) {
      setLocation('/');
    }
  }, [id, setLocation]);

  // Update local state when salon data changes
  useEffect(() => {
    if (salonData) {
      console.log('SalonDashboard - Salon data loaded:', salonData);

      // Update services if available
      if (salonData.services && Array.isArray(salonData.services)) {
        console.log('SalonDashboard - Setting services from salon data:', salonData.services);
        // Filter out the Seasonal Spring Special from VMB Style Options
        const filteredServices = salonData.services.filter((service: ServiceData) => 
          !service.name.toLowerCase().includes('seasonal spring'));
        console.log('SalonDashboard - Filtered services (removed Seasonal Spring):', filteredServices);
        setServices(filteredServices);
      }

      // Update promos if available
      if (salonData.promos && Array.isArray(salonData.promos)) {
        console.log('SalonDashboard - Setting promos from salon data:', salonData.promos);
        setPromos(salonData.promos);
      } else {
        console.log('SalonDashboard - No promos in salon data');
      }
      
      // Update schedule if available
      if (salonData.schedule && Array.isArray(salonData.schedule)) {
        console.log('SalonDashboard - Setting schedule from salon data:', salonData.schedule);
        setWeeklySchedule(salonData.schedule);
      } else {
        console.log('SalonDashboard - No schedule in salon data, using default');
      }
    }
  }, [salonData]);


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

  if (error || !salonData) {
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
            <div className="flex flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl leading-tight">{salon.name}</h2>
                  <p className="text-gray-700 text-sm">Welcome, {salon.ownerName}!</p>
                </div>
                <div>
                  <img 
                    src={salon.ownerPhotoUrl ? getImageUrl(salon.ownerPhotoUrl, 'dashboard_hero') : '/assets/salon-card.png'}
                    alt={salon.ownerName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#FF92A5] shadow-md"
                    onError={(e) => {
                      console.log("Owner photo fallback used for:", salon.name);
                      // Special case for Tiffany's salon
                      if (salon.name.includes('Tiffany') || salon.name.includes('5280')) {
                        e.currentTarget.src = '/assets/tiffany_profile.png';
                      } else {
                        // Use the standard fallback for other salons
                        e.currentTarget.src = '/assets/salon-card.png';
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-pink-400 text-pink-700 bg-white hover:bg-pink-50"
                  onClick={() => window.open(`/salon/${salon.id}`.replace(/\/\//g, '/'), '_blank')}
                >
                  View Public Page
                </Button>
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
              defaultEditing={shouldOpenEditForm}
            />
          </div>
        </section>



        {/* Ven Me, Baby! Style Options Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded-xl shadow-sm overflow-hidden border border-pink-200">
              <div 
                className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                onClick={() => setStyleSectionOpen(!styleSectionOpen)}
              >
                <h3 className="font-medium text-sm sm:text-base text-pink-700">Ven Me, Baby! Style Options</h3>
                <div className="flex items-center">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 mr-2 border-pink-200 text-pink-700 hover:bg-pink-50"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the header click
                      handleAddDefaultServices();
                    }}
                  >
                    Reset Default Styles
                  </Button>
                  <ChevronDown 
                    className={`h-5 w-5 text-pink-600 transition-transform ${styleSectionOpen ? 'transform rotate-180' : ''}`} 
                  />
                </div>
              </div>
              
              {styleSectionOpen && (
                <CardContent className="p-3 bg-white">
                  {services.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-base font-medium text-gray-700">VMB STYLE OPTIONS</p>
                    </div>
                  ) : (
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
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </section>

        {/* Salon to Client Invitations Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded-xl shadow-sm overflow-hidden border border-pink-200">
              <div 
                className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                onClick={() => setInvitationSectionOpen(!invitationSectionOpen)}
              >
                <h3 className="font-medium text-sm sm:text-base text-pink-700">Register Your Clients with Ven Me, Baby!</h3>
                <ChevronDown 
                  className={`h-5 w-5 text-pink-600 transition-transform ${invitationSectionOpen ? 'transform rotate-180' : ''}`} 
                />
              </div>
              
              {invitationSectionOpen && (
                <CardContent className="p-3 bg-white">
                  <ClientInvitation salonId={salon?.id} />
                </CardContent>
              )}
            </Card>
          </div>
        </section>

        {/* Weekly Schedule Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded-xl shadow-sm overflow-hidden border border-pink-200">
              <div 
                className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                onClick={() => setScheduleSectionOpen(!scheduleSectionOpen)}
              >
                <h3 className="font-medium text-sm sm:text-base text-pink-700">Weekly Schedule</h3>
                <ChevronDown 
                  className={`h-5 w-5 text-pink-600 transition-transform ${scheduleSectionOpen ? 'transform rotate-180' : ''}`} 
                />
              </div>
              
              {scheduleSectionOpen && (
                <CardContent className="p-3 bg-white">
                  <WeeklySchedule
                    salonId={salon.id}
                    initialSchedule={weeklySchedule}
                    onScheduleSaved={handleSaveSchedule}
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </section>

        {/* Account Management Section */}
        <section className="py-2">
          <div className="container mx-auto px-2">
            <Card className="rounded-xl shadow-sm overflow-hidden border border-pink-200">
              <div 
                className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                onClick={() => setAccountSectionOpen(!accountSectionOpen)}
              >
                <h3 className="font-medium text-sm sm:text-base text-pink-700">Account Management</h3>
                <ChevronDown 
                  className={`h-5 w-5 text-pink-600 transition-transform ${accountSectionOpen ? 'transform rotate-180' : ''}`} 
                />
              </div>
              
              {accountSectionOpen && (
                <CardContent className="p-3 bg-white">
                  <div className="space-y-3">
                    {/* Banking Section */}
                    <Card className="rounded-lg shadow-sm overflow-hidden border border-pink-100">
                      <div 
                        className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                        onClick={() => setBankingSectionOpen(!bankingSectionOpen)}
                      >
                        <h4 className="font-medium text-sm text-pink-700">Banking</h4>
                        <ChevronDown 
                          className={`h-4 w-4 text-pink-600 transition-transform ${bankingSectionOpen ? 'transform rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {bankingSectionOpen && (
                        <div className="p-3 bg-white">
                          <div className="container">
                            
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Credentials Section */}
                    <Card className="rounded-lg shadow-sm overflow-hidden border border-pink-100">
                      <div 
                        className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                        onClick={() => setCredentialsSectionOpen(!credentialsSectionOpen)}
                      >
                        <h4 className="font-medium text-sm text-pink-700">Credentials</h4>
                        <ChevronDown 
                          className={`h-4 w-4 text-pink-600 transition-transform ${credentialsSectionOpen ? 'transform rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {credentialsSectionOpen && (
                        <div className="p-3 bg-white">
                          <div className="container">
                            {/* License Information Display/Form */}
                            <div className="mb-4">
                              <h3 className="text-sm font-medium text-gray-700 mb-2">License Information</h3>
                              
                              {/* If license data is complete, show information */}
                              {salonData?.licenseNumber && salonData?.licenseState && salonData?.licenseStatus && (
                                <div className={`p-3 rounded-md border ${
                                  salonData?.licenseStatus === 'verified' ? 'bg-green-50 border-green-100' : 
                                  salonData?.licenseStatus === 'pending' ? 'bg-yellow-50 border-yellow-100' :
                                  salonData?.licenseStatus === 'rejected' ? 'bg-red-50 border-red-100' :
                                  'bg-gray-50 border-gray-100'
                                }`}>
                                  <div className="flex items-center mb-2">
                                    {salonData?.licenseStatus === 'verified' && (
                                      <Badge className="bg-green-600">Verified</Badge>
                                    )}
                                    {salonData?.licenseStatus === 'pending' && (
                                      <Badge className="bg-yellow-600">Pending Verification</Badge>
                                    )}
                                    {salonData?.licenseStatus === 'rejected' && (
                                      <Badge className="bg-red-600">Verification Failed</Badge>
                                    )}
                                    {(!salonData?.licenseStatus || salonData?.licenseStatus === 'not_submitted') && (
                                      <Badge className="bg-gray-600">Not Submitted</Badge>
                                    )}
                                    <span className={`ml-2 text-sm ${
                                      salonData?.licenseStatus === 'verified' ? 'text-green-800' : 
                                      salonData?.licenseStatus === 'pending' ? 'text-yellow-800' :
                                      salonData?.licenseStatus === 'rejected' ? 'text-red-800' :
                                      'text-gray-800'
                                    }`}>
                                      {salonData?.licenseStatus === 'verified' && 'Your license has been verified'}
                                      {salonData?.licenseStatus === 'pending' && 'Your license is being verified (2-3 days)'}
                                      {salonData?.licenseStatus === 'rejected' && 'License verification failed. Please resubmit.'}
                                      {(!salonData?.licenseStatus || salonData?.licenseStatus === 'not_submitted') && 'License not submitted'}
                                    </span>
                                  </div>
                                  
                                  <dl className="space-y-1 text-sm">
                                    <div className="flex">
                                      <dt className="w-32 font-medium text-gray-600">License Number:</dt>
                                      <dd className="text-gray-800">{salonData?.licenseNumber}</dd>
                                    </div>
                                    <div className="flex">
                                      <dt className="w-32 font-medium text-gray-600">State:</dt>
                                      <dd className="text-gray-800">{salonData?.licenseState}</dd>
                                    </div>
                                    {salonData?.licenseVerificationDate && (
                                      <div className="flex">
                                        <dt className="w-32 font-medium text-gray-600">Verified On:</dt>
                                        <dd className="text-gray-800">{new Date(salonData.licenseVerificationDate).toLocaleDateString()}</dd>
                                      </div>
                                    )}
                                  </dl>
                                  
                                  {/* Show edit button if not verified */}
                                  {salonData?.licenseStatus !== 'verified' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-3"
                                      onClick={() => {
                                        // Open license form dialog
                                        setLicenseDialogOpen(true);
                                      }}
                                    >
                                      Update License Information
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              {/* If license data is incomplete, show form */}
                              {(!salonData?.licenseNumber || !salonData?.licenseState) && (
                                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                  <div className="flex items-start mb-3">
                                    <div className="flex-shrink-0">
                                      <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                      <h3 className="text-sm font-medium text-blue-800">VMB! Salon License Requirement</h3>
                                      <div className="mt-1 text-sm text-blue-700">
                                        <p>To register as a SALON OWNER, a valid state license for your specialization is REQUIRED.</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2 space-y-3 text-sm text-blue-700">
                                    <p>Enter your license info and submit. The verification of license status typically takes 2-3 days, often it's same day, but this is not guaranteed. During this period, you will be limited to 3 client invitations.</p>
                                    
                                    <Button 
                                      className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white" 
                                      onClick={() => {
                                        // Open license form dialog
                                        setLicenseDialogOpen(true);
                                      }}
                                    >
                                      Submit License Information
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* VMB PSP Section */}
                    <Card className="rounded-lg shadow-sm overflow-hidden border border-pink-100">
                      <div 
                        className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
                        onClick={() => setVmbPspSectionOpen(!vmbPspSectionOpen)}
                      >
                        <h4 className="font-medium text-sm text-pink-700">VMB PSP</h4>
                        <ChevronDown 
                          className={`h-4 w-4 text-pink-600 transition-transform ${vmbPspSectionOpen ? 'transform rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {vmbPspSectionOpen && (
                        <div className="p-3 bg-white">
                          <div className="container">
                            
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                </CardContent>
              )}
            </Card>
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


      </main>
      <Footer />
      
      {/* License Dialog Component */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salon License Information</DialogTitle>
            <DialogDescription>
              To register as a salon owner, please provide your valid state license information. This is required for verification.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...licenseForm}>
            <form onSubmit={licenseForm.handleSubmit(handleLicenseSubmission)} className="space-y-4">
              <FormField
                control={licenseForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name as listed on license</FormLabel>
                    <FormControl>
                      <Input placeholder="Full legal name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={licenseForm.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter exactly as it appears on your license" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter exactly as it appears on your license (letters and numbers if shown)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={licenseForm.control}
                name="licenseState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select state</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                        <SelectItem value="DC">District of Columbia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={licenseForm.control}
                name="exactMatch"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I verify this information is accurate</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={licenseForm.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I agree to VMB license verification terms</FormLabel>
                      <FormDescription>
                        By checking this box, you agree to allow VMB to verify your license information with the appropriate state board.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLicenseDialogOpen(false)}
                >
                  Enter Later
                </Button>
                <Button type="submit">Enter License</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}