import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/apiRequest';
import { useLocation } from 'wouter';

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
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
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
    }
  }, [clientId]);
  
  // Handle style selection
  const handleSelectStyle = (style: StyleOption) => {
    setSelectedStyle(style);
    setIsDetailsOpen(true);
  };
  
  // Handle mouse over effect
  const handleMouseEnter = (styleId: number) => {
    setHoveredStyle(styleId);
  };
  
  const handleMouseLeave = () => {
    setHoveredStyle(null);
  };
  
  // Handle saving the selection
  const handleSaveSelection = async () => {
    if (!selectedStyle || !clientId || !salonId) {
      toast({
        title: "Selection Error",
        description: "Missing required information to save your style selection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save selection to database
      const response = await apiRequest(`/api/clients/${clientId}/style-selections`, 'POST', {
        styleId: selectedStyle.id,
        salonId: salonId,
        invitationId: invitationId
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
  
  // Reset all dialogs
  const handleCloseAll = () => {
    setIsConfirmationOpen(false);
    setSelectedStyle(null);
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
      <div className="py-2">
        <div className="container mx-auto px-2">
          <div className="bg-white shadow-sm rounded-md">
            <div className="p-3">
              <h2 className="font-bold text-sm mb-3 text-[#FF92A5]">Ven Me, Baby! Style Options: STEP 1 Pick your style...</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div 
                    key={service.id} 
                    className={`vmb-style-card cursor-pointer ${selectedStyle?.id === service.id ? 'selected' : ''}`}
                    onClick={() => handleSelectStyle(service)}
                  >
                    <div className="flex">
                      {/* Left side - Text */}
                      <div className="w-2/3 p-3">
                        <h3 className="font-medium text-sm">{service.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-bold text-sm">${Math.round(service.price)}</span>
                          <span className="text-xs text-gray-500">{service.duration} min</span>
                        </div>
                        
                        <div className="mt-2">
                          {service.featured && (
                            <Badge className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white border-0 text-xs">
                              {getBadgeText(service.name)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Image */}
                      <div className="w-1/3 flex items-center justify-center p-2">
                        <img 
                          src={service.gifUrl || '/assets/LOGO1.png'} 
                          alt={service.name}
                          className="w-full h-24 object-cover rounded-md"
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
          </div>
        </div>
      </div>

      {/* Style Details Popup */}
      {selectedStyle && (
        <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && setIsDetailsOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-[#FF92A5]">{selectedStyle.name}</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="h-48 w-full overflow-hidden rounded-md">
                <img 
                  src={selectedStyle.gifUrl || '/assets/LOGO1.png'} 
                  alt={selectedStyle.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image for style: ${selectedStyle.name}`);
                    e.currentTarget.src = '/assets/LOGO1.png';
                  }}
                />
              </div>
              
              <div className="text-center px-4">
                <p className="text-base">{selectedStyle.description}</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="font-bold text-lg">${Math.round(selectedStyle.price)}</span>
                  <span className="text-sm text-gray-500">{selectedStyle.duration} min</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailsOpen(false)}
                className="border-[#FF92A5] text-[#FF92A5] hover:bg-pink-50"
              >
                Back
              </Button>
              <Button 
                onClick={handleSaveSelection}
                className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white"
              >
                Select This Style
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Popup */}
      {selectedStyle && (
        <Dialog open={isConfirmationOpen} onOpenChange={(open) => !open && setIsConfirmationOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-lg text-[#FF92A5]">Style Selected!</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="text-center px-4">
                <h3 className="font-bold text-lg">{selectedStyle.name}</h3>
                <p className="text-base mt-2">{selectedStyle.description}</p>
                <p className="mt-1 font-semibold">${Math.round(selectedStyle.price)}</p>
                <p className="text-sm mt-4 text-gray-500">
                  Thank you for selecting this style! It has been added to your VMB Style basket.
                </p>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={handleCloseAll}
                className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white"
              >
                Continue Shopping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}