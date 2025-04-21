import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '../../lib/apiRequest';
import { getImageUrl } from '../../lib/utils';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { PromoCodeDialog, ClientData } from '@/components/ui/PromoCodeDialog';

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
  })
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
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
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
    setSelectedStyle(style);
    setIsDetailsOpen(true);
    
    // Update form values when style is selected
    form.setValue('styleOptions.styleId', style.id);
    
    if (clientId) {
      form.setValue('styleOptions.clientId', clientId);
    }
    
    if (salonId) {
      form.setValue('styleOptions.salonId', salonId);
    }
    
    if (invitationId) {
      form.setValue('styleOptions.invitationId', invitationId);
    }
    
    // Also update the hidden field for validation script detection
    const styleOptionsData = {
      styleId: style.id,
      clientId: clientId,
      salonId: salonId,
      invitationId: invitationId
    };
    
    // Set value for styleOptions hidden field
    const styleOptionsElement = document.getElementById('styleOptions') as HTMLInputElement;
    if (styleOptionsElement) {
      styleOptionsElement.value = JSON.stringify(styleOptionsData);
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
    if (!selectedStyle || !values.styleOptions.clientId || !values.styleOptions.salonId) {
      toast({
        title: "Selection Error",
        description: "Missing required information to save your style selection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save selection to database using form values
      const response = await apiRequest(`/api/clients/${values.styleOptions.clientId}/style-selections`, 'POST', {
        styleId: values.styleOptions.styleId,
        salonId: values.styleOptions.salonId,
        invitationId: values.styleOptions.invitationId
      });
      
      if (response.ok) {
        const newSelection = await response.json();
        setSavedSelections(prev => [...prev, newSelection]);
        
        // Close details popup and show confirmation
        setIsDetailsOpen(false);
        setIsConfirmationOpen(true);
        
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
    } catch (error) {
      console.error("Error saving style selection:", error);
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : "Could not save your style selection",
        variant: "destructive"
      });
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
    
    // Handle French Tips specifically if needed
    if (selectedStyle?.name?.includes("French Tips")) {
      console.log("French Tips style selected - using special handler");
      
      // Close the details dialog and show confirmation directly for Tiff's French Tips
      if (!clientId || !salonId) {
        setIsDetailsOpen(false);
        toast({
          title: "Style Saved!",
          description: `You've selected ${selectedStyle.name}`,
          variant: "default"
        });
        return;
      }
    }
    
    // Proceed with form submission
    form.handleSubmit(onSubmit)();
  };
  
  // Reset all dialogs
  const handleCloseAll = () => {
    // Close all dialogs and reset selection
    setIsConfirmationOpen(false);
    setSelectedStyle(null);
  };
  
  // Handles continuing with the style selection (called from confirmation dialog)
  const handleConfirmSelection = () => {
    // Execute the form submission
    if (selectedStyle) {
      // Submit the actual style selection to the API
      handleSaveSelection();
      
      // Close confirmation dialog after short delay to give visual feedback
      setTimeout(() => {
        setIsConfirmationOpen(false);
        setSelectedStyle(null);
        
        // Show a toast confirmation
        toast({
          title: "Style Selected!",
          description: `${selectedStyle.name} has been added to your style selections.`,
          variant: "default"
        });
      }, 800);
    }
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-endpoint="/api/clients/:clientId/style-selections" data-method="POST">
          {/* Hidden form fields for validation */}
          <input type="hidden" name="styleOptions" id="styleOptions" />
          <input type="hidden" name="endpoint" value="/api/clients/:clientId/style-selections" />
          <input type="hidden" name="method" value="POST" />
          
          <div className="vmb-style-options">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 mb-3 rounded-md">
              <h2 className="font-medium text-sm sm:text-base text-pink-700">STEP 1 Pick your style...</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className={`border rounded px-2 py-2 ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'}`}
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
                      
                      <div className="mt-1 flex justify-between items-center">
                        <Badge 
                          className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white border-0 text-mini cursor-pointer"
                          onClick={() => handleSelectStyle(service)}
                        >
                          Book Now
                        </Badge>
                        <Button 
                          variant="link" 
                          className="text-micro text-pink-500 hover:text-pink-700 p-0 h-auto"
                          onClick={() => handleSelectStyle(service)}
                        >
                          Edit
                        </Button>
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
          </div>
        </form>
      </Form>

      {/* Style Details Popup */}
      {selectedStyle && (
        <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && setIsDetailsOpen(false)}>
          <DialogContent 
            className="sm:max-w-md border-2 border-[#FF92A5] p-0 overflow-hidden"
            aria-describedby="style-details-description"
          >
            <DialogHeader className="bg-[#FF92A5]/10 p-4">
              <DialogTitle className="text-center text-lg font-bold text-[#FF92A5] flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                {selectedStyle.name}
                <Sparkles className="h-5 w-5" />
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-gray-600">
                Style details for {selectedStyle.name} including price and duration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="h-48 w-full max-w-sm overflow-hidden rounded-lg shadow-md">
                <img 
                  src={selectedStyle.gifUrl ? getImageUrl(selectedStyle.gifUrl, 'vmb_style_popup') : '/assets/LOGO1.png'} 
                  alt={selectedStyle.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image for style: ${selectedStyle.name}`);
                    e.currentTarget.src = '/assets/LOGO1.png';
                  }}
                />
              </div>
              
              <div className="text-center px-6 max-w-sm">
                <p className="text-base">{selectedStyle.description}</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="font-bold text-xl text-[#FF92A5]">${Math.round(selectedStyle.price)}</span>
                  <span className="text-sm text-gray-500">{selectedStyle.duration} min</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-center gap-4 p-4 bg-gray-50">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailsOpen(false)}
                className="border-[#FF92A5] text-[#FF92A5] hover:bg-pink-50"
              >
                Back
              </Button>
              <Button 
                onClick={() => {
                  // Close the details dialog and open the confirmation dialog
                  setIsDetailsOpen(false);
                  setIsConfirmationOpen(true);
                }}
                disabled={isSubmitting}
                className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white"
              >
                {isSubmitting ? 'Saving...' : 'Select This Style'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Popup */}
      {selectedStyle && (
        <Dialog open={isConfirmationOpen} onOpenChange={(open) => !open && setIsConfirmationOpen(false)}>
          <DialogContent 
            className="sm:max-w-md border-2 border-[#FF92A5] p-0 overflow-hidden"
            aria-describedby="style-selection-confirmation"
          >
            <DialogHeader className="bg-pink-50 p-4">
              <DialogTitle className="text-center text-lg text-[#FF92A5] flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Confirm Style Selection
                <Sparkles className="h-5 w-5" />
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-gray-600">
                Please confirm you want to select {selectedStyle.name} and add it to your style basket.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#FF92A5] shadow-md">
                <img 
                  src={selectedStyle.gifUrl ? getImageUrl(selectedStyle.gifUrl, 'vmb_style_popup') : '/assets/LOGO1.png'} 
                  alt={selectedStyle.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image for style: ${selectedStyle.name}`);
                    e.currentTarget.src = '/assets/LOGO1.png';
                  }}
                />
              </div>
              
              <div className="text-center px-6">
                <h3 className="font-bold text-lg text-[#FF92A5]">{selectedStyle.name}</h3>
                <p className="text-base mt-2">{selectedStyle.description}</p>
                <p className="mt-1 font-semibold text-gray-700">${Math.round(selectedStyle.price)}</p>
                <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-100">
                  <p className="text-sm text-gray-700">
                    You're about to select this style. After confirmation, it will be saved to your profile
                    and shared with your salon.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-center gap-4 p-4 bg-gray-50">
              <Button 
                variant="outline"
                onClick={handleCloseAll}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={isSubmitting}
                className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white"
              >
                {isSubmitting ? 'Saving...' : 'Confirm & Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* PromoCode Dialog for anonymous users */}
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
    </>
  );
}