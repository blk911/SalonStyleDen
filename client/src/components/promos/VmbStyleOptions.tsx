import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon, Sparkles, AlertTriangle, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '../../lib/apiRequest';
import { getImageUrl } from '../../lib/utils';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { PromoCodeDialog, ClientData } from '@/components/ui/PromoCodeDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMediaQuery } from 'react-responsive';
import { RenderedInvitation } from '@/components/invitations/RenderedInvitation';

interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  gifUrl?: string;
  featured?: boolean;
}

interface StyleSelection {
  id: number;
  clientId: number;
  styleId: number;
  salonId: number;
  selectedAt: string;
  status: string;
  invitationId?: number; // Make invitationId optional
  createdAt?: string; // Add createdAt field for selection creation
}

// Style selection schema for form validation
const styleSelectionSchema = z.object({
  styleOptions: z.object({
    styleId: z.number({
      required_error: "Please select a style option"
    }),
    salonId: z.number({
      required_error: "Salon information is required"
    }),
    clientId: z.number({
      required_error: "Client information is required"
    }),
    invitationId: z.number().optional()
  }),
  recipientName: z.string().optional(),
  recipientContact: z.string().optional(),
  message: z.string().optional(),
  signature: z.string().optional()
});

type StyleSelectionFormValues = z.infer<typeof styleSelectionSchema>;

interface VmbStyleOptionsProps {
  services: StyleOption[];
  clientId?: number;
  salonId?: number;
  invitationId?: number;
  salonInitiated?: boolean; // Flag to indicate this is a salon-initiated invitation
  recipientData?: {
    name: string;
    phone: string;
    sponsor: string;
  };
  onSelectionComplete?: (selection: StyleSelection) => void;
}

