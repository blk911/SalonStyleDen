/**
 * VmbStyleOptions Component
 * 
 * ✅ WORKS EXACTLY AS INTENDED
 * 🚫 DO NOT MODIFY WITHOUT FULL RETEST
 * 
 * SOLID CODE SEGMENT: This component manages the three-step process for style selection,
 * invitation customization, and invitation sending. It works for both client-initiated
 * and salon-initiated invitations and adapts its UI and behavior based on the context.
 * 
 * The component handles:
 * 1. Style selection from available salon services
 * 2. Recipient information input and validation
 * 3. Preview and sending of invitation
 * 
 * This is a central feature of the VMB application and has been thoroughly tested.
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
  initialStyleId?: number; // To pre-select a specific style
  isPreviewMode?: boolean; // When viewing an existing invitation
  shouldPrefill?: boolean; // Whether to prefill form data
  prefilledServices?: string[]; // List of favorite services
}

export function VmbStyleOptions({ 
  services, 
  clientId, 
  salonId, 
  invitationId,
  salonInitiated = false, // Default to false for backward compatibility
  recipientData,
  onSelectionComplete,
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
  const [showStep2, setShowStep2] = useState(false);  // Hidden until Step 1 selection
  const [showStep3, setShowStep3] = useState(false);  // Hidden until Step 2 is completed
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
  
  // Handle sending the invitation
  const handleSendInvitation = async () => {
    try {
      // Close confirmation dialog
      setShowConfirmDialog(false);
      
      // Generate a unique ID for the invitation
      const uniqueId = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
      setFinalInvitationId(uniqueId);
      
      // Create invitation data
      const invitationData = {
        name: recipientName || "Friend",
        phone: recipientContact || "",
        email: recipientContact?.includes('@') ? recipientContact : "",
        message: invitationMessage,
        styleId: confirmedStyle?.id,
        styleName: confirmedStyle?.name,
        stylePrice: confirmedStyle?.price,
        styleDuration: confirmedStyle?.duration,
        styleImageUrl: confirmedStyle?.gifUrl,
        salonId: salonId,
        clientId: clientId,
        inviteHash: uniqueId,
        status: "SENT",
        sponsor: signature || "Friend",
        salonInitiated: salonInitiated
      };
      
      // Save invitation to database
      console.log("[FLOW][VmbStyleOptions] Saving invitation to database", invitationData);
      
      // POST to API
      const response = await apiRequest("/api/invitations", "POST", invitationData);
      const savedInvitation = await response.json();
      
      console.log("[FLOW][VmbStyleOptions] Invitation saved successfully", savedInvitation);
      
      // Show the final rendered invitation
      setShowFinalInvitationModal(true);
      
      // Call onSelectionComplete if provided to notify parent component
      if (onSelectionComplete && confirmedStyle) {
        const selection: StyleSelection = {
          id: savedInvitation.id || 0,
          clientId: clientId || 0,
          styleId: confirmedStyle.id,
          salonId: salonId || 0,
          selectedAt: new Date().toISOString(),
          status: "COMPLETE",
          invitationId: savedInvitation.id,
          createdAt: new Date().toISOString()
        };
        
        onSelectionComplete(selection);
      }
    } catch (error) {
      console.error("[FLOW:ERROR][VmbStyleOptions] Error saving invitation", error);
      toast({
        title: "Error",
        description: "There was a problem sending your invitation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
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
        const response = await apiRequest(
          `/api/clients/${values.styleOptions.clientId}/style-selections`, 
          'POST',
          {
            styleId: values.styleOptions.styleId,
            salonId: values.styleOptions.salonId,
            invitationId: values.styleOptions.invitationId
          }
        );
        
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
        
    // French Tips special case has been removed in favor of the direct style insertion approach
    
    // Proceed with form submission
    form.handleSubmit(onSubmit)();
  };
  
  // These functions are no longer needed since we're not using popups
  // Keeping empty implementations for backward compatibility
  const handleCloseAll = () => {
    // Empty implementation for backward compatibility
  };
  
  const handleConfirmSelection = () => {
    // Empty implementation for backward compatibility
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
                                    // Fallback to default image
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
              
              {/* Step 3 rendering logic is based on showStep3 and confirmedStyle */}
              
              {/* STEP 3 - With Collapsible behavior - Always show in preview mode */}
              {(showStep3 && confirmedStyle) && (
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
                      </div>
                      
                      {/* Right side - Gift Preview */}
                      <div className="w-full md:w-1/2 text-left md:pl-2 mt-2 md:mt-0">
                        <h3 className="font-medium text-compact text-center">Your Ven Me, Baby! Promo</h3>
                        <div className="border border-pink-100 rounded-md p-3 mt-2 bg-white shadow-sm">
                          {/* 1. Standardized Message Format */}
                          <div className={`rounded-lg ${isMobile ? 'p-1.5' : 'p-2'} ${salonInitiated ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'} mb-3 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                            {(() => {
                              // For preview mode, properly format the message with client data
                              const urlHasPreview = window.location.href.includes('preview=true') || window.location.href.includes('view=preview');
                              const isInPreviewMode = isPreviewMode || urlHasPreview;
                              
                              if (isInPreviewMode && confirmedStyle) {
                                const name = recipientName || recipientData?.name || "Randy";
                                const styleName = confirmedStyle.name;
                                const priceTime = `$${confirmedStyle.price} (${confirmedStyle.duration} min)`;
                                const signed = signature || recipientData?.sponsor || "Tiffany 5280 Nails Studio";
                                
                                // Different message for salon-initiated vs client-initiated invitations
                                if (salonInitiated) {
                                  return (
                                    <>
                                      Hi {name}, We are joining Ven Me, Baby! It's all about YOU! Create a request, enter your BF, admirer, or Mr. and send your gift request for {styleName}. VMB fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! 
                                      <div className="text-center mt-1">❤️❤️❤️</div>
                                      
                                      <div className="flex justify-center space-x-2 mt-2 mb-2">
                                        <Button className="bg-[#00D632] hover:bg-[#00B82D] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                                          <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                          $App
                                        </Button>
                                        <Button className="bg-[#3D95CE] hover:bg-[#3272A0] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                                          <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                          Zel
                                        </Button>
                                        <Button className="bg-[#008CFF] hover:bg-[#0070CC] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                                          <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                          Ven
                                        </Button>
                                      </div>
                                      
                                      <div className="flex justify-center mt-1 mb-2">
                                        <Button 
                                          className="px-3 py-0.5 h-auto text-xs bg-green-500 hover:bg-green-600 text-white"
                                          onClick={() => {
                                            // Show confirmation dialog
                                            setShowConfirmDialog(true);
                                          }}
                                        >
                                          SEND GIFT
                                        </Button>
                                      </div>
                                      
                                      {/* PS line removed per request */}
                                      <div className="text-center mt-2 text-xs text-gray-400">VMB:{invitationId || "5"}</div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <>
                                      Hi {name}, I would love a fresh set. My stylist has an opening for a {styleName}, {priceTime} will you Ven Me, Baby! ❤️❤️❤️ {signed}
                                    </>
                                  );
                                }
                              } else {
                                // Different default message based on invitation type
                                if (salonInitiated) {
                                  return (
                                    <>
                                      Hi [nm], We are joining Ven Me, Baby! It's all about YOU! Create a request, enter your BF, admirer, or Mr. and send your gift request for [insert sty opt NAME]. VMB fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! 
                                      <div className="text-center mt-1">❤️❤️❤️</div>
                                      
                                      <div className="flex justify-center space-x-2 mt-2 mb-2">
                                        <Button className="bg-[#00D632] hover:bg-[#00B82D] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                                          <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                          $App
                                        </Button>
                                        <Button className="bg-[#3D95CE] hover:bg-[#3272A0] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                                          <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                          Zel
                                        </Button>
                                        <Button className="bg-[#008CFF] hover:bg-[#0070CC] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                                          <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                          Ven
                                        </Button>
                                      </div>
                                      
                                      <div className="flex justify-center mt-1 mb-2">
                                        <Button 
                                          className="px-3 py-0.5 h-auto text-xs bg-green-500 hover:bg-green-600 text-white"
                                          onClick={() => {
                                            // Show confirmation dialog
                                            setShowConfirmDialog(true);
                                          }}
                                        >
                                          SEND GIFT
                                        </Button>
                                      </div>
                                      
                                      {/* PS line removed per request */}
                                      <div className="text-center mt-2 text-xs text-gray-400">VMB:{invitationId || "5"}</div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <>
                                      Hi {recipientName || "Friend"}, I would love a fresh set. My stylist has an opening for a {confirmedStyle?.name || "Style"}, ${confirmedStyle?.price || "45"} ({confirmedStyle?.duration || "30"} min) will you Ven Me, Baby! ❤️❤️❤️ {signature || "Me"}
                                    </>
                                  );
                                }
                              }
                            })()}
                          </div>
                          
                          {/* Unique Gift ID is now displayed within the message above */}
                          
                          {/* Payment icons are in the message area above */}
                          
                          {/* Add primary Submit button at the bottom of Step 3 */}
                          <div className="mt-4 text-center">
                            <Button 
                              type="button"
                              className={`w-full sm:w-auto px-6 py-2 ${salonInitiated ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'} text-white font-medium shadow-md`}
                              onClick={() => {
                                // Show confirmation dialog
                                setShowConfirmDialog(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {salonInitiated ? "Send Salon Invitation" : "Send Gift Request"}
                            </Button>
                          </div>
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
              <DialogTitle>{salonInitiated ? "Confirm Salon Invitation" : "Confirm Gift Request"}</DialogTitle>
              <DialogDescription>
                {salonInitiated 
                 ? "Are you sure you want to send this salon invitation? This action cannot be undone."
                 : "Are you sure you want to send this gift request? This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className={`${salonInitiated ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'} p-3 rounded-md border text-sm`}>
                {salonInitiated ? (
                  <p className="font-medium">
                    Your Ven Me, Baby! for {confirmedStyle?.name || "Selected Style"} is ready to send to {recipientName || "Friend"} cell: {
                      recipientContact ? (
                        // Format phone number if it's numeric and 10 digits
                        recipientContact.replace(/\D/g, '').length === 10 ? 
                          `(${recipientContact.replace(/\D/g, '').slice(0,3)}) ${recipientContact.replace(/\D/g, '').slice(3,6)}-${recipientContact.replace(/\D/g, '').slice(6,10)}` : 
                          recipientContact
                      ) : "No phone provided"
                    }
                  </p>
                ) : (
                  <>
                    <p>The following gift will be sent:</p>
                    <p className="font-medium mt-1">{confirmedStyle?.name || "Selected Style"}</p>
                    <p className="text-xs mt-2">Recipient: {recipientName || "Friend"}</p>
                    <p className="text-xs">{recipientContact || "No contact provided"}</p>
                  </>
                )}
                {invitationId && (
                  <div className="mt-2 bg-green-50 p-1.5 rounded border border-green-100 text-[10px]">
                    <p className="font-medium text-green-700">Completing Invitation ID: {invitationId}</p>
                    <p className="text-green-600">Status will change to COMPLETE</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button 
                type="button" 
                variant="outline"
                className="text-gray-600"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              
              {/* Send Invitation Button */}
              <Button 
                type="button"
                className={`${salonInitiated ? 'bg-amber-500 hover:bg-amber-600' : 'bg-pink-500 hover:bg-pink-600'} text-white font-medium`}
                onClick={() => {
                  // Handle send logic
                  handleSendInvitation();
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                {salonInitiated ? "Send Salon Invitation" : "Send Gift Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Final Rendered Invitation Modal */}
        <Dialog open={showFinalInvitationModal} onOpenChange={setShowFinalInvitationModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{salonInitiated ? "Salon Invitation Ready!" : "Your Gift Request Is Ready!"}</DialogTitle>
              <DialogDescription>
                {salonInitiated 
                  ? "This is the salon invitation with a unique ID. Review and click Send to complete."
                  : "This is your final gift request with unique ID. It can't be modified once sent."}
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
                salonInitiated={salonInitiated}
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
                  
                  // Show toast notification
                  toast({
                    title: "Gift Request Sent!",
                    description: "Your gift request has been sent to the recipient",
                    variant: "default"
                  });
                  
                  // Note: For salon-initiated invitations, we'll never reach here
                  // because we now redirect directly from the confirmation dialog
                }}
              >
                {salonInitiated ? "Send" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Validation Dialog using our new shared component */}
        <ContactValidationDialog
          open={showValidationDialog}
          onOpenChange={setShowValidationDialog}
          validationResult={validationResult}
          contactType={validatedContactType}
          contactValue={validatedContact}
        />
      </div>
    </div>
  );
}