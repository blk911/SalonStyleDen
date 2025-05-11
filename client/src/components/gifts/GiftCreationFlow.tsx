import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { formatPhoneNumber, cleanPhoneNumber, normalizePhoneForStorage } from "@/lib/utils";
import { Loader2, SendIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";
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
  const [showFinalInvitationModal, setShowFinalInvitationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
        
        // Log that we have client data (form initialization happens in useEffect)
        if (clientData?.name) {
          console.log(`GiftCreationFlow: Client data fetched successfully: ${clientData.name}`);
        }
        
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

  // Create Gift Mutation - Updated to use the gift API endpoints
  const createGiftMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("GiftCreationFlow: Creating gift with data:", data);
      
      // Transform the data to match the gift API format
      const giftData = {
        senderId: data.senderId,
        recipientName: data.name,
        recipientPhone: data.phone,
        recipientEmail: data.email || null,
        message: data.message,
        value: data.stylePrice, // Used instead of amount in the UI
        status: 'pending',
        styleId: data.styleId,
        styleName: data.styleOption
      };
      
      console.log("GiftCreationFlow: Transformed gift data:", giftData);
      
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(giftData)
      });
      
      if (!response.ok) {
        // Try to parse the error response as JSON
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If it's not JSON, use the raw text
          const errorText = await response.text();
          throw new Error(`Failed to create gift: ${response.status} - ${errorText}`);
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to create gift: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("GiftCreationFlow: Gift created successfully:", data);
      setInvitationId(data.id);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/gifts/sent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gifts/received'] });
      
      // Also invalidate client-specific queries to ensure dashboard updates
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/gifts/sent/${clientId}`] });
      }
      
      // Close the preview modal
      setShowFinalInvitationModal(false);
      
      // Show the confirmation dialog
      setShowConfirmDialog(true);
      
      toast({
        title: "Gift Created!",
        description: `Your gift to ${recipientData.name} has been created and is in pending status.`,
      });
    },
    onError: (error: any) => {
      const errorMsg = error.message || "An unexpected error occurred";
      console.error("[ERROR][GiftCreationFlow] Error creating gift:", error);
      
      // Format user-friendly error messages based on error types
      let userMessage = "There was a problem sending your gift. Please try again.";
      let errorDetails = "";
      
      // Check for specific error types
      if (errorMsg.includes("500")) {
        userMessage = "Server error. Please try again in a few moments.";
      }
      
      // Close the modal
      setShowFinalInvitationModal(false);
      
      // Set detailed error state with additional information if available
      setError(errorDetails ? `${userMessage} ${errorDetails}` : userMessage);
      
      // Show toast alert
      toast({
        title: "Failed to Create Gift",
        description: userMessage,
        variant: "destructive",
        duration: 5000
      });
      
      // Go back to the recipient step to fix the issue
      setStep("recipient");
    }
  });

  // Initialize form fields when client data becomes available
  useEffect(() => {
    if (client?.name) {
      console.log(`GiftCreationFlow: Client data loaded, initializing form fields with name: ${client.name}`);
      // Only set the signature field with client name, leave recipient name blank for user input
      setRecipientData(prevData => ({
        ...prevData,
        // Don't set the recipient name field - leave it blank for user input
        signature: client.name
      }));

      // Update message if we have a selected style
      if (selectedStyleId) {
        const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
        const styleName = selectedStyle ? selectedStyle.name : "French Tips / Touch-Up";
        // Use placeholder text in message until user enters a recipient name
        setPersonalMessage(`Hi ${recipientData.name || "[recipient]"}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${client.name}`);
      }
    }
  }, [client, selectedStyleId, recipientData.name]);

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
    
    // Clear any previous errors
    setError(null);
    
    if (!recipientData.name || !recipientData.phone) {
      toast({
        title: "Missing information",
        description: "Please provide recipient name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    // Show the preview dialog instead of going to a new step
    showPreviewDialog();
  };

  // Function to show the preview dialog
  const showPreviewDialog = () => {
    // Clear any previous errors
    setError(null);
    
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
    
    // Show the final rendered invitation modal
    setShowFinalInvitationModal(true);
    
    // Log the preview action
    console.log("[FLOW][GiftCreationFlow] Opening invitation preview", {
      recipientName: recipientData.name,
      recipientContact: recipientData.phone,
      styleId: selectedStyleId,
      salonId: useSalonId
    });
  };

  // Function to create and send the gift
  const handleGiftCreation = async () => {
    // Clear any previous errors
    setError(null);
    
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
    
    // Create gift data
    const giftData = {
      name: recipientData.name,
      phone: recipientData.phone,
      email: recipientData.email || null,
      message: personalMessage || `Hi ${recipientData.name}, I would love a fresh set. My stylist has an opening for a ${services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || 'nail service'}. Will you Ven Me, Baby! ❤️❤️❤️ ${recipientData.signature || ""}`,
      signature: recipientData.signature || client?.name || "",
      styleId: selectedStyleId,
      styleOption: selectedStyle.name,
      stylePrice: selectedStyle.price * 100, // Convert to cents for database
      styleDuration: selectedStyle.duration,
      clientId: clientId,
      salonId: useSalonId,
      status: "pending",
      senderName: client?.name || "Client",
      invitationType: "client_to_friend",
      styleImageUrl: selectedStyle.gifUrl,
      senderId: clientId // Important: we need to set the sender ID to make sure gifts show up in sent list
    };
    
    // Log the gift data being sent
    console.log("Creating gift with data:", giftData);
    
    // Instead of directly calling the mutation, better handle the error scenarios
    try {
      toast({
        title: "Creating Gift",
        description: "Creating your gift in pending status...",
      });
      
      // Call the mutation to create the gift
      createGiftMutation.mutate(giftData);
    } catch (error) {
      console.error("Error initiating gift creation:", error);
      
      toast({
        title: "Error",
        description: "Failed to process your gift. Please try again.",
        variant: "destructive"
      });
      
      setError("There was a problem sending your gift. Please try again later.");
    }
  };

  // Import useLocation from wouter at the top of your file if not already imported
  const [, setLocation] = useLocation();
  
  // Function to handle gift creation confirmation
  const handleConfirm = () => {
    // Invalidate any queries to ensure we get fresh data
    queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    
    // Call onComplete to close the creation dialog and refresh the parent component
    if (onComplete) {
      onComplete();
    }
    
    // Only redirect if we have a valid clientId
    if (clientId && clientId > 0) {
      console.log(`GiftCreationFlow: Redirecting to client dashboard for ID ${clientId}`);
      // Use React navigation instead of direct window.location manipulation
      setLocation(`/client/${clientId}`);
    } else {
      console.error("GiftCreationFlow: Cannot redirect - invalid clientId", clientId);
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
            {selectedStyleId && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
            <ChevronDownIcon className={`h-5 w-5 text-pink-800 transition-transform ${step === "recipient" ? "transform rotate-180" : ""}`} />
          </div>
        </div>
        
        {step === "recipient" && (
          <div className="p-4">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Error Sending Invitation</h4>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-center mb-3 font-medium">Your Invitation Design</h3>
                <div className="space-y-2 border-dotted border border-pink-200 rounded-md p-3">
                  <Input 
                    placeholder="Recipient Name"
                    value={recipientData.name}
                    onChange={(e) => {
                      setRecipientData({...recipientData, name: e.target.value});
                      
                      // Update message by replacing [NAME] with the actual name
                      const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
                      const styleName = selectedStyle ? selectedStyle.name : "[STYLE]";
                      
                      // Create message with placeholders filled
                      const updatedMessage = `Hi ${e.target.value || "[recipient]"}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${recipientData.signature || client?.name || "[SIGNED]"}`;
                      setPersonalMessage(updatedMessage);
                    }}
                    required
                    className="flex-1"
                    onFocus={(e) => {
                      // Don't auto-fill recipient name field - leave it blank for user input
                      // Just make sure message has proper placeholders
                      const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
                      const styleName = selectedStyle ? selectedStyle.name : "[STYLE]";
                      if (!personalMessage) {
                        const updatedMessage = `Hi ${recipientData.name || "[recipient]"}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${recipientData.signature || client?.name || "[SIGNED]"}`;
                        setPersonalMessage(updatedMessage);
                      }
                    }}
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
                    onChange={(e) => {
                      // Apply phone formatting rules from site-wide standard using the formatPhoneNumber utility
                      const phoneValue = formatPhoneNumber(e.target.value);
                      setRecipientData({...recipientData, phone: phoneValue});
                    }}
                    required
                    className="flex-1"
                    onBlur={() => {
                      // Validate phone on blur (site-wide standard)
                      const cleanPhone = cleanPhoneNumber(recipientData.phone);
                      if (cleanPhone.length === 10) {
                        // Format consistently using the site-wide utility function
                        const formattedPhone = formatPhoneNumber(cleanPhone);
                        setRecipientData({...recipientData, phone: formattedPhone});
                      }
                    }}
                    onKeyDown={(e) => {
                      // Move to next field on Enter when phone is complete
                      const cleanPhone = cleanPhoneNumber(recipientData.phone);
                      if (e.key === 'Enter' && cleanPhone.length >= 10) {
                        e.preventDefault();
                        
                        // Move to signature field
                        const signatureInput = document.querySelector('input[placeholder="SIGN HERE!"]') as HTMLInputElement;
                        if (signatureInput) signatureInput.focus();
                      }
                    }}
                  />
                  
                  <Input 
                    placeholder="SIGN HERE!"
                    value={client?.name || recipientData.signature || ""}
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
                    onFocus={(e) => {
                      // Auto-fill with client name if empty
                      if (!e.target.value && client?.name) {
                        const clientName = client.name;
                        setRecipientData(prev => ({...prev, signature: clientName}));
                        
                        // Update message with client name too
                        const selectedStyle = services?.find((s: StyleOption) => s.id === selectedStyleId);
                        const styleName = selectedStyle ? selectedStyle.name : "[STYLE]";
                        const updatedMessage = `Hi ${recipientData.name || "[NAME]"}, I would love a fresh set. My stylist has an opening for a ${styleName}, will you Ven Me, Baby! ❤️ ❤️ ❤️ ${clientName}`;
                        setPersonalMessage(updatedMessage);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Move to preview button on Enter
                      if (e.key === 'Enter' && recipientData.signature.trim().length > 0) {
                        e.preventDefault();
                        
                        // Focus on the preview button
                        const previewButton = document.querySelector('button.bg-pink-500') as HTMLButtonElement;
                        if (previewButton) previewButton.focus();
                      }
                    }}
                  />
                  
                  <div className="flex justify-center mt-4">
                    <Button 
                      type="button" 
                      onClick={showPreviewDialog}
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
                    <button className="h-8 w-8 rounded-full bg-green-500 text-white shadow-sm flex items-center justify-center hover:bg-green-600 transition-colors">
                      <span className="text-xs font-bold">V</span>
                    </button>
                    <button className="h-8 w-8 rounded-full bg-pink-500 text-white shadow-sm flex items-center justify-center hover:bg-pink-600 transition-colors">
                      <span className="text-xs font-bold">CA</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Modal - Final rendered invitation */}
      <Dialog open={showFinalInvitationModal} onOpenChange={setShowFinalInvitationModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Invitation Preview
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              This is how your invitation will appear to the recipient. Click "Confirm to Send" when ready.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <div className="bg-white rounded-lg shadow-md p-5 mb-5">
              <RenderedInvitation 
                inviteId="preview"
                recipientName={recipientData.name}
                styleOption={services?.find((s: StyleOption) => s.id === selectedStyleId)?.name || "Selected Style"}
                price={`$${services?.find((s: StyleOption) => s.id === selectedStyleId)?.price || "45"}`}
                time={`${services?.find((s: StyleOption) => s.id === selectedStyleId)?.duration || "30"} min`}
                imageUrl={services?.find((s: StyleOption) => s.id === selectedStyleId)?.gifUrl || "/assets/french-tips.png"}
                senderName={recipientData.signature || client?.name || "You"}
                status="pending"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowFinalInvitationModal(false);
              }}
            >
              Back to Salon
            </Button>
            
            <Button 
              type="button"
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-medium"
              disabled={createGiftMutation.isPending}
              onClick={handleGiftCreation}
            >
              {createGiftMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SendIcon className="h-4 w-4" />
                  <span>CONFIRM TO SEND</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog - Success message with one Close button */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        if (!open) {
          // Redirect to client dashboard when modal is closed
          window.location.href = '/client/' + clientId;
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              Gift Sent!
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              Your gift has been sent successfully. Click "Close" to return to your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 text-center">
            <p className="mb-4">
              Your gift has been sent successfully to {recipientData.name}.
            </p>
            
            <div className="border rounded shadow-sm p-4 bg-gray-50 mb-4">
              <div className="grid grid-cols-2 gap-y-2 text-sm text-left">
                <div className="text-gray-600">Recipient:</div>
                <div>{recipientData.name}</div>
                
                <div className="text-gray-600">Style:</div>
                <div>{services?.find((s: StyleOption) => s.id === selectedStyleId)?.name}</div>
                
                <div className="text-gray-600">Price:</div>
                <div>${services?.find((s: StyleOption) => s.id === selectedStyleId)?.price}</div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full"
              onClick={() => {
                // Redirect to client dashboard
                window.location.href = '/client/' + clientId;
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}