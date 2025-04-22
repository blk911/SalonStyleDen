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
  onSelectionComplete?: (selection: StyleSelection) => void;
}

export function VmbStyleOptions({ 
  services, 
  clientId, 
  salonId, 
  invitationId,
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
  const [showStep2, setShowStep2] = useState(false);
  const [showStep3, setShowStep3] = useState(false);
  const [stateTracker, setStateTracker] = useState(0); // Debug counter
  const [showStep1, setShowStep1] = useState(true); // Always true now - we'll use isStep1Open to control collapse
  const [isStep1Open, setIsStep1Open] = useState(true); // Control Step 1 collapsible state
  const [isStep2Open, setIsStep2Open] = useState(true); // Control Step 2 collapsible state
  const [isStep3Open, setIsStep3Open] = useState(true); // Control Step 3 collapsible state
  // New state for the invitation form
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [invitationMessage, setInvitationMessage] = useState(`Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`);
  const [signature, setSignature] = useState("");
  const [invitationConfirmed, setInvitationConfirmed] = useState(false);
  const personalMessageRef = useRef<HTMLInputElement>(null); // Reference for personal message input
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Debug effect to track state changes
  useEffect(() => {
    console.log(`[STATE DEBUG] showStep2=${showStep2}, showStep3=${showStep3}, confirmedStyle=${confirmedStyle?.name || 'null'}`);
    setStateTracker(prev => prev + 1);
  }, [showStep2, showStep3, confirmedStyle]);
  
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
    setShowStep2(true);
    // Do NOT show Step 3 yet - it will be shown after Step 2 is completed
    setShowStep3(false);
    // Close the Step 1 collapsible without hiding it completely
    setIsStep1Open(false);
    
    // Close any open dialogs to avoid conflicts
    setIsDetailsOpen(false);
    setIsConfirmationOpen(false);
    
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
    
    console.log("Style selected without popup, directly inserted in STEP 2 and STEP 3:", style.name);
    
    // Show success toast
    toast({
      title: "Style Selected!",
      description: "Now you can start your Design!",
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => (
                          <div 
                            key={service.id} 
                            className={`border rounded px-2 py-2 ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'} cursor-pointer hover:border-pink-400 transition-colors duration-200`}
                            onClick={() => handleSelectStyle(service)}
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
                      <CollapsibleTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
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
                    <div className="border rounded px-2 py-2 border-pink-200 bg-pink-50">
                      <div className="flex flex-col md:flex-row">
                      {/* Left side - blank placeholder for now */}
                      <div className="w-full md:w-1/2 text-left pr-2 md:border-r border-pink-100 pb-2 md:pb-0">
                        <h3 className="font-medium text-compact text-center">Your Invitation Design</h3>
                        <div className="flex flex-col mt-2">
                          {confirmedStyle && (
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
                                  
                                  // Update current message - replace [NAME] but keep other placeholders intact
                                  const baseMessage = `Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`;
                                  
                                  // Get style name if available
                                  const styleName = confirmedStyle ? confirmedStyle.name : "[STY OPT]";
                                  
                                  // Get signature if available
                                  const currentSignature = signature || "[SIGNED]";
                                  
                                  // Replace all placeholders
                                  let updatedMessage = baseMessage;
                                  updatedMessage = updatedMessage.replace("[NAME]", newName || "[NAME]");
                                  updatedMessage = updatedMessage.replace("[STY OPT]", styleName);
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
                                  const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                  let formattedInput = e.target.value;
                                  
                                  // If input contains only digits and is 10 or fewer digits, assume it's a phone
                                  if (/^\d+$/.test(input) && input.length <= 10) {
                                    // Format as phone: XXX-XXX-XXXX
                                    if (input.length <= 3) {
                                      formattedInput = input;
                                    } else if (input.length <= 6) {
                                      formattedInput = `${input.slice(0, 3)}-${input.slice(3)}`;
                                    } else {
                                      formattedInput = `${input.slice(0, 3)}-${input.slice(3, 6)}-${input.slice(6, 10)}`;
                                    }
                                  }
                                  // Otherwise treat as email (no special formatting)
                                  
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
                                  // If Enter is pressed, move to next field (message textarea)
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Find the next input which is the textarea
                                    const nextField = e.currentTarget.parentElement?.querySelector('textarea');
                                    if (nextField instanceof HTMLElement) {
                                      nextField.focus();
                                    }
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
                                  updatedMessage = updatedMessage.replace("[SIGNED]", newSignature || "[SIGNED]");
                                  
                                  setInvitationMessage(updatedMessage);
                                }}
                              />
                              
                              <textarea 
                                placeholder={`Hi [NAME], I would love a fresh set. My stylist has an opening for a [STY OPT], will you Ven Me, Baby! ❤️❤️❤️ [SIGNED]`}
                                className="w-full p-1.5 text-[10px] border border-pink-100 rounded h-16"
                                value={invitationMessage}
                                onChange={(e) => setInvitationMessage(e.target.value)}
                              />
                              
                              <button 
                                type="button"
                                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-1.5 rounded transition-colors text-xs"
                                onClick={() => {
                                  setInvitationConfirmed(true);
                                  toast({
                                    title: "Invitation Confirmed",
                                    description: `Invitation sent to ${recipientName}`,
                                    variant: "default"
                                  });
                                }}
                              >
                                CONFIRM
                              </button>
                              
                              {invitationConfirmed && (
                                <div className="mt-2">
                                  <button 
                                    type="button"
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded transition-colors text-xs"
                                    onClick={() => {
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
                                    Preview Design
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {!confirmedStyle && (
                            <div className="text-center p-2 border border-dashed border-pink-200 rounded-md w-full h-32 flex items-center justify-center">
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-mini text-gray-500">Select a style first to design your invitation</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Selected style */}
                      <div className="w-full md:w-1/2 text-left md:pl-2 mt-2 md:mt-0">
                        <h3 className="font-medium text-compact text-center">Selected Style</h3>
                        <div className="mt-2">
                          {confirmedStyle ? (
                            <div className="border rounded px-2 py-2 border-pink-200 bg-pink-50">
                              <div className="flex">
                                <div className="w-2/3 text-left pr-2">
                                  <h3 className="font-medium text-compact">{confirmedStyle.name}</h3>
                                  <p className="text-micro text-gray-600">{confirmedStyle.description}</p>
                                  
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="font-bold text-compact">${Math.round(confirmedStyle.price)}</span>
                                    <span className="text-micro">{confirmedStyle.duration} min</span>
                                  </div>
                                </div>
                                
                                <div className="w-1/3 flex items-center justify-end pl-2">
                                  <img 
                                    src={confirmedStyle.gifUrl ? getImageUrl(confirmedStyle.gifUrl, 'vmb_style') : '/assets/LOGO1.png'}
                                    alt={confirmedStyle.name}
                                    className="h-20 w-20 object-cover rounded-md"
                                    onError={(e) => {
                                      console.error(`Failed to load image for service: ${confirmedStyle.name}`);
                                      e.currentTarget.src = '/assets/LOGO1.png';
                                    }}
                                  />
                                </div>
                              </div>
                              
                            </div>
                          ) : (
                            <div className="text-center p-2 border border-dashed border-pink-200 rounded-md w-full h-32 flex items-center justify-center">
                              <p className="text-mini text-gray-500">No style selected yet</p>
                            </div>
                          )}
                        </div>
                      </div>
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
                      <CollapsibleTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
                        <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 3 Pick your gift options...</h2>
                        <div className="h-6 w-6 flex items-center justify-center text-pink-700">
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
                  <div className="border rounded px-2 py-2 border-pink-200 bg-pink-50">
                    {confirmedStyle ? (
                    <div className="flex flex-col md:flex-row">
                      {/* Left side - Gift Request Form */}
                      <div className="w-full md:w-1/2 text-left pr-2 md:border-r border-pink-100 pb-2 md:pb-0">
                        <h3 className="font-medium text-compact text-center">Gift Request Details</h3>
                        <div className="flex flex-col space-y-3 mt-2">
                          <div className="space-y-1">
                            <label className="text-mini text-gray-700">Personal Message</label>
                            <input 
                              ref={personalMessageRef}
                              type="text"
                              placeholder="Add a personal message"
                              className="w-full p-2 text-sm border border-pink-100 rounded"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-mini text-gray-700">Recipient Name</label>
                            <input 
                              type="text"
                              placeholder="Recipient's name"
                              className="w-full p-2 text-sm border border-pink-100 rounded"
                            />
                          </div>
                          
                          <div className="p-2 bg-pink-50 border border-pink-100 rounded text-xs text-pink-700">
                            <p>Your gift request will be linked to the following IDs:</p>
                            <ul className="list-disc pl-4 pt-1">
                              <li>Style ID: <span className="font-bold">{confirmedStyle.id}</span></li>
                              <li>Salon ID: <span className="font-bold">{salonId || 'N/A'}</span></li>
                              <li>Client ID: <span className="font-bold">{clientId || 'Anonymous'}</span></li>
                              {invitationId && <li>Invitation ID: <span className="font-bold">{invitationId}</span></li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Gift Preview */}
                      <div className="w-full md:w-1/2 text-left md:pl-2 mt-2 md:mt-0">
                        <h3 className="font-medium text-compact text-center">Gift Preview</h3>
                        <div className="border border-pink-100 rounded-md p-3 mt-2 bg-white">
                          <div className="text-center mb-2">
                            <div className="text-sm font-medium">You're gifting:</div>
                            <div className="text-pink-600 font-bold">{confirmedStyle.name}</div>
                          </div>
                          
                          <div className="flex justify-center mb-2">
                            <img 
                              src={confirmedStyle.gifUrl ? getImageUrl(confirmedStyle.gifUrl, 'vmb_style') : '/assets/LOGO1.png'}
                              alt={confirmedStyle.name}
                              className="h-20 w-20 object-cover rounded-md border border-pink-100"
                              onError={(e) => {
                                console.error(`Failed to load image for service: ${confirmedStyle.name}`);
                                e.currentTarget.src = '/assets/LOGO1.png';
                              }}
                            />
                          </div>
                          
                          <div className="text-center text-xs text-gray-600">
                            <div>Service Value: ${Math.round(confirmedStyle.price)}</div>
                            <div>Duration: {confirmedStyle.duration} min</div>
                            <div className="mt-1 font-medium">
                              {invitationId ? (
                                <div className="mt-2">
                                  <div className="text-pink-600">Invitation ID: {invitationId}</div>
                                  <div className="text-xs mt-1">Connection active</div>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <div>Gift Code: <span className="text-pink-600">VMB-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                    <div className="p-4 text-center">
                      <div>
                        <AlertTriangle className="h-12 w-12 mx-auto text-amber-400" />
                        <h3 className="font-medium text-lg mt-2">Style Selection Required</h3>
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
      </div>
    </div>
  );
}