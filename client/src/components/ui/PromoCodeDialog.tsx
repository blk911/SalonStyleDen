import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ClientForm from "@/components/forms/ClientForm";

// Define the type for the client data returned from the invitation validation
export interface ClientData {
  clientId: number;
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: any; // Allow for additional properties
}

export interface PromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string; // Optional phone number passed from ContactValidationDialog
  salonId?: number; // Optional salon ID for direct invitation verification
  onSuccess?: (clientData: ClientData) => void; // Callback when verification is successful
  phoneValidation?: boolean; // Flag to indicate if this dialog is being used for phone validation
}

export function PromoCodeDialog({
  open,
  onOpenChange,
  phone,
  salonId,
  onSuccess,
  phoneValidation,
}: PromoCodeDialogProps) {
  // Extract last 4 digits of phone if provided (for promo code)
  const lastFourDigits = phone ? phone.replace(/\D/g, '').slice(-4) : "";
  
  // Initialize promo code with last 4 digits if phone is provided
  const [promoCode, setPromoCode] = useState(lastFourDigits);
  
  // Initialize phone number with provided phone (or empty)
  const [phoneNumber, setPhoneNumber] = useState(phone || "");
  
  // Update phoneNumber if phone prop changes
  useEffect(() => {
    if (phone) {
      setPhoneNumber(phone);
    }
  }, [phone]);
  
  // Set initial mode based on the context
  // If phoneValidation flag is true, we're coming from the "No" path in ContactValidationDialog
  // and we should be in phone validation mode
  // Otherwise, we're in promo code mode (the default)
  const [validationMode, setValidationMode] = useState<'promo' | 'phone'>(
    phoneValidation === true ? 'phone' : 'promo'
  );
  
  useEffect(() => {
    // This ensures that if phoneValidation prop changes, the validation mode updates accordingly
    if (phoneValidation === true) {
      setValidationMode('phone');
    }
  }, [phoneValidation]);
  
  const [loading, setLoading] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs based on validation mode
    if (validationMode === 'promo' && !promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }
    
    if (validationMode === 'phone' && (!phoneNumber.trim() || phoneNumber.length < 4)) {
      toast({
        title: "Error",
        description: "Please enter at least the last 4 digits of your phone number",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Log validation attempt
      if (validationMode === 'promo') {
        console.log(`Validating promo code: ${promoCode}`);
      } else {
        console.log(`Validating with phone: ${phoneNumber}`);
      }
      
      // For phone validation, check if this is an existing client first
      // This gives a better user experience than showing an error or registration form
      if (validationMode === 'phone' && phoneNumber.length >= 4) {
        try {
          // Check for existing clients with this phone number
          console.log(`Checking for existing clients with phone: ${phoneNumber}`);
          const clientCheckResponse = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phoneNumber,
              type: "client",
              // Minimal data for check only
              name: "Checking Contact",
              email: "",
              ...(salonId ? { salonId: Number(salonId) } : {})
            })
          });
          
          const clientData = await clientCheckResponse.json();
          
          // If 200 OK and matchFound, we found an existing client
          if (clientCheckResponse.status === 200 && clientData.matchFound) {
            console.log("Existing client found:", clientData.id);
            
            toast({
              title: "Success",
              description: "Welcome back! Redirecting to your dashboard.",
            });
            
            // Close dialog
            onOpenChange(false);
            
            // Redirect to client dashboard
            if (clientData.id) {
              console.log(`Redirecting to client dashboard: ${clientData.id}`);
              setLocation(`/client/${clientData.id}`);
              setLoading(false);
              return;
            }
          }
        } catch (checkError) {
          console.error("Error checking for existing client:", checkError);
          // Continue with normal validation flow
        }
      }
      
      // Verify invitation based on validation mode
      // IMPORTANT: Always include phone number regardless of validation mode
      // This allows the server to check for matches between promo code and phone
      const response = await apiRequest("/api/invitations/validate", {
        method: "POST",
        body: JSON.stringify({
          code: validationMode === 'promo' ? promoCode : '',
          // ALWAYS pass the phone number with both validation modes
          phone: phoneNumber || phone || "",
          salonId: salonId || undefined,
          validationMode: validationMode,
        }),
      });
      
      if (response.error) {
        // SIMPLIFICATION: If validation fails, go back to home 
        console.log("Validation failed with error:", response.error);
        
        toast({
          title: "Verification Failed",
          description: response.error || "Could not validate your information",
          variant: "destructive",
        });
        
        // If redirect is specified in error response, follow it
        if (response.redirect === 'home') {
          // Close dialog
          onOpenChange(false);
          
          // Return to home page
          setLocation('/');
          setLoading(false);
          return;
        }
        
        // Otherwise just show error and stay on dialog
        setLoading(false);
      } else {
        // Success - client ID is returned with verified invitation
        if (response.clientId) {
          toast({
            title: "Success",
            description: "Verification successful!",
          });
          
          // Close dialog
          onOpenChange(false);
          
          // If onSuccess callback is provided, invoke it with the response data
          if (onSuccess) {
            onSuccess(response);
          } else {
            // Otherwise, fallback to standard redirection
            console.log(`Redirecting to client dashboard for client ID: ${response.clientId}`);
            setLocation(`/client/${response.clientId}`);
          }
        } else if (response.redirect === 'register') {
          // Need to create a new account with this invitation
          toast({
            title: "Verification successful",
            description: "Please complete your registration to continue",
          });
          
          // Set up prefill data for the registration form
          setPrefilledData({
            name: response.name || "",
            phone: response.phone || phoneNumber || phone || "",
            salonId: salonId || response.salonId
          });
          
          // Show the registration form instead of redirecting
          setShowRegistrationForm(true);
        } else {
          toast({
            title: "Error",
            description: "Client ID not returned from server. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error validating invitation:", error);
      
      toast({
        title: "Error",
        description: "There was an error with verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle client registration form submission
  const handleClientRegistration = async (clientData: any) => {
    try {
      setLoading(true);
      console.log("Registration form submitted with data:", clientData);
      
      // First, try to find existing client with this phone to avoid duplicate creation
      if (clientData.phone) {
        console.log("Checking for existing client with phone:", clientData.phone);
        try {
          // Get clients matching this phone number
          const clientsResponse = await fetch('/api/clients?phone=' + encodeURIComponent(clientData.phone), {
            method: 'GET'
          });
          
          if (clientsResponse.ok) {
            const clients = await clientsResponse.json();
            console.log(`Found ${clients.length} clients with matching phone`);
            
            if (clients.length > 0) {
              // Use the first matching client
              const existingClient = clients[0];
              console.log("Using existing client:", existingClient.id);
              
              toast({
                title: "Account Found",
                description: "Redirecting to your dashboard."
              });
              
              // Close dialog
              onOpenChange(false);
              
              // Redirect to client dashboard
              setLocation(`/client/${existingClient.id}`);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking for existing client:", error);
          // Continue with normal flow if error occurs
        }
      }
      
      // If no existing client found, proceed with registration
      console.log("No matching client found, proceeding with registration");
      
      // Attempt to create client with the data
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          type: 'client',
          // Include salon reference if provided
          ...(salonId ? { salonId: Number(salonId) } : {})
        })
      });
      
      const data = await response.json();
      console.log("Registration API response:", response.status, data);
      
      // Check if the server found a matching client instead of creating a new one
      if (response.status === 200 && data.matchFound) {
        console.log("Server found existing client, redirecting to dashboard:", data.id);
        
        toast({
          title: "Client Account Found",
          description: "Redirecting you to your dashboard."
        });
        
        // Close dialog
        onOpenChange(false);
        
        // Redirect to client dashboard with the existing client ID
        if (data.id) {
          setLocation(`/client/${data.id}`);
        }
        
        return;
      }
      
      // Check if this was a duplicate detection case
      if (response.status === 409 && data.status === 'duplicate') {
        console.log("409 Duplicate detected, client exists but needs more info");
        
        // Check if we received a client ID in the response
        if (data.id) {
          console.log("Duplicate has ID, redirecting:", data.id);
          
          toast({
            title: "Account Found",
            description: "Redirecting you to your dashboard."
          });
          
          // Close dialog and redirect
          onOpenChange(false);
          setLocation(`/client/${data.id}`);
          return;
        }
        
        // This means the phone/email exists but user needs to complete registration
        toast({
          title: "Contact Details Found",
          description: data.message || "Please complete your registration to continue."
        });
        
        // Pre-fill the form with the data we have
        setPrefilledData({
          ...prefilledData,
          ...data,
          phone: data.phone || phoneNumber || phone || "",
          salonId: salonId || data.salonId
        });
        
        // Keep the form open
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to register client");
      }
      
      // Success - registration completed
      toast({
        title: "Registration Complete",
        description: "Your account has been created successfully!"
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Redirect to client dashboard with the new client ID
      if (data.id) {
        setLocation(`/client/${data.id}`);
      }
      
    } catch (error) {
      console.error("Error registering client:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to complete registration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle errors from the client form or API calls related to registration
  const handleRegistrationError = (error: any) => {
    console.error("Registration error:", error);
    toast({
      title: "Registration Error",
      description: error instanceof Error ? error.message : "There was a problem with your registration",
      variant: "destructive"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={showRegistrationForm ? "sm:max-w-xl max-h-[90vh] overflow-y-auto" : "sm:max-w-md max-h-[90vh] overflow-y-auto"}
        aria-describedby="dialog-description">
        <div id="dialog-description" className="sr-only">
          {showRegistrationForm 
            ? 'Complete your client registration form to continue' 
            : (validationMode === 'promo' 
                ? 'Enter your promo code to access special offers' 
                : 'Verify your identity by entering your phone number')}
        </div>
        <DialogHeader>
          <DialogTitle className="text-center">
            {showRegistrationForm 
              ? 'Complete Your Registration' 
              : (validationMode === 'promo' ? 'Enter Promo Code' : 'ENTER YOUR PHONE NUMBER TO COMPLETE REGISTRATION')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {showRegistrationForm 
              ? 'Please fill in your information below' 
              : (validationMode === 'promo' 
                  ? 'Enter the promo code from your invitation' 
                  : 'Verify your phone number to continue')}
          </DialogDescription>
        </DialogHeader>
        
        {showRegistrationForm ? (
          // Show client registration form when needed
          <ClientForm 
            initialData={prefilledData} 
            onSubmit={handleClientRegistration}
            onError={handleRegistrationError}
            salonId={salonId}
          />
        ) : (
          // Show validation form (promo code or phone)
          <>
            <div className="p-4 border border-pink-100 bg-pink-50 rounded mb-5 text-sm text-center">
              {validationMode === 'promo' ? (
                <>
                  <p>Enter the promo code you received via text message or email.</p>
                  <p className="mt-2">This code will link your registration to your salon invitation.</p>
                </>
              ) : (
                <>
                  <p>We'll verify your identity and give you access to your account.</p>
                </>
              )}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {validationMode === 'promo' ? (
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter your promo code"
                    className="border-pink-200 focus:border-pink-400 text-center"
                  />
                ) : (
                  <Input
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow numeric input
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPhoneNumber(value);
                    }}
                    placeholder="Enter your phone number"
                    className="border-pink-200 focus:border-pink-400 text-center"
                    maxLength={10} // Allow full phone or just last 4 digits
                  />
                )}
                
                {/* Mode switcher */}
                <div className="flex justify-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-xs text-pink-700 p-0 h-auto"
                    onClick={() => setValidationMode(validationMode === 'promo' ? 'phone' : 'promo')}
                  >
                    {validationMode === 'promo' 
                      ? "Don't have a promo code? Verify with your phone number instead." 
                      : "Have a promo code instead of your phone number? Enter it here."}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="border-pink-300 w-full h-12 px-4"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="bg-pink-500 hover:bg-pink-600 w-full h-12 px-4"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}