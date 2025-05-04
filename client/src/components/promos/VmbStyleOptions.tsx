/**
 * VmbStyleOptions Component
 * 
 * ✅ UPDATED FOR GIFT CREATION FLOW
 * 
 * This component manages the three-step process for style selection,
 * invitation customization, and invitation sending. It works for both client-initiated
 * and salon-initiated invitations and adapts its UI and behavior based on the context.
 * 
 * The component handles:
 * 1. Style selection from available salon services
 * 2. Recipient information input and validation
 * 3. Preview and sending of invitation
 * 
 * Now updated with support for GiftCreationFlow
 */
import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronRightIcon, CircleCheckIcon, PlusCircleIcon, SendIcon, SparklesIcon, UserPlusIcon, XIcon } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import InviteCompleteStatus from '@/components/dashboard/InviteCompleteStatus';

// Define the style option interface
interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  gifUrl?: string;
  featured?: boolean;
}

// Define the style selection interface
interface StyleSelection {
  id: number;
  clientId: number;
  styleId: number;
  salonId: number;
  selectedAt: string;
  status: string;
  invitationId?: number;
  createdAt?: string;
}

// Schema for the style selection form validation
const styleSelectionSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().min(7, { message: "Please enter a valid phone number" }),
  message: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email" }).optional().or(z.literal('')),
  sponsor: z.string().optional(),
});

// Define the form values interface from the schema
type StyleSelectionFormValues = z.infer<typeof styleSelectionSchema>;

// Helper function to get the image URL for the service
function getImageUrl(url: string, context = 'default') {
  // Log for debugging
  console.log(`[getImageUrl:${context}] Input URL:`, url);
  
  // If the URL starts with '/', it's an asset that needs to be treated differently
  if (url.startsWith('/')) {
    const timeParam = `?t=${Date.now()}`;
    const assetPath = `${url}${timeParam}`;
    console.log(`[getImageUrl:${context}] Asset path with leading slash detected:`, assetPath);
    return assetPath;
  }
  
  // For relative or full URLs, just return them
  return url;
}

// Props interface for the component
interface VmbStyleOptionsProps {
  services?: StyleOption[];
  clientId?: number;
  salonId?: number;
  invitationId?: number;
  salonInitiated?: boolean;
  recipientData?: {
    name: string;
    phone: string;
    sponsor: string;
  };
  onSelectionComplete?: (selection: StyleSelection) => void;
  onStyleSelect?: (styleId: number) => void;
  initialStyleId?: number;
  isPreviewMode?: boolean;
  shouldPrefill?: boolean;
  prefilledServices?: string[];
}