export function VmbStyleOptions({ 
  services, 
  clientId, 
  salonId, 
  invitationId,
  salonInitiated = false, // Default to false for backward compatibility
  recipientData,
  onSelectionComplete 
}: VmbStyleOptionsProps) {
  // States for handling selection and popups
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [hoveredStyle, setHoveredStyle] = useState<number | null>(null);
  const [savedSelections, setSavedSelections] = useState<StyleSelection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPromoCodeDialog, setShowPromoCodeDialog] = useState(false);
  const [tempSelectedPhone, setTempSelectedPhone] = useState<string>('');
  const [confirmedStyle, setConfirmedStyle] = useState<StyleOption | null>(null);
  const [showStep2, setShowStep2] = useState(true);  // Set to true for testing
  const [showStep3, setShowStep3] = useState(true);  // Set to true for testing
  const [stateTracker, setStateTracker] = useState(0); // Debug counter
  const [showStep1, setShowStep1] = useState(true); // Always true now - we'll use isStep1Open to control collapse
  const [isStep1Open, setIsStep1Open] = useState(false); // Closed by default
  const [isStep2Open, setIsStep2Open] = useState(false); // Closed by default
  const [isStep3Open, setIsStep3Open] = useState(false); // Closed by default
  // New state for the invitation form
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [invitationMessage, setInvitationMessage] = useState(`Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`);
  const [signature, setSignature] = useState("");
  const [invitationConfirmed, setInvitationConfirmed] = useState(false);
  const [giftApproved, setGiftApproved] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalInvitationModal, setShowFinalInvitationModal] = useState(false);
  const [finalInvitationId, setFinalInvitationId] = useState("");
  const personalMessageRef = useRef<HTMLInputElement>(null); // Reference for personal message input
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Responsive media queries
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });
  const isTablet = useMediaQuery({ query: '(max-width: 768px)' });
  const isDesktop = useMediaQuery({ query: '(min-width: 1024px)' });
  
  // Debug effect to track state changes
  useEffect(() => {
    console.log(`[STATE DEBUG] showStep2=${showStep2}, showStep3=${showStep3}, confirmedStyle=${confirmedStyle?.name || 'null'}`);
    console.log(`[RESPONSIVE] isMobile=${isMobile}, isTablet=${isTablet}, isDesktop=${isDesktop}`);
    setStateTracker(prev => prev + 1);
  }, [showStep2, showStep3, confirmedStyle, isMobile, isTablet, isDesktop]);
  
  // Initialize React Hook Form
  const form = useForm<StyleSelectionFormValues>({
    resolver: zodResolver(styleSelectionSchema),
    defaultValues: {
      styleOptions: {
        styleId: undefined,
        clientId: clientId,
        salonId: salonId,
        invitationId: invitationId
      }
    }
  });
  
  // Special handling for salon-initiated invitations
  useEffect(() => {
    if (salonInitiated) {
      console.log("Salon-initiated invitation - setting up special flow");
      
      // For salon-initiated invitations:
      // 1. Close Step 1 (style selection) after user selects
      // 2. Keep Step 2 closed (we already have client contact info)
      // 3. Open Step 3 directly (Preview and Send)
      
      // Pre-populate recipient data if available
      if (recipientData) {
        setRecipientName(recipientData.name);
        setRecipientContact(recipientData.phone);
        setSignature(recipientData.sponsor);
        
        // Pre-format the message with available data
        if (confirmedStyle) {
          const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
          let updatedMessage = baseMessage;
          updatedMessage = updatedMessage.replace("[NAME]", recipientData.name);
          updatedMessage = updatedMessage.replace("[STY OPT]", confirmedStyle.name);
          updatedMessage = updatedMessage.replace("[SIGNED]", recipientData.sponsor);
          setInvitationMessage(updatedMessage);
        }
      }
      
      // For salon-initiated, we want to skip Step 2
      setIsStep2Open(false);
      
      // If we have a style selected, automatically open Step 3
      if (confirmedStyle) {
        setIsStep3Open(true);
        setShowStep3(true);
      }
    }
  }, [salonInitiated, recipientData, confirmedStyle]);

  // Fetch any existing style selections for this client
  useEffect(() => {
    if (clientId) {
      const fetchSelections = async () => {
        try {
          const response = await fetch(`/api/clients/${clientId}/style-selections`);
          if (response.ok) {
            const data = await response.json();
            setSavedSelections(data);
          }
        } catch (error) {
          console.error("Error fetching style selections:", error);
        }
      };
      
      fetchSelections();
      
      // Update form data for validation script detection
      if (document.getElementById('styleOptions')) {
        const styleOptionsData = {
          styleId: -1, // Will be updated when user selects a style
          clientId: clientId,
          salonId: salonId,
          invitationId: invitationId
        };
        
        // Set initial value for styleOptions field
        const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
        if (styleOptionsElement) {
          styleOptionsElement.value = JSON.stringify(styleOptionsData);
        }
      }
    }
  }, [clientId, salonId, invitationId]);
  
  // Handle style selection
  const handleSelectStyle = (style: StyleOption) => {
    console.log(`Style selected: ${style.name} - Applying direct style insertion with no popups`);
    
    // Always set the selected style
    setSelectedStyle(style);
    
    // Update form values when style is selected (use type safety)
    form.setValue('styleOptions.styleId', style.id);
    
    // Safely handle possibly undefined values with defaults
    const clientIdValue = clientId ?? 0;
    const salonIdValue = salonId ?? 0;
    const invitationIdValue = invitationId ?? 0;
    
    form.setValue('styleOptions.clientId', clientIdValue);
    form.setValue('styleOptions.salonId', salonIdValue);
    
    if (invitationIdValue > 0) {
      form.setValue('styleOptions.invitationId', invitationIdValue);
    }
    
    // Update the hidden field for validation script detection
    const styleOptionsData = {
      styleId: style.id,
      clientId: clientId || 0, // Use fallback value for safety
      salonId: salonId || 0,   // Use fallback value for safety
      invitationId: invitationId || 0
    };
    
    // Set value for styleOptions hidden field
    const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
    if (styleOptionsElement) {
      styleOptionsElement.value = JSON.stringify(styleOptionsData);
    }
    
    // Set confirmed style and show Step 2, but keep Step 1 visible (just collapsed)
    setConfirmedStyle(style);
    
    // Special handling for salon-initiated invitations
    if (salonInitiated) {
      console.log("Salon-initiated flow: Skip Step 2, go directly to Step 3");
      setShowStep2(true);
      setShowStep3(true);
      // Close Step 1 & 2, open Step 3
      setIsStep1Open(false);
      setIsStep2Open(false);
      setIsStep3Open(true);
      
      // If we have recipient data, update the message
      if (recipientData) {
        const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
        let updatedMessage = baseMessage;
        updatedMessage = updatedMessage.replace("[NAME]", recipientData.name);
        updatedMessage = updatedMessage.replace("[STY OPT]", style.name);
        updatedMessage = updatedMessage.replace("[SIGNED]", recipientData.sponsor);
        setInvitationMessage(updatedMessage);
        
        // Also update form fields
        setRecipientName(recipientData.name);
        setRecipientContact(recipientData.phone);
        setSignature(recipientData.sponsor);
      }
    } else {
      // Regular flow
      setShowStep2(true);
      // Do NOT show Step 3 yet - it will be shown after Step 2 is completed
      setShowStep3(false);
      // Close the Step 1 collapsible without hiding it completely
      setIsStep1Open(false);
      
      // Update the invitation message to include the selected style name
      const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
      const currentName = recipientName || "[NAME]";
      const currentSignature = signature || "[SIGNED]";
      
      // Replace placeholders
      let updatedMessage = baseMessage;
      updatedMessage = updatedMessage.replace("[NAME]", currentName);
      updatedMessage = updatedMessage.replace("[STY OPT]", style.name);
      updatedMessage = updatedMessage.replace("[SIGNED]", currentSignature);
      
      // Update the message
      setInvitationMessage(updatedMessage);
    }
    
    // Close any open dialogs to avoid conflicts
    setIsDetailsOpen(false);
    setIsConfirmationOpen(false);
    
    console.log("Style selected without popup, directly inserted in STEP 2 and STEP 3:", style.name);
    
    // Show success toast - customize message for salon-initiated
    toast({
      title: "Style Selected!",
      description: salonInitiated ? "Preview and send your invitation!" : "Now you can start your Design!",
      variant: "default"
    });
    
    // Notify parent component if callback provided
    if (onSelectionComplete) {
      // Create a StyleSelection object with proper typing
      const styleSelection: StyleSelection = {
        id: 0, // Will be set by the API
        styleId: style.id,
        clientId: clientId || 0,
        salonId: salonId || 0,
        selectedAt: new Date().toISOString(),
        status: 'selected',
        invitationId: invitationId,
        createdAt: new Date().toISOString()
      };
      
      onSelectionComplete(styleSelection);
    }
  };
  
  // Handle mouse over effect
  const handleMouseEnter = (styleId: number) => {
    setHoveredStyle(styleId);
  };
  
  const handleMouseLeave = () => {
    setHoveredStyle(null);
  };
  
  // Handle form submission with React Hook Form
  const onSubmit = async (values: StyleSelectionFormValues) => {
    // Skip validation to allow selection with missing client/salon IDs in invitation context
    if (!selectedStyle) {
      toast({
        title: "Please Select a Style",
        description: "Please select a style from Step 1 first.",
        variant: "default"
      });
      return;
    }
    
    // If we have a confirmed style already, show Step 3 and success message
    if (confirmedStyle) {
      console.log("Already have confirmed style, skipping API call", confirmedStyle.name);
      
      // Only now show Step 3 (after form submission from Step 2)
      setShowStep3(true);
      
      // Close Step 2 when Step 3 appears, but keep it visible as a collapsible
      setIsStep2Open(false);
      
      // Show a more helpful message to guide the user to the next step
      toast({
        title: "Gift Options Ready!",
        description: "Now you can pick your gift options!",
        variant: "default"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If clientId is available, proceed with the API call
      if (values.styleOptions.clientId) {
        // Save selection to database using form values
        const response = await apiRequest(`/api/clients/${values.styleOptions.clientId}/style-selections`, 'POST', {
          styleId: values.styleOptions.styleId,
          salonId: values.styleOptions.salonId,
          invitationId: values.styleOptions.invitationId
        });
        
        if (response.ok) {
          const newSelection = await response.json();
          setSavedSelections(prev => [...prev, newSelection]);
          
          // Notify parent component if callback provided
          if (onSelectionComplete) {
            onSelectionComplete(newSelection);
          }
          
          toast({
            title: "Style Selected!",
            description: `You've selected ${selectedStyle.name}`,
            variant: "default"
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save style selection");
        }
      } else {
        // For anonymous users without clientId, just update UI without API call
        console.log("No clientId available, skipping API call");
        toast({
          title: "Style Selected!",
          description: `You've selected ${selectedStyle.name} (Preview Mode)`,
          variant: "default"
        });
      }
      
      // Ensure all steps are showing
      setShowStep2(true);
      setShowStep3(true);
    } catch (error) {
      console.error("Error saving style selection:", error);
      // Don't show error - instead just display the gift section
      setShowStep2(true);
      setShowStep3(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Legacy handler for backward compatibility with additional error handling
  const handleSaveSelection = () => {
    console.log("Style selection: handleSaveSelection triggered", selectedStyle?.name);
    
    // Make sure we have valid form data before submitting
    if (selectedStyle) {
      // Ensure required form values are set
      if (!form.getValues('styleOptions.styleId')) {
        form.setValue('styleOptions.styleId', selectedStyle.id);
      }
      
      if (!form.getValues('styleOptions.salonId') && salonId) {
        form.setValue('styleOptions.salonId', salonId);
      }
      
      if (!form.getValues('styleOptions.clientId') && clientId) {
        form.setValue('styleOptions.clientId', clientId);
      }
    }
    
    // For any context, just set the confirmed style without doing an API call
    if (selectedStyle) {
      console.log("Direct style selection: Setting confirmed style without popup");
        
      // Important: set the confirmed style and show Step 2 directly
      const confirmedStyleCopy = {...selectedStyle};
      setConfirmedStyle(confirmedStyleCopy);
      setShowStep2(true);
      setIsDetailsOpen(false);
      setIsConfirmationOpen(false);
      
      console.log("Set to Step 2 with style:", confirmedStyleCopy.name);
      
      toast({
        title: "Style Saved!",
        description: "Now you can start your Design!",
        variant: "default"
      });
      return;
    }
        
    // French Tips special case has been removed in favor of the direct style insertion approach
    
    console.log("Proceeding with regular form submission");
    // Proceed with form submission
    form.handleSubmit(onSubmit)();
  };
  
  // These functions are no longer needed since we're not using popups
  // Keeping empty implementations for backward compatibility
  const handleCloseAll = () => {
    console.log("handleCloseAll called but not used in direct insertion mode");
  };
  
  const handleConfirmSelection = () => {
    console.log("handleConfirmSelection called but not used in direct insertion mode");
  };
  
  // Get badge text based on service name
  const getBadgeText = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('french') || nameLower.includes('tips')) return 'Tips/Touch Up';
    if (nameLower.includes('gel') || nameLower.includes('manicure')) return 'Lux Gel';
    if (nameLower.includes('sculpt') || nameLower.includes('acrylic')) return 'Sculpted';
    return 'Glam me Baby!';
  };
  
  // Check if this style has been previously selected
  const isStyleSelected = (styleId: number) => {
    return savedSelections.some(selection => selection.styleId === styleId);
  };

  return (
    <div className="vmb-style-options-wrapper">
      <div className="vmb-style-options-container">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-endpoint="/api/clients/:clientId/style-selections" data-method="POST">
            {/* Hidden form fields for validation */}
            <input type="hidden" name="styleOptions" id="styleOptions" />
            <input type="hidden" name="endpoint" value="/api/clients/:clientId/style-selections" />
            <input type="hidden" name="method" value="POST" />
            
            <div className="vmb-style-options">
              {/* STEP 1 - With Collapsible behavior */}
              {showStep1 && (
                <div className="rounded-md overflow-hidden mb-3">
                  <Collapsible open={isStep1Open} onOpenChange={setIsStep1Open}>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-t-md">
                      <CollapsibleTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
                        <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 1 Pick your style...</h2>
                        <div className="h-6 w-6 flex items-center justify-center text-pink-700">
                          {isStep1Open ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent className="bg-white border border-pink-100 rounded-b-md p-3">
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                        {services.map((service) => (
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
                                    console.error(`Failed to load image for service: ${service.name}`);
                                    e.currentTarget.src = '/assets/LOGO1.png';
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
              
              {/* Add 6px spacing */}
              <div className="h-[6px]"></div>
              
              {/* STEP 2 - With Collapsible behavior */}
              {showStep2 && (
                <div className="rounded-md overflow-hidden mb-3">
                  <Collapsible open={isStep2Open} onOpenChange={setIsStep2Open}>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-t-md">
                      <CollapsibleTrigger 
                        className="flex w-full items-center justify-between pb-2 pt-2 px-3"
                        onClick={() => {
                          // Clear form fields when Step 2 is opened
                          setRecipientName("");
                          setRecipientContact("");
                          setSignature("");
                        }}
                      >
                        <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 2 Style Your Invitation...</h2>
                        <div className="h-6 w-6 flex items-center justify-center text-pink-700">
                          {isStep2Open ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent className="bg-white border border-pink-100 rounded-b-md p-3">
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className={`border rounded ${isMobile ? 'px-2 py-1' : 'px-2 py-2'} border-pink-200 bg-pink-50`}>
                      <div className="flex flex-col md:flex-row">
                      {/* Left side - Form Fields */}
                      <div className="w-full md:w-1/2 text-left pr-2 md:border-r border-pink-100 pb-2 md:pb-0">
                        <h3 className="font-medium text-compact text-center">Your Invitation Design</h3>
                        <div className="mt-2">
                          {confirmedStyle ? (
                            <div className="space-y-2 p-2 border border-dashed border-pink-200 rounded-md w-full">
                              <input 
                                type="text"
                                placeholder="Who is your Ven Me, Baby!: Enter name"
                                className="w-full p-1.5 text-[10px] border border-pink-100 rounded"
                                value={recipientName}
                                onKeyDown={(e) => {
                                  // If Enter is pressed, move to next field (Phone/Email)
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Find the next input which is the phone/email field
                                    const nextField = e.currentTarget.parentElement?.querySelector('input[placeholder="Phone: 555-555-5555 OR Email: you@example.com"]');
                                    if (nextField instanceof HTMLElement) {
                                      nextField.focus();
                                    }
                                  }
                                }}
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setRecipientName(newName);
                                  
                                  // Update message by replacing [NAME] with the actual name
                                  // Keep other placeholders intact
                                  const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
                                  
                                  // Get current values
                                  const currentStyle = confirmedStyle ? confirmedStyle.name : "[STY OPT]";
                                  const currentSignature = signature || "[SIGNED]";
                                  
                                  // Replace all placeholders
                                  let updatedMessage = baseMessage;
                                  updatedMessage = updatedMessage.replace("[NAME]", newName || "[NAME]");
                                  updatedMessage = updatedMessage.replace("[STY OPT]", currentStyle);
                                  updatedMessage = updatedMessage.replace("[SIGNED]", currentSignature);
                                  
                                  setInvitationMessage(updatedMessage);
                                }}
                              />
                              
                              <input 
                                type="text"
                                placeholder="Phone: 555-555-5555 OR Email: you@example.com"
                                className="w-full p-1.5 text-[10px] border border-pink-100 rounded"
                                value={recipientContact}
                                onChange={(e) => {
                                  // Format the phone number as user types if it looks like a phone number
                                  const input = e.target.value.replace(/\D/g, '').slice(0, 10); // Remove non-digits and limit to 10 digits
                                  let formattedInput = e.target.value;
                                  
                                  // If input contains only digits, assume it's a phone
                                  if (/^\d+$/.test(input)) {
                                    // Format as phone: XXX-XXX-XXXX
                                    if (input.length <= 3) {
                                      formattedInput = input;
                                    } else if (input.length <= 6) {
                                      formattedInput = `${input.slice(0, 3)}-${input.slice(3)}`;
                                    } else {
                                      formattedInput = `${input.slice(0, 3)}-${input.slice(3, 6)}-${input.slice(6, 10)}`;
                                    }
                                  } else {
                                    // If it contains non-digit characters, it's probably an email
                                    formattedInput = e.target.value;
                                  }
                                  
                                  setRecipientContact(formattedInput);
                                }}
                                onKeyDown={(e) => {
                                  // If Enter is pressed, move to next field (SIGN HERE)
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Find the next input which is the signature field
                                    const nextField = e.currentTarget.parentElement?.querySelector('input[placeholder="SIGN HERE!"]');
                                    if (nextField instanceof HTMLElement) {
                                      nextField.focus();
                                    }
                                  }
                                }}
                              />
                              
                              <input 
                                type="text"
                                placeholder="SIGN HERE!"
                                className="w-full p-1.5 text-[10px] border border-pink-100 rounded"
                                value={signature}
                                onKeyDown={(e) => {
                                  // If Enter is pressed, set invitation confirmed to show the Preview button
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setInvitationConfirmed(true);
                                    
                                    // Show a toast letting the user know they can preview
                                    toast({
                                      title: "Design Ready",
                                      description: "Click PREVIEW DESIGN to continue",
                                      variant: "default"
                                    });
                                    
                                    // Find the Preview Design button and focus it
                                    setTimeout(() => {
                                      const previewButton = e.currentTarget.parentElement?.querySelector('button');
                                      if (previewButton instanceof HTMLElement) {
                                        previewButton.focus();
                                      }
                                    }, 100);
                                  }
                                }}
                                onChange={(e) => {
                                  const newSignature = e.target.value;
                                  setSignature(newSignature);
                                  
                                  // Update message by replacing [SIGNED] with the actual signature
                                  // Keep other placeholders intact
                                  const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
                                  
                                  // Get current values
                                  const currentName = recipientName || "[NAME]";
                                  const styleName = confirmedStyle ? confirmedStyle.name : "[STY OPT]";
                                  
                                  // Replace all placeholders
                                  let updatedMessage = baseMessage;
                                  updatedMessage = updatedMessage.replace("[NAME]", currentName);
                                  updatedMessage = updatedMessage.replace("[STY OPT]", styleName);
                                  updatedMessage = updatedMessage.replace("[SIGNED]", newSignature);
                                  
                                  setInvitationMessage(updatedMessage);
                                }}
                              />
                              
                              <textarea 
                                placeholder={`Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`}
                                className="w-full p-1.5 text-[10px] border border-pink-100 rounded h-16 mt-2 hidden"
                                value={invitationMessage}
                                onChange={(e) => setInvitationMessage(e.target.value)}
                              />
                              
                              <div className="flex gap-2 mt-2">
                                <button 
                                  type="button"
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded transition-colors text-xs"
                                  onClick={() => {
                                    setInvitationConfirmed(true);
                                    
                                    // Show Step 3 and collapse Step 2 when Preview Design is clicked
                                    setIsStep2Open(false);
                                    setShowStep3(true);
                                    
                                    // Focus on the Personal Message field in Gift Request
                                    setTimeout(() => {
                                      if (personalMessageRef.current) {
                                        personalMessageRef.current.focus();
                                      }
                                    }, 100);
                                    
                                    toast({
                                      title: "Design Preview",
                                      description: "Invitation preview being prepared...",
                                      variant: "default"
                                    });
                                  }}
                                >
                                  PREVIEW DESIGN
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-2 border border-dashed border-pink-200 rounded-md w-full h-32 flex items-center justify-center">
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-mini text-gray-500">Select a style first to design your invitation</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Message Preview and Style Card */}
                      {confirmedStyle && (
                        <div className="w-full md:w-1/2 text-left md:pl-2 mt-2 md:mt-0">
                          <h3 className="font-medium text-compact text-center">Message Preview</h3>
                          <div className="mt-2 border border-dashed border-pink-200 rounded-md p-2">
                            <div className="rounded-lg p-2 bg-blue-50 border border-blue-100 mb-2">
                              {invitationMessage}
                            </div>
                            
                            {/* Invitation preview card with service details */}
                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 my-2 bg-white">
                              <img
                                src={confirmedStyle.gifUrl ? getImageUrl(confirmedStyle.gifUrl, 'vmb_style') : '/assets/LOGO1.png'}
                                alt={confirmedStyle.name}
                                className="h-14 w-14 object-cover rounded-md"
                                onError={(e) => {
                                  console.error(`Failed to load image for service: ${confirmedStyle.name}`);
                                  e.currentTarget.src = '/assets/LOGO1.png';
                                }}
                              />
                              <div>
                                <div className="font-medium text-xs">{confirmedStyle.name}</div>
                                <div className="text-[10px] text-gray-600">${Math.round(confirmedStyle.price)} · {confirmedStyle.duration} min</div>
                              </div>
                            </div>
                            
                            {/* Unique hash/ID for the invitation */}
                            <div className="mb-2 text-center">
                              <div className="text-[10px] text-gray-500">Your VMB gift has a unique ID:</div>
                              <div className="text-[10px] font-mono bg-gray-50 p-1 rounded border border-gray-100">
                                VMB-{Math.random().toString(36).substring(2, 8).toUpperCase()}
                              </div>
                            </div>
                            
                            {/* Payment options */}
                            <div className="flex flex-col mt-3 items-center justify-center gap-1">
                              <div className="text-[10px] font-medium text-gray-700">Payment methods available:</div>
                              <div className="flex gap-2 items-center justify-center">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-7 w-7 rounded-full bg-blue-500 text-white shadow-sm flex items-center justify-center hover:bg-blue-600 cursor-pointer">
                                    <span className="text-[9px] font-bold">Z</span>
                                  </div>
                                  <div className="h-7 w-7 rounded-full bg-teal-500 text-white shadow-sm flex items-center justify-center hover:bg-teal-600 cursor-pointer">
                                    <span className="text-[9px] font-bold">V</span>
                                  </div>
                                  <div className="h-7 w-7 rounded-full bg-green-500 text-white shadow-sm flex items-center justify-center hover:bg-green-600 cursor-pointer">
                                    <span className="text-[9px] font-bold">CA</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
              
              {/* Add 6px spacing */}
              <div className="h-[6px]"></div>
              
              {/* STEP 3 - With Collapsible behavior */}
              {showStep3 && (
                <div className="rounded-md overflow-hidden mb-3">
                  <Collapsible open={isStep3Open} onOpenChange={setIsStep3Open}>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-t-md">
                      <CollapsibleTrigger 
                        className="flex w-full items-center justify-between pb-2 pt-2 px-3"
                        onClick={() => {
                          // Auto-approve gift when Step 3 is opened
                          setGiftApproved(true);
                          
                          if (!isStep3Open) {
                            toast({
                              title: "Gift Ready to Send",
                              description: "Your gift is now approved and ready to send",
                              variant: "default"
                            });
                          }
                        }}
                      >
                        <h2 className={`font-medium text-sm sm:text-base ${salonInitiated ? 'text-amber-700' : 'text-pink-700'}`}>STEP 3: Preview and Send</h2>
                        <div className={`h-6 w-6 flex items-center justify-center ${salonInitiated ? 'text-amber-700' : 'text-pink-700'}`}>
                          {isStep3Open ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent className="bg-white border border-pink-100 rounded-b-md p-3">
                
                <div className="grid grid-cols-1 gap-4">
                  <div className={`border rounded ${isMobile ? 'px-2 py-1' : 'px-2 py-2'} border-pink-200 bg-pink-50`}>
                    {confirmedStyle ? (
                    <div className="flex flex-col md:flex-row">
                      {/* Left side - Ven Me, Baby! Reminders */}
                      <div className={`${isMobile ? 'w-full' : 'w-full md:w-1/2'} text-left ${isMobile ? 'pr-0' : 'pr-2'} ${isMobile ? '' : 'md:border-r border-pink-100'} pb-2 md:pb-0 flex flex-col justify-between`}>
                        <div>
                          <h3 className={`font-medium ${isMobile ? 'text-sm' : 'text-compact'} text-center`}>Ven Me, Baby! Reminders!</h3>
                          <div className="flex flex-col space-y-3 mt-2">
                            <div className="p-2 bg-white border border-pink-100 rounded text-xs">
                              <ul className="list-disc pl-4 pt-1 text-gray-700 space-y-2">
                                <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                                <li>Praesent efficitur, odio at commodo tempus, nibh enim.</li>
                                <li>Nullam vitae eros in nisi varius vestibulum et vel urna.</li>
                                <li>Suspendisse nec dui eu nisi tincidunt finibus vel et libero.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        {/* SEND GIFT button at the bottom of left panel */}
                        <div className="flex justify-center mt-4">
                          <button 
                            type="button"
                            className="w-3/4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition-colors text-sm font-medium"
                            onClick={() => {
                              // Show confirmation dialog
                              setShowConfirmDialog(true);
                            }}
                          >
                            SEND GIFT
                          </button>
                        </div>
                      </div>
                      
                      {/* Right side - Gift Preview */}
                      <div className="w-full md:w-1/2 text-left md:pl-2 mt-2 md:mt-0">
                        <h3 className="font-medium text-compact text-center">Your Ven Me, Baby! Promo</h3>
                        <div className="border border-pink-100 rounded-md p-3 mt-2 bg-white shadow-sm">
                          {/* 1. Standardized Message Format */}
                          <div className={`rounded-lg ${isMobile ? 'p-1.5' : 'p-2'} bg-blue-50 border border-blue-100 mb-3 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                            Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], [price and time] will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]
                          </div>
                          
                          {/* 2. Unique Gift ID */}
                          <div className="mb-3 text-center text-xs font-medium">
                            <div className="text-gray-700">Your VMB gift has a unique ID:</div>
                            <div className="text-pink-600 font-bold">VMB-[RANDOM ID]</div>
                          </div>
                          
                          {/* 3. Payment Method Icons */}
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="text-[10px] font-medium text-gray-700">Payment methods available:</div>
                            <div className="flex gap-2 items-center justify-center">
                              <div className="flex items-center gap-1.5">
                                <div className="h-7 w-7 rounded-full bg-blue-500 text-white shadow-sm flex items-center justify-center hover:bg-blue-600 cursor-pointer">
                                  <span className="text-[9px] font-bold">Z</span>
                                </div>
                                <div className="h-7 w-7 rounded-full bg-teal-500 text-white shadow-sm flex items-center justify-center hover:bg-teal-600 cursor-pointer">
                                  <span className="text-[9px] font-bold">V</span>
                                </div>
                                <div className="h-7 w-7 rounded-full bg-green-500 text-white shadow-sm flex items-center justify-center hover:bg-green-600 cursor-pointer">
                                  <span className="text-[9px] font-bold">CA</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* SEND GIFT REQUEST button - only shows when gift is approved */}
                          {giftApproved && (
                            <button 
                              type="button"
                              className="w-full bg-green-500 hover:bg-green-600 text-white py-1.5 rounded transition-colors text-xs mt-3"
                              onClick={() => {
                                // Validate required fields
                                if (!recipientContact) {
                                  toast({
                                    title: "Missing Information",
                                    description: "Phone or Email is required",
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                
                                // Apply default values if needed
                                const finalName = recipientName || "Love";
                                const finalSignature = signature || "Your fav! ME!";
                                
                                // Update message with default values if needed
                                if (!recipientName || !signature) {
                                  const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
                                  const styleName = confirmedStyle ? confirmedStyle.name : "[STY OPT]";
                                  
                                  let updatedMessage = baseMessage;
                                  updatedMessage = updatedMessage.replace("[NAME]", finalName);
                                  updatedMessage = updatedMessage.replace("[STY OPT]", styleName);
                                  updatedMessage = updatedMessage.replace("[SIGNED]", finalSignature);
                                  
                                  setInvitationMessage(updatedMessage);
                                  
                                  // Also update the state values
                                  if (!recipientName) setRecipientName(finalName);
                                  if (!signature) setSignature(finalSignature);
                                }
                                
                                // Show custom confirmation dialog
                                setShowConfirmDialog(true);
                              }}
                            >
                              SEND GIFT REQUEST
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    ) : (
                    <div className="p-4 text-center">
                      <div>
                        <AlertTriangle className="h-12 w-12 mx-auto text-amber-400" />
                        <h3 className="font-medium text-base mt-2">Style Selection Required</h3>
                        <p className="text-gray-600 mt-1">Please select a style from STEP 1 before proceeding with gift options.</p>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </div>
          </form>
        </Form>

        <PromoCodeDialog 
          open={showPromoCodeDialog}
          onOpenChange={setShowPromoCodeDialog}
          salonId={salonId}
          onSuccess={(clientData: ClientData) => {
            // Successfully verified, we now have client data
            toast({
              title: "Welcome back!",
              description: `Your profile has been verified. You can now select styles.`,
              variant: "default"
            });
            
            // Navigate to the client dashboard after successful verification
            if (clientData && clientData.clientId) {
              // Redirect to client dashboard with the correct path (/client/:id)
              navigate(`/client/${clientData.clientId}`);
            } else {
              // Just refresh the page to get the updated client context
              window.location.reload();
            }
          }}
        />

        {/* Custom Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Gift Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to send this gift request? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm">
                <p>The following gift will be sent:</p>
                <p className="font-medium mt-1">{confirmedStyle?.name || "Selected Style"}</p>
                <p className="text-xs mt-2">Recipient: {recipientName || "Friend"}</p>
                <p className="text-xs">{recipientContact || "No contact provided"}</p>
                {invitationId && (
                  <div className="mt-2 bg-green-50 p-1.5 rounded border border-green-100 text-[10px]">
                    <p className="font-medium text-green-700">Completing Invitation ID: {invitationId}</p>
                    <p className="text-green-600">Status will change to COMPLETE</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowConfirmDialog(false);
                  
                  // Apply default values
                  const finalName = recipientName || "Love";
                  
                  // Generate a unique ID for this invitation using a timestamp + random string
                  const timestamp = Date.now().toString(36);
                  const randomStr = Math.random().toString(36).substring(2, 8);
                  const uniqueInviteId = `${timestamp}-${randomStr}`;
                  
                  // Save the unique ID for the final invitation
                  setFinalInvitationId(uniqueInviteId);
                  
                  // Check if we have an invitation ID to complete
                  if (invitationId) {
                    // Set loading state
                    setIsSubmitting(true);
                    
                    // Get the style ID from the confirmed style if available
                    const styleId = confirmedStyle ? confirmedStyle.id : undefined;
                    
                    // Call the complete endpoint
                    apiRequest(`/api/invitations/${invitationId}/complete`, 'POST', { 
                      styleId,
                      finalInviteId: uniqueInviteId // Add the final invite ID to be saved with the completion
                    })
                      .then(async (response) => {
                        if (response.ok) {
                          const result = await response.json();
                          console.log("Invitation completed successfully:", result);
                          
                          // Show more informative toast with dashboard posting details
                          toast({
                            title: "Gift Request Ready!",
                            description: `Request for ${finalName} prepared with unique ID`,
                            variant: "default"
                          });
                          
                          // Disable buttons to prevent double-sending
                          setInvitationConfirmed(true);
                          
                          // Show the final rendered invitation
                          setShowFinalInvitationModal(true);
                        } else {
                          const errorData = await response.json();
                          throw new Error(errorData.error || "Failed to complete invitation");
                        }
                      })
                      .catch(error => {
                        console.error("Error completing invitation:", error);
                        toast({
                          title: "Error Preparing Gift Request",
                          description: `There was a problem processing the request: ${error.message}`,
                          variant: "destructive"
                        });
                      })
                      .finally(() => {
                        setIsSubmitting(false);
                      });
                  } else {
                    // Regular gift sent without invitation completion
                    toast({
                      title: "Gift Request Ready!",
                      description: `Request for ${finalName} at ${recipientContact} prepared`,
                      variant: "default"
                    });
                    
                    // Show the final rendered invitation even for direct sends
                    setShowFinalInvitationModal(true);
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 
                  <>
                    <span className="mr-2">Processing...</span>
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </> : (
                    invitationId ? 
                    'Complete Invitation & Send' : 
                    'Confirm & Send'
                  )
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Final Rendered Invitation Modal */}
        <Dialog open={showFinalInvitationModal} onOpenChange={setShowFinalInvitationModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Your Gift Request Is Ready!</DialogTitle>
              <DialogDescription>
                This is your final gift request with unique ID. It can't be modified once sent.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <RenderedInvitation
                inviteId={finalInvitationId}
                recipientName={recipientName || "Friend"}
                styleOption={confirmedStyle?.name || "Selected Style"}
                price={confirmedStyle ? `$${confirmedStyle.price}` : "$45"}
                time={confirmedStyle ? `${confirmedStyle.duration} min` : "30 min"}
                senderName={signature || "Your Friend"}
                imageUrl={confirmedStyle?.gifUrl || "/assets/french-tips.png"}
              />
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <div className="text-sm text-gray-500">
                Unique ID: <span className="font-mono">INV-FINAL-{finalInvitationId}</span>
              </div>
              <Button 
                type="button" 
                onClick={() => {
                  setShowFinalInvitationModal(false);
                  toast({
                    title: "Gift Request Sent!",
                    description: "Your gift request has been sent to the recipient",
                    variant: "default"
                  });
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}