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

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon, Sparkles, AlertTriangle, ChevronUpIcon, ChevronDownIcon, Send, Loader2 } from 'lucide-react';
import { FaMoneyBillWave } from 'react-icons/fa';
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
import { useContactValidation } from '@/hooks/use-contact-validation';
import { ContactValidationDialog } from '@/components/ui/ContactValidationDialog';

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
  invitationId?: number;
  createdAt?: string;
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

export function VmbStyleOptions({ 
  services = [], 
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
  prefilledServices = []
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
  const [stateTracker, setStateTracker] = useState(0);
  const [showStep1, setShowStep1] = useState(true);
  const [isStep1Open, setIsStep1Open] = useState(false);
  const [isStep2Open, setIsStep2Open] = useState(false);
  const [isStep3Open, setIsStep3Open] = useState(false);
  
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
  const personalMessageRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Use our contact validation hook
  const { 
    validationResult,
    validateContact,
    isValidating,
    validatedContactType,
    resetValidation
  } = useContactValidation();
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validatedContact, setValidatedContact] = useState("");
  
  // Responsive media queries
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });
  const isTablet = useMediaQuery({ query: '(max-width: 768px)' });
  const isDesktop = useMediaQuery({ query: '(min-width: 1024px)' });
  
  // Update state tracker when key states change
  useEffect(() => {
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
  
  // Handle initial style selection from props (for previewing existing invitations)
  useEffect(() => {
    if (initialStyleId && services && services.length > 0) {
      const style = services.find(s => s.id === initialStyleId);
      
      if (style) {
        // Set the selected style
        setSelectedStyle(style);
        setConfirmedStyle(style);
        
        // Update form values
        form.setValue('styleOptions.styleId', style.id);
        
        // For preview mode, skip to step 3
        if (isPreviewMode) {
          setIsStep1Open(false);
          setIsStep2Open(false);
          setIsStep3Open(true);
          setShowStep3(true);
          
          // Make sure form is complete for Step 3
          if (recipientData) {
            setRecipientName(recipientData.name);
            setRecipientContact(recipientData.phone);
            setSignature(recipientData.sponsor);
          }
        }
      }
    } else if (isPreviewMode && services && services.length > 0) {
      // Fallback for preview mode - use the first available style
      const firstStyle = services[0];
      setSelectedStyle(firstStyle);
      setConfirmedStyle(firstStyle);
      
      // Update form values
      form.setValue('styleOptions.styleId', firstStyle.id);
      
      setIsStep1Open(false);
      setIsStep2Open(false);
      setIsStep3Open(true);
      setShowStep3(true);
    }
  }, [initialStyleId, services, form, isPreviewMode, recipientData]);
  
  // Special handling for salon-initiated invitations
  useEffect(() => {
    if (salonInitiated) {
      // For salon-initiated invitations:
      // 1. Close Step 1 (style selection) after user selects
      // 2. Keep Step 2 closed (we already have client contact info)
      // 3. Open Step 3 directly (Preview and Send)
      
      // Pre-populate recipient data if available
      if (recipientData) {
        setRecipientName(recipientData.name);
        setRecipientContact(recipientData.phone);
        setSignature(recipientData.sponsor);
        
        // Handle preview mode (check both URL and explicit flag)
        const urlHasPreview = window.location.href.includes('preview=true') || window.location.href.includes('view=preview');
        const isInPreviewMode = isPreviewMode || urlHasPreview;
        
        // ALWAYS force a confirmed style in preview mode
        if (isInPreviewMode && services && services.length > 0) {
          // Find a style that matches favoriteServices if available, otherwise use first service
          let styleToSelect = services[0]; // Default fallback 
          
          // Try to find a matching style based on prefilled services
          if (prefilledServices && prefilledServices.length > 0) {
            const matchingStyle = services.find(s => s.name.includes(prefilledServices[0]) || 
                                          prefilledServices[0].includes(s.name));
            if (matchingStyle) {
              styleToSelect = matchingStyle;
            }
          }
          
          // Set the confirmed style
          setSelectedStyle(styleToSelect);
          setConfirmedStyle(styleToSelect);
          form.setValue('styleOptions.styleId', styleToSelect.id);
          
          // Explicitly set Step 3 to be visible and open for preview mode
          setShowStep3(true);
          setIsStep3Open(true);
          
          // Also set this as the initial confirmed style
          // Use salon-to-client message template for salon-initiated invitations
          const salonToClientMessage = `Hi [NAME], We are joining Ven Me, Baby! It's all about YOU! Create a gift request, enter your BF, admirer, Mr. and send! Pre-paid styling appointments. It fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! ❤️❤️❤️`;
          
          let updatedMessage = salonToClientMessage;
          updatedMessage = updatedMessage.replace("[NAME]", recipientData.name);
          setInvitationMessage(updatedMessage);
        }
        // Pre-format the message with available data
        else if (confirmedStyle) {
          // Use salon-to-client message template for salon-initiated invitations
          const salonToClientMessage = `Hi [NAME], We are joining Ven Me, Baby! It's all about YOU! Create a gift request, enter your BF, admirer, Mr. and send! Pre-paid styling appointments. It fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! ❤️❤️❤️`;
          
          let updatedMessage = salonToClientMessage;
          updatedMessage = updatedMessage.replace("[NAME]", recipientData.name);
          setInvitationMessage(updatedMessage);
        }
      }
      
      // For salon-initiated, we want to skip Step 2
      setIsStep2Open(false);
      
      // Set up preview mode with a confirmed style if we're in preview mode
      if (isPreviewMode) {
        setIsStep3Open(true);
        setShowStep3(true);
        
        // If we still don't have a confirmed style, use the first available style
        if (!confirmedStyle && services && services.length > 0) {
          setConfirmedStyle(services[0]);
        }
      }
      // If we have a style selected, automatically open Step 3
      else if (confirmedStyle) {
        setIsStep3Open(true);
        setShowStep3(true);
      }
    }
    
    // Pre-fill mode (when viewing an existing invitation)
    if (shouldPrefill && recipientData) {
      setRecipientName(recipientData.name);
      setRecipientContact(recipientData.phone);
      setSignature(recipientData.sponsor);
      
      // Skip to step 3 for previews
      if (isPreviewMode) {
        setIsStep1Open(false);
        setIsStep2Open(false);
        setIsStep3Open(true);
        setShowStep3(true);
      }
    }
  }, [salonInitiated, recipientData, confirmedStyle, shouldPrefill, isPreviewMode]);

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
    
    // If we're in GiftCreationFlow mode, call the onStyleSelect callback
    if (onStyleSelect) {
      console.log(`Calling onStyleSelect with style ID: ${style.id}`);
      onStyleSelect(style.id);
    }
    
    // Special handling for salon-initiated invitations
    if (salonInitiated) {
      setShowStep2(true);
      setShowStep3(true);
      // Close Step 1 & 2, open Step 3
      setIsStep1Open(false);
      setIsStep2Open(false);
      setIsStep3Open(true);
      
      // If we have recipient data, update the message
      if (recipientData) {
        // Use salon-to-client message template for salon-initiated invitations
        const salonToClientMessage = `Hi [NAME], We are joining Ven Me, Baby! It's all about YOU! Create a gift request, enter your BF, admirer, Mr. and send! Pre-paid styling appointments. It fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! ❤️❤️❤️`;
        
        let updatedMessage = salonToClientMessage;
        updatedMessage = updatedMessage.replace("[NAME]", recipientData.name);
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
      // Open Step 2 after selecting a style in Step 1
      setIsStep2Open(true);
      
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
      // Only now show Step 3 (after form submission from Step 2)
      setShowStep3(true);
      
      // Close Step 2 when Step 3 appears, but keep it visible as a collapsible
      setIsStep2Open(false);
      // Open Step 3
      setIsStep3Open(true);
      
      // Replace placeholders in message with actual values
      let updatedMessage = invitationMessage;
      updatedMessage = updatedMessage.replace("[NAME]", recipientName || "[NAME]");
      updatedMessage = updatedMessage.replace("[STY OPT]", confirmedStyle.name);
      updatedMessage = updatedMessage.replace("[SIGNED]", signature || "[SIGNED]");
      setInvitationMessage(updatedMessage);
      
      // Show a more helpful message to guide the user to the next step
      toast({
        title: "Gift Options Ready!",
        description: "Now you can preview and send your invitation!",
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
        toast({
          title: "Style Selected!",
          description: `You've selected ${selectedStyle.name} (Preview Mode)`,
          variant: "default"
        });
      }
      
      // Ensure all steps are showing
      setShowStep2(true);
      setShowStep3(true);
      // Open Step 3 and close Step 2
      setIsStep2Open(false);
      setIsStep3Open(true);
      
      // Update invitation message with proper values
      let updatedMessage = invitationMessage;
      updatedMessage = updatedMessage.replace("[NAME]", recipientName || "[NAME]");
      updatedMessage = updatedMessage.replace("[STY OPT]", selectedStyle.name);
      updatedMessage = updatedMessage.replace("[SIGNED]", signature || "[SIGNED]");
      setInvitationMessage(updatedMessage);
    } catch (error) {
      // Don't show error - instead just display the gift section
      setShowStep2(true);
      setShowStep3(true);
      // Open Step 3 and close Step 2
      setIsStep2Open(false);
      setIsStep3Open(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Legacy handler for backward compatibility with additional error handling
  const handleSaveSelection = () => {
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
      // Important: set the confirmed style and show Step 2 directly
      const confirmedStyleCopy = {...selectedStyle};
      setConfirmedStyle(confirmedStyleCopy);
      setShowStep2(true);
      setIsDetailsOpen(false);
      setIsConfirmationOpen(false);
      
      toast({
        title: "Style Saved!",
        description: "Now you can start your Design!",
        variant: "default"
      });
      return;
    }
        
    // Proceed with form submission
    form.handleSubmit(onSubmit)();
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
                        <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 1 Select Your Style...</h2>
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
                        {services && services.length > 0 ? services.map((service) => (
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
                </div>
              )}
              
              {/* Add 6px spacing */}
              <div className="h-[6px]"></div>
              
              {/* Other steps would go here, but they're not needed for GiftCreationFlow */}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}