// Main component
export function VmbStyleOptions({ 
  services,
  clientId,
  salonId,
  invitationId,
  salonInitiated = false,
  recipientData,
  onSelectionComplete,
  onStyleSelect,
  initialStyleId,
  isPreviewMode = false,
  shouldPrefill = false,
  prefilledServices
}: VmbStyleOptionsProps) {
  // State hooks
  const [step, setStep] = useState(1);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(initialStyleId || null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [styleSelectionId, setStyleSelectionId] = useState<number | null>(null);
  const [clientSelections, setClientSelections] = useState<StyleSelection[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Media query hook for responsive design
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Toast hook for notifications
  const { toast } = useToast();

  // Form initialization with zod resolver
  const form = useForm<StyleSelectionFormValues>({
    resolver: zodResolver(styleSelectionSchema),
    defaultValues: {
      name: recipientData?.name || '',
      phone: recipientData?.phone || '',
      message: '',
      email: '',
      sponsor: recipientData?.sponsor || '',
    },
  });

  // Fetch services data if not provided via props
  const { data: fetchedServices, isLoading: isLoadingServices } = useQuery({
    queryKey: salonId ? [`/api/salons/${salonId}/services`] : ['/api/services'],
    queryFn: async () => {
      const endpoint = salonId ? `/api/salons/${salonId}/services` : `/api/services`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !services && !!salonId, // Only fetch if services aren't provided via props
  });

  // Fetch client's style selections
  const { data: clientSelectionsData } = useQuery({
    queryKey: [`/api/clients/${clientId}/style-selections`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/style-selections`);
      if (!response.ok) {
        throw new Error('Failed to fetch client selections');
      }
      return response.json();
    },
    enabled: !!clientId, // Only fetch if clientId is provided
  });

  // Mutation to create a style selection
  const createStyleSelectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/style-selections`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setStyleSelectionId(data.id);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/style-selections`] });
      
      if (onSelectionComplete) {
        onSelectionComplete(data);
      }
      
      setShowConfirmation(true);
    },
  });

  // Mutation to create an invitation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/invitations`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      setShowThankYou(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update client selections when data is fetched
  useEffect(() => {
    if (clientSelectionsData) {
      setClientSelections(clientSelectionsData);
    }
  }, [clientSelectionsData]);

  // Update selected style when services data is fetched and initialStyleId is provided
  useEffect(() => {
    const servicesData = services || fetchedServices;
    if (servicesData && initialStyleId) {
      const style = servicesData.find((s: StyleOption) => s.id === initialStyleId);
      if (style) {
        setSelectedStyle(style);
      }
    }
  }, [services, fetchedServices, initialStyleId]);

  // Handle style selection
  const handleSelectStyle = (style: StyleOption) => {
    setSelectedStyleId(style.id);
    setSelectedStyle(style);
    
    // If onStyleSelect callback is provided, call it and don't proceed to next step
    if (onStyleSelect) {
      onStyleSelect(style.id);
      return;
    }
    
    // Otherwise, proceed with the normal flow
    if (!isPreviewMode) {
      setStep(2);
    }
  };

  // Handle form submission
  const onSubmit = async (values: StyleSelectionFormValues) => {
    if (!selectedStyleId || !clientId || !salonId) {
      toast({
        title: "Missing information",
        description: "Please select a style and provide all required information",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create style selection
      const styleSelection = {
        clientId,
        styleId: selectedStyleId,
        salonId,
        status: 'pending',
      };
      
      await createStyleSelectionMutation.mutateAsync(styleSelection);
      
      // If not preview mode and not on final step, proceed to next step
      if (!isPreviewMode && step < 3) {
        setStep(3);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Handle sending invitation
  const handleSendInvitation = async () => {
    if (!styleSelectionId || !selectedStyleId || !clientId || !salonId) {
      toast({
        title: "Missing information",
        description: "Please complete all steps before sending the invitation",
        variant: "destructive",
      });
      return;
    }
    
    const values = form.getValues();
    
    try {
      // Create invitation
      const invitationData = {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        message: values.message || undefined,
        sponsor: values.sponsor || undefined,
        salonId,
        clientId: salonInitiated ? null : clientId, // If salon initiated, do not set the client
        sponsorClientId: salonInitiated ? clientId : null, // If client initiated, use client as sponsor
        styleSelectionId,
        // Add necessary fields
      };
      
      await createInvitationMutation.mutateAsync(invitationData);
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setStep(1);
    setSelectedStyleId(null);
    setSelectedStyle(null);
    setStyleSelectionId(null);
    setShowConfirmation(false);
    setShowThankYou(false);
    form.reset();
  };

  // Helper method to get prefilled services
  const getPrefillServices = () => {
    if (!shouldPrefill || !prefilledServices || !services) return null;
    
    return services.filter(service => 
      prefilledServices.includes(service.name.toLowerCase())
    );
  };

  // Render based on the current step
  const renderContent = () => {
    const servicesData = services || fetchedServices || [];
    const prefillServices = getPrefillServices();
    
    switch (step) {
      case 1: // Style selection step
        return (
          <div className="space-y-3">
            {/* Render step 1 content - Style selection */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 1: Select Your Style...</h2>
                {selectedStyle && (
                  <div className="ml-auto flex items-center">
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <CircleCheckIcon className="h-4 w-4" />
                      Selected: {selectedStyle.name}
                    </span>
                  </div>
                )}
              </div>
              
              <Collapsible defaultOpen={true} className="w-full">
                <div className="flex items-center justify-between rounded-t-md border border-pink-100 p-2 bg-pink-50">
                  <span className="text-sm font-medium">Browse Service Options</span>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 hover:bg-pink-100">
                      <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="bg-white border border-pink-100 rounded-b-md p-3">
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                    {servicesData && servicesData.length > 0 ? servicesData.map((service) => (
                      <div 
                        key={service.id} 
                        className={`border rounded ${isMobile ? 'px-2 py-1' : 'px-2 py-2'} ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'} cursor-pointer hover:border-pink-400 transition-colors duration-200`}
                        onClick={() => handleSelectStyle(service)}
                      >
                        <div className={`${isMobile ? 'flex flex-col' : 'flex'}`}>
                          {/* Left side - Text (2/3 on desktop, full width on mobile) */}
                          <div className={`${isMobile ? 'w-full' : 'w-2/3'} text-left pr-2`}>
                            <h3 className="font-medium text-compact">{service.name}</h3>
                            <p className="text-mini text-gray-600">{service.description}</p>
                            
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-bold text-compact">${Math.round(service.price)}</span>
                              <span className="text-micro">{service.duration} min</span>
                            </div>
                          </div>
                          
                          {/* Right side - Image (1/3) */}
                          <div className="w-1/3 flex items-center justify-end pl-2">
                            <img 
                              src={service.gifUrl ? getImageUrl(service.gifUrl, 'vmb_style') : '/assets/LOGO1.png'}
                              alt={service.name}
                              className="h-20 w-20 object-cover rounded-md"
                              onError={(e) => {
                                // Fallback to default image
                                e.currentTarget.src = '/assets/LOGO1.png';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )) : <div className="text-center p-4">No style options available</div>}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {prefillServices && prefillServices.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-sm text-pink-800 mb-2">Your Favorites:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {prefillServices.map((service) => (
                      <Button
                        key={service.id}
                        variant="outline"
                        className="justify-start border-pink-200 text-left"
                        onClick={() => handleSelectStyle(service)}
                      >
                        <span className="mr-2">{service.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">${Math.round(service.price)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {onStyleSelect ? null : (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="default"
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={() => setStep(2)}
                    disabled={!selectedStyleId}
                  >
                    Continue <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 2: // Form step
        return (
          <div className="space-y-4">
            <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 2: Recipient Information</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a personal message to your invitation"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!salonInitiated && (
                  <FormField
                    control={form.control}
                    name="sponsor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name (how recipient will know you)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="flex justify-between mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    disabled={createStyleSelectionMutation.isPending}
                  >
                    {createStyleSelectionMutation.isPending ? (
                      <>Processing...</>
                    ) : (
                      <>Continue <ChevronRightIcon className="ml-1 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
        
      case 3: // Preview and send step
        return (
          <div className="space-y-4">
            <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 3: Review & Send</h2>
            
            <div className="border rounded-lg p-4 bg-white">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Style:</span>
                  <span className="font-medium">{selectedStyle?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${selectedStyle?.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">{form.getValues().name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{form.getValues().phone}</span>
                </div>
                {form.getValues().email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{form.getValues().email}</span>
                  </div>
                )}
                {form.getValues().message && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 block">Message:</span>
                    <p className="text-sm mt-1 italic">"{form.getValues().message}"</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button 
                className="bg-pink-600 hover:bg-pink-700 text-white"
                onClick={handleSendInvitation}
                disabled={createInvitationMutation.isPending}
              >
                {createInvitationMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>Send Invitation <SendIcon className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // ThankYou component rendering
  const renderThankYou = () => (
    <div className="text-center p-6">
      <div className="bg-green-50 p-4 rounded-full inline-flex mb-4">
        <CircleCheckIcon className="h-10 w-10 text-green-500" />
      </div>
      <h3 className="text-xl font-medium text-green-800 mb-2">Invitation Sent!</h3>
      <p className="text-green-700 mb-6">
        Your invitation has been sent successfully.
      </p>
      <Button 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={handleReset}
      >
        Send Another
      </Button>
    </div>
  );

  // Confirmation dialog rendering
  const renderConfirmation = () => (
    <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Style Selected!</DialogTitle>
          <DialogDescription>
            You've selected {selectedStyle?.name}. Would you like to continue setting up your invitation?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirmation(false);
              setStep(1);
            }}
          >
            Change Selection
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setShowConfirmation(false);
              setStep(2);
            }}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Main render return
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* If in Thank You state, show only that */}
      {showThankYou ? (
        renderThankYou()
      ) : (
        <div className="space-y-4">
          {/* Main content based on current step */}
          {renderContent()}
          
          {/* Confirmation dialog */}
          {renderConfirmation()}
        </div>
      )}
    </div>
  );
}