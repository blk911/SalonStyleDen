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
  ChevronRight as ChevronRightIcon, 
  ChevronDown as ChevronDownIcon,
  User as UserIcon,
  UserPlus as UserPlusIcon, 
  CreditCard as CreditCardIcon, 
  Calendar as CalendarIcon,
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
    email: "",
    signature: ""
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

  // Define Tiffany's salon services for Deborah
  const services = [
    {
      id: 1,
      name: "French Tips / Touch-Up",
      description: "Classic white tips or quick polish refresh",
      price: 40,
      duration: 30,
      gifUrl: "/assets/french-tips.png"
    },
    {
      id: 2,
      name: "Luxe Gel Manicure",
      description: "Glossy, chip-free color with lasting shine",
      price: 55,
      duration: 45,
      gifUrl: "/assets/gel-manicure.png"
    },
    {
      id: 3,
      name: "Sculpted Acrylics",
      description: "Custom-shaped acrylics for bold length",
      price: 70,
      duration: 60,
      gifUrl: "/assets/sculpted-acrylics.png",
      featured: true
    },
    {
      id: 4,
      name: "Glam Me! Custom Design",
      description: "Fully custom art, gems, 3D extras",
      price: 125,
      duration: 90,
      gifUrl: "/assets/glam-design.png"
    }
  ];

  // Fetch client details with their connected salon in real-time
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: async () => {
      try {
        console.log(`GiftCreationFlow: Fetching real-time client data for client ID ${clientId}`);
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch client data: ${response.status}`);
        }
        const clientData = await response.json();
        console.log(`GiftCreationFlow: Client connected to salon: ${clientData?.salonName || 'None'}`);
        return clientData;
      } catch (error) {
        console.error('Error fetching client data:', error);
        throw error;
      }
    },
    enabled: !!clientId,
    refetchOnWindowFocus: true, // Refresh data when window regains focus
    staleTime: 60000 // Consider data fresh for 1 minute
  });

  // Create Client-Driven Invitation Mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("GiftCreationFlow: Creating client-driven invitation with data:", data);
      
      // Mark this invitation as client-driven by adding a source field
      const invitationWithSource = {
        ...data,
        source: "client", // Add source field to differentiate from salon-driven invitations
        clientDriven: true // Explicit flag for client-driven invitations
      };
      
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationWithSource)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create invitation: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("GiftCreationFlow: Client invitation created successfully:", data);
      setInvitationId(data.id);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      
      // Also invalidate client-specific queries to ensure dashboard updates
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/invitations`] });
      }
      
      // Move to confirmation step
      setStep("confirm");
      
      toast({
        title: "Gift Invitation Sent!",
        description: "Your personal gift invitation has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("GiftCreationFlow: Error creating client invitation:", error);
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
      message: personalMessage || `Hi ${recipientData.name}, I would love a fresh set. My stylist has an opening for a ${services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || 'nail service'}. Will you Ven Me, Baby! ❤️❤️❤️ ${recipientData.signature || ""}`,
      signature: recipientData.signature || "",
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
      <div className="rounded-lg bg-pink-50 mb-6">
        <div className="bg-pink-100 rounded-t-lg px-4 py-2 flex items-center justify-between cursor-pointer"
             onClick={() => step === "style" ? setStep("") : setStep("style")}>
          <h3 className="text-pink-800 font-semibold flex items-center">
            STEP 1 Pick your style...
          </h3>
          <div className="flex items-center">
            {selectedStyleId && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
            <ChevronDownIcon className={`h-5 w-5 text-pink-800 transition-transform ${step === "style" ? "transform rotate-180" : ""}`} />
          </div>
        </div>
        
        {step === "style" && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className={`border rounded px-2 py-2 ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'} cursor-pointer hover:border-pink-400 transition-colors duration-200 ${selectedStyleId === service.id ? 'border-pink-500 ring-1 ring-pink-500 bg-white' : 'bg-white'}`}
                  onClick={() => {
                    // Set selectedStyleId for UI
                    setSelectedStyleId(service.id);
                    
                    // Set hidden field value for VmbStyleOptions compatibility
                    const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
                    if (styleOptionsElement) {
                      styleOptionsElement.value = JSON.stringify({
                        styleId: service.id,
                        clientId: clientId,
                        salonId: useSalonId
                      });
                      
                      // Create and dispatch change event
                      const event = new Event('change', { bubbles: true });
                      styleOptionsElement.dispatchEvent(event);
                    }
                  }}
                >
                  <div className="flex">
                    {/* Left side - Text (2/3) */}
                    <div className="w-2/3 text-left pr-2">
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
                        src={service.gifUrl} 
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipient Information Step */}
      <div className="rounded-lg bg-pink-50 mb-6">
        <div className="bg-pink-100 rounded-t-lg px-4 py-2 flex items-center justify-between cursor-pointer"
             onClick={() => selectedStyleId && (step === "recipient" ? setStep("") : setStep("recipient"))}
             style={{opacity: selectedStyleId ? 1 : 0.5, pointerEvents: selectedStyleId ? 'auto' : 'none'}}>
          <h3 className="text-pink-800 font-semibold flex items-center">
            STEP 2 Style Your Invitation...
          </h3>
          <div className="flex items-center">
            {step === "payment" && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
            <ChevronDownIcon className={`h-5 w-5 text-pink-800 transition-transform ${step === "recipient" ? "transform rotate-180" : ""}`} />
          </div>
        </div>
        
        {step === "recipient" && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-center mb-3 font-medium">Your Invitation Design</h3>
                <div className="space-y-2 border-dotted border border-pink-200 rounded-md p-3">
                  <Input 
                    placeholder="Client Name"
                    value={recipientData.name}
                    onChange={(e) => {
                      setRecipientData({...recipientData, name: e.target.value});
                      
                      // Update message by replacing [NAME] with the actual name
                      const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
                      const styleName = selectedStyle ? selectedStyle.name : "[STYLE]";
                      
                      // Create message with placeholders filled
                      const updatedMessage = `Hi ${e.target.value || "[NAME]"}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${recipientData.signature || "[SIGNED]"}`;
                      setPersonalMessage(updatedMessage);
                    }}
                    required
                    className="flex-1"
                    onKeyDown={(e) => {
                      // Update message with name when Enter is pressed
                      if (e.key === 'Enter' && recipientData.name.trim().length > 0) {
                        e.preventDefault();
                        
                        // Update message with name when Enter is pressed
                        const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
                        const styleName = selectedStyle ? selectedStyle.name : "[STYLE]";
                        const updatedMessage = `Hi ${recipientData.name}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${recipientData.signature || "[SIGNED]"}`;
                        setPersonalMessage(updatedMessage);
                        
                        // Move to next field
                        const phoneInput = document.querySelector('input[placeholder="Phone Number"]') as HTMLInputElement;
                        if (phoneInput) phoneInput.focus();
                      }
                    }}
                  />
                  
                  <Input
                    placeholder="Phone Number"
                    type="tel"
                    value={recipientData.phone}
                    onChange={(e) => setRecipientData({...recipientData, phone: e.target.value})}
                    required
                    className="flex-1"
                    onKeyDown={(e) => {
                      // Move to next field on Enter when phone is complete
                      if (e.key === 'Enter' && recipientData.phone.replace(/\D/g, '').length >= 10) {
                        e.preventDefault();
                        
                        // Move to signature field
                        const signatureInput = document.querySelector('input[placeholder="SIGN HERE!"]') as HTMLInputElement;
                        if (signatureInput) signatureInput.focus();
                      }
                    }}
                  />
                  
                  <Input 
                    placeholder="SIGN HERE!"
                    value={recipientData.signature || ""}
                    onChange={(e) => {
                      setRecipientData({...recipientData, signature: e.target.value});
                      
                      // Update message signature
                      const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
                      const styleName = selectedStyle ? selectedStyle.name : "[STYLE]";
                      
                      // Create message with updated signature
                      const updatedMessage = `Hi ${recipientData.name || "[NAME]"}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${e.target.value || "[SIGNED]"}`;
                      setPersonalMessage(updatedMessage);
                    }}
                    className="flex-1"
                    onKeyDown={(e) => {
                      // Move to preview button on Enter
                      if (e.key === 'Enter' && recipientData.signature.trim().length > 0) {
                        e.preventDefault();
                        
                        // Focus on the preview button
                        const previewButton = document.querySelector('button.bg-blue-500') as HTMLButtonElement;
                        if (previewButton) previewButton.focus();
                      }
                    }}
                  />
                  
                  <div className="flex justify-center mt-4">
                    <Button 
                      type="button" 
                      onClick={() => {
                        toast({
                          title: "Design Preview",
                          description: "Invitation preview being prepared...",
                        });
                        
                        if (!recipientData.name || !recipientData.phone) {
                          toast({
                            title: "Missing Information",
                            description: "Please provide recipient name and phone",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Update hidden field to select styleId for Preview
                        const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
                        if (styleOptionsElement) {
                          styleOptionsElement.value = JSON.stringify({
                            styleId: selectedStyleId,
                            clientId: clientId,
                            salonId: useSalonId,
                            name: recipientData.name,
                            phone: recipientData.phone,
                            email: recipientData.email,
                            signature: recipientData.signature
                          });
                          
                          // Create and dispatch change event
                          const event = new Event('change', { bubbles: true });
                          styleOptionsElement.dispatchEvent(event);
                        }
                        
                        // Move to next step
                        handleRecipientSubmit({preventDefault: () => {}} as React.FormEvent);
                      }}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      Preview Invitation
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-center mb-3 font-medium">Message Preview</h3>
                <div className="border-dotted border border-pink-200 rounded-md p-3">
                  {/* Message preview is in the blue box */}
                  <div className="rounded-md p-3 bg-blue-100 mb-3">
                    Hi {recipientData.name || "[NAME]"}, I would love a fresh set. My stylist has an opening for a {services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || "French Tips / Touch-Up"}, will you Ven Me, Baby! <span className="text-red-500">❤️</span> <span className="text-red-500">❤️</span> <span className="text-red-500">❤️</span> {recipientData.signature || "[SIGNED]"}
                  </div>
                  
                  {/* Style card preview */}
                  {selectedStyleId && services && (
                    <div className="flex items-center gap-2 border border-gray-200 rounded-md p-2 my-3 bg-white">
                      <img 
                        src={services.find((s: StyleOption) => s.id === selectedStyleId)?.gifUrl || '/assets/default-nail.png'} 
                        alt="Selected style"
                        className="h-14 w-14 object-cover rounded-md"
                      />
                      <div>
                        <div className="font-medium">
                          {services.find((s: StyleOption) => s.id === selectedStyleId)?.name || "French Tips / Touch-Up"}
                        </div>
                        <div className="text-gray-600">
                          ${services.find((s: StyleOption) => s.id === selectedStyleId)?.price || "40"} • {services.find((s: StyleOption) => s.id === selectedStyleId)?.duration || "30"} min
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Unique ID */}
                  <div className="mb-3 text-center">
                    <div className="text-xs text-gray-500">Your VMB gift has a unique ID:</div>
                    <div className="text-xs font-mono bg-gray-50 p-1 rounded border border-gray-100">
                      VMB-00001
                    </div>
                  </div>
                  
                  {/* Payment icons */}
                  <div className="flex gap-3 items-center justify-center">
                    <button className="h-8 w-8 rounded-full bg-blue-500 text-white shadow-sm flex items-center justify-center hover:bg-blue-600 transition-colors">
                      <span className="text-xs font-bold">Z</span>
                    </button>
                    <button className="h-8 w-8 rounded-full bg-teal-500 text-white shadow-sm flex items-center justify-center hover:bg-teal-600 transition-colors">
                      <span className="text-xs font-bold">V</span>
                    </button>
                    <button className="h-8 w-8 rounded-full bg-green-500 text-white shadow-sm flex items-center justify-center hover:bg-green-600 transition-colors">
                      <span className="text-xs font-bold">CA</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleRecipientSubmit}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Continue
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Step */}
      <div className="rounded-lg bg-pink-50 mb-6">
        <div className="bg-pink-100 rounded-t-lg px-4 py-2 flex items-center justify-between cursor-pointer"
             onClick={() => step === "payment" ? setStep("") : setStep("payment")}
             style={{opacity: (step === "payment" || step === "confirm") ? 1 : 0.5, pointerEvents: (step === "payment" || step === "confirm") ? 'auto' : 'none'}}>
          <h3 className="text-pink-800 font-semibold flex items-center">
            STEP 3 Payment
          </h3>
          <div className="flex items-center">
            {step === "confirm" && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
            <ChevronDownIcon className={`h-5 w-5 text-pink-800 transition-transform ${step === "payment" ? "transform rotate-180" : ""}`} />
          </div>
        </div>
        
        {step === "payment" && (
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
        )}
      </div>

      {/* Confirmation Step */}
      <div className="rounded-lg bg-pink-50 mb-6">
        <div className="bg-pink-100 rounded-t-lg px-4 py-2 flex items-center justify-between cursor-pointer"
             onClick={() => step === "confirm" ? setStep("") : setStep("confirm")}
             style={{opacity: step === "confirm" ? 1 : 0.5, pointerEvents: step === "confirm" ? 'auto' : 'none'}}>
          <h3 className="text-pink-800 font-semibold flex items-center">
            STEP 4 Confirmation
          </h3>
          <div className="flex items-center">
            <ChevronDownIcon className={`h-5 w-5 text-pink-800 transition-transform ${step === "confirm" ? "transform rotate-180" : ""}`} />
          </div>
        </div>
        
        {step === "confirm" && (
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
        )}
      </div>
    </div>
  );
}