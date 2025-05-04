import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { 
  CheckCircleIcon, 
  ChevronRightIcon, 
  UserIcon,
  UserPlusIcon, 
  CreditCardIcon, 
  CalendarIcon,
  AlertTriangle 
} from "lucide-react";

interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  gifUrl?: string;
  featured?: boolean;
}

interface GiftCreationFlowProps {
  clientId: number;
  salonId?: number;
  onComplete?: () => void;
}

export default function GiftCreationFlow({ clientId, salonId, onComplete }: GiftCreationFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<string>("style");
  const [recipientData, setRecipientData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [personalMessage, setPersonalMessage] = useState("");
  const [invitationId, setInvitationId] = useState<number | null>(null);

  // If salonId is not provided, we need to fetch the salon associated with the client
  // or default to Tiffany's salon (ID: 2) which is the sponsor
  const useSalonId = salonId || 2; // Default to Tiffany's salon if none specified
  
  // Initialize hidden input with default values
  useEffect(() => {
    // Set initial value for styleOptions hidden field
    const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
    if (styleOptionsElement) {
      // This styling data is what VmbStyleOptions uses to identify client-salon relationships
      const styleOptionsData = {
        styleId: -1, // Will be updated when user selects a style
        clientId: clientId || 0,
        salonId: useSalonId || 0,
        invitationId: 0
      };
      styleOptionsElement.value = JSON.stringify(styleOptionsData);
      console.log(`GiftCreationFlow: Initialized styleOptions with clientId=${clientId}, salonId=${useSalonId}`);
    }
  }, [clientId, useSalonId]);

  // Fetch salon services in real-time
  const { data: services, isLoading: isLoadingServices, error: servicesError } = useQuery({
    queryKey: [`/api/salons/${useSalonId}/services`],
    queryFn: async () => {
      try {
        console.log(`GiftCreationFlow: Fetching real-time salon services for salon ID ${useSalonId}`);
        const response = await fetch(`/api/salons/${useSalonId}/services`);
        if (!response.ok) {
          throw new Error(`Failed to fetch real-time salon services: ${response.status}`);
        }
        const servicesData = await response.json();
        console.log(`GiftCreationFlow: Successfully fetched ${servicesData?.length || 0} real-time services`);
        return servicesData;
      } catch (error) {
        console.error('Error fetching real-time salon services:', error);
        throw error;
      }
    },
    enabled: !!useSalonId, // Only fetch if we have a salonId
    refetchOnWindowFocus: true, // Refresh data when window regains focus
    staleTime: 30000 // Consider data fresh for 30 seconds
  });

  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch client: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching client:', error);
        throw error;
      }
    },
    enabled: !!clientId
  });

  // Create Invitation Mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Invitation created successfully:", data);
      setInvitationId(data.id);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      
      // Move to confirmation step
      setStep("confirm");
      
      toast({
        title: "Gift Created!",
        description: "Your gift invitation has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error creating invitation:", error);
      toast({
        title: "Error",
        description: `Failed to create invitation: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handle style selection - watches for DOM changes to detect selection from VmbStyleOptions
  useEffect(() => {
    // Watch for changes in the DOM to detect style selection from VmbStyleOptions
    const styleSelectionObserver = new MutationObserver((mutations) => {
      // Check if we have a style selection form value
      const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
      if (styleOptionsElement && styleOptionsElement.value) {
        try {
          const styleData = JSON.parse(styleOptionsElement.value);
          
          // Make sure we have a valid style ID (not -1 which is the initialization value)
          if (styleData && styleData.styleId && styleData.styleId !== -1) {
            console.log(`GiftCreationFlow: Selected style ID: ${styleData.styleId} for client ${styleData.clientId} at salon ${styleData.salonId}`);
            
            // Update the selected style ID
            setSelectedStyleId(styleData.styleId);
            
            // Verify that the style exists in services
            const styleExists = services?.some((s: StyleOption) => s.id === styleData.styleId);
            if (styleExists) {
              console.log(`GiftCreationFlow: Style ${styleData.styleId} exists in salon services`);
            } else {
              console.log(`GiftCreationFlow: Warning - Style ${styleData.styleId} not found in salon services`);
            }
            
            // Move to recipient step
            setStep("recipient");
            
            // Add a small delay to allow for visual confirmation before transitioning
            setTimeout(() => {
              const recipientSection = document.querySelector('[value="recipient"]');
              if (recipientSection) {
                recipientSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
          }
        } catch (error) {
          console.error("Error parsing style selection data:", error);
        }
      }
    });

    // Start observing the document body for changes
    styleSelectionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value']
    });

    // Clean up observer on component unmount
    return () => {
      styleSelectionObserver.disconnect();
    };
  }, [services]); // Add services as dependency to ensure proper validation

  // Function to handle recipient data submission
  const handleRecipientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientData.name || !recipientData.phone) {
      toast({
        title: "Missing information",
        description: "Please provide recipient name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    setStep("payment");
  };

  // Function to handle payment and create the invitation
  const handlePayment = () => {
    if (!selectedStyleId || !client) {
      toast({
        title: "Missing Information",
        description: "Please complete all required steps first",
        variant: "destructive"
      });
      return;
    }
    
    // Find the selected style to get details
    const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
    if (!selectedStyle) {
      toast({
        title: "Error",
        description: "Selected style not found",
        variant: "destructive"
      });
      return;
    }
    
    // Create invitation data
    const invitationData = {
      name: recipientData.name,
      phone: recipientData.phone,
      email: recipientData.email || null,
      message: personalMessage || `Hi ${recipientData.name}, I would love a fresh set. My stylist has an opening for a ${services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || 'nail service'}. Will you Ven Me, Baby! ❤️❤️❤️`,
      styleId: selectedStyleId,
      stylePrice: selectedStyle.price,
      styleName: selectedStyle.name,
      clientId: clientId,
      salonId: useSalonId,
      status: "pending",
      senderName: client.name
    };
    
    // Call the mutation to create the invitation
    createInvitationMutation.mutate(invitationData);
    
    toast({
      title: "Processing Gift",
      description: "Creating your gift invitation...",
    });
  };

  // Function to handle gift creation confirmation
  const handleConfirm = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden field for style selection data */}
      <input type="hidden" name="styleOptions" id="styleOptions" />
      
      {/* Style Selection Step */}
      <Accordion
        type="single"
        defaultValue={step === "style" ? "style" : undefined}
        collapsible
        className="w-full"
      >
        <AccordionItem value="style" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 1
              </span>
              <span>Pick your style...</span>
            </div>
            {selectedStyleId && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              {isLoadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                  <span className="ml-2 text-gray-600">Loading salon services...</span>
                </div>
              ) : servicesError ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Services</h3>
                  <p className="text-sm text-gray-600 max-w-md mt-1">
                    We couldn't load the salon services. Using default services instead.
                  </p>
                  
                  <VmbStyleOptions 
                    salonId={useSalonId} 
                    clientId={clientId}
                    services={[
                      {
                        id: 1,
                        name: "French Tips",
                        description: "Classic French manicure with white tips",
                        price: 35,
                        duration: 45,
                        gifUrl: "/assets/french-tips.png"
                      },
                      {
                        id: 2,
                        name: "Gel Manicure",
                        description: "Long-lasting gel polish in your choice of color",
                        price: 40,
                        duration: 60,
                        gifUrl: "/assets/gel-manicure.png"
                      },
                      {
                        id: 3,
                        name: "Sculpted Acrylics",
                        description: "Full set of sculpted acrylic nails",
                        price: 55,
                        duration: 90,
                        gifUrl: "/assets/sculpted-acrylics.png",
                        featured: true
                      },
                      {
                        id: 4,
                        name: "Nail Art Design",
                        description: "Custom nail art and design",
                        price: 50,
                        duration: 75,
                        gifUrl: "/assets/glam-design.png"
                      }
                    ]}
                  />
                </div>
              ) : services?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
                  <h3 className="text-lg font-semibold text-amber-800">No Services Found</h3>
                  <p className="text-sm text-gray-600 max-w-md mt-1">
                    This salon has no services available. Using default services instead.
                  </p>
                  
                  <VmbStyleOptions 
                    salonId={useSalonId} 
                    clientId={clientId}
                    services={[
                      {
                        id: 1,
                        name: "French Tips",
                        description: "Classic French manicure with white tips",
                        price: 35,
                        duration: 45,
                        gifUrl: "/assets/french-tips.png"
                      },
                      {
                        id: 2,
                        name: "Gel Manicure",
                        description: "Long-lasting gel polish in your choice of color",
                        price: 40,
                        duration: 60,
                        gifUrl: "/assets/gel-manicure.png"
                      },
                      {
                        id: 3,
                        name: "Sculpted Acrylics",
                        description: "Full set of sculpted acrylic nails",
                        price: 55,
                        duration: 90,
                        gifUrl: "/assets/sculpted-acrylics.png",
                        featured: true
                      },
                      {
                        id: 4,
                        name: "Nail Art Design",
                        description: "Custom nail art and design",
                        price: 50,
                        duration: 75,
                        gifUrl: "/assets/glam-design.png"
                      }
                    ]}
                  />
                </div>
              ) : (
                <VmbStyleOptions 
                  salonId={useSalonId} 
                  clientId={clientId}
                  services={services}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Recipient Information Step */}
      <Accordion
        type="single"
        defaultValue={step === "recipient" ? "recipient" : undefined}
        collapsible
        className="w-full"
        disabled={!selectedStyleId}
      >
        <AccordionItem value="recipient" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 2
              </span>
              <span>Recipient information</span>
            </div>
            {step === "payment" && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <form onSubmit={handleRecipientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input 
                      id="recipientName" 
                      placeholder="Enter name" 
                      value={recipientData.name}
                      onChange={(e) => setRecipientData({...recipientData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Recipient Phone</Label>
                    <Input 
                      id="recipientPhone" 
                      placeholder="Enter phone number" 
                      value={recipientData.phone}
                      onChange={(e) => setRecipientData({...recipientData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
                  <Input 
                    id="recipientEmail" 
                    placeholder="Enter email address" 
                    value={recipientData.email}
                    onChange={(e) => setRecipientData({...recipientData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder={`Hi [NAME], I would love a fresh set. My stylist has an opening for a ${services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || '[STYLE]'}. Will you Ven Me, Baby! ❤️❤️❤️`}
                    className="min-h-[100px]"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Continue to Payment
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Payment Step */}
      <Accordion
        type="single"
        defaultValue={step === "payment" ? "payment" : undefined}
        collapsible
        className="w-full"
        disabled={step !== "payment" && step !== "confirm"}
      >
        <AccordionItem value="payment" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 3
              </span>
              <span>Payment</span>
            </div>
            {step === "confirm" && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gift Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Selected Style Info */}
                    {selectedStyleId && services && (
                      <div className="flex flex-col space-y-1 border-b pb-3">
                        <div className="font-medium text-lg text-pink-700">
                          {services.find((s: StyleOption) => s.id === selectedStyleId)?.name || "Selected Style"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {services.find((s: StyleOption) => s.id === selectedStyleId)?.description || "Custom nail service"}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">
                            {services.find((s: StyleOption) => s.id === selectedStyleId)?.duration || 60} min
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Recipient Info */}
                    <div className="flex flex-col space-y-2 border-b pb-3">
                      <div className="font-medium">Recipient Details</div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{recipientData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{recipientData.phone}</span>
                      </div>
                      {recipientData.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{recipientData.email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Price Info */}
                    <div className="flex justify-between pt-2 font-semibold text-lg">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-pink-700">
                        ${services?.find((s: StyleOption) => s.id === selectedStyleId)?.price?.toFixed(2) || "50.00"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600 mb-4">
                      By sending this gift, you're inviting {recipientData.name} to enjoy a salon service at {client?.salonName || "your salon"}. They'll receive your invitation and can schedule their appointment directly.
                    </p>
                    
                    <Button 
                      onClick={handlePayment}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      Send Gift Invitation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Confirmation Step */}
      <Accordion
        type="single"
        defaultValue={step === "confirm" ? "confirm" : undefined}
        collapsible
        className="w-full"
        disabled={step !== "confirm"}
      >
        <AccordionItem value="confirm" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 4
              </span>
              <span>Confirmation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Gift Invitation Sent!</h3>
                <p className="text-green-700 mb-4">
                  Your personal gift invitation has been created and sent to {recipientData.name}.
                </p>
                <p className="text-sm text-green-600 mb-6">
                  They'll receive your invitation for a {services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || 'salon service'} at {client?.salonName || "your connected salon"}.
                </p>
                
                <Button 
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Return to Gifts
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}