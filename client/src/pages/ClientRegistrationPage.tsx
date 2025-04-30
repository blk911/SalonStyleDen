import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryClient, apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Loader2Icon, CheckCircleIcon, UserCircle, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { PhoneInputField } from '@/components/ui/PhoneInputField';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  favoriteServices?: string[];
  salonId?: number;
  sponsor?: string;
  status?: string;
  firstServiceDate?: string;
  createdAt: string;
  inviteHash: string;
}

interface Salon {
  id: number;
  name: string;
  ownerName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Create a client registration schema
const clientSchema = z.object({
  inviteType: z.enum(['friend', 'salonOwner']).default('friend'),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  sponsorSalonId: z.number().optional(),
  invitationId: z.number().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientRegistrationPage() {
  const [, navigate] = useLocation();
  const [isClientRegister] = useRoute('/client/register');
  const [isClientRegistration] = useRoute('/client-registration');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressDialogShown, setAddressDialogShown] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const termsCheckboxRef = useRef<HTMLButtonElement>(null);

  // Get query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const salonId = urlParams.get('salonId') ? Number(urlParams.get('salonId')) : undefined;
  const invitationId = urlParams.get('invitationId') ? Number(urlParams.get('invitationId')) : undefined;
  const invitationHash = urlParams.get('hash');

  // Fetch invitation data if we have an invitation ID or hash
  const {
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError,
  } = useQuery<Invitation>({
    queryKey: invitationHash 
      ? ['/api/invitations/by-hash', invitationHash] 
      : ['/api/invitations', invitationId],
    queryFn: async () => {
      const url = invitationHash
        ? `/api/invitations/by-hash/${invitationHash}`
        : `/api/invitations/${invitationId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch invitation');
      }
      return response.json();
    },
    enabled: !!(invitationId || invitationHash),
  });

  // Fetch salon data
  const {
    data: salon,
    isLoading: salonLoading,
  } = useQuery<Salon>({
    queryKey: ['/api/salons', salonId || invitation?.salonId],
    queryFn: async () => {
      const id = salonId || invitation?.salonId;
      const response = await fetch(`/api/salons/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch salon');
      }
      return response.json();
    },
    enabled: !!(salonId || invitation?.salonId),
  });
  
  // Initialize form with invitation data if available
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      inviteType: 'friend',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
      favoriteServices: [],
      acceptTerms: false,
      sponsorSalonId: salonId,
      invitationId: invitationId,
    },
  });
  
  // Listen for form reset event from PhoneInputField
  useEffect(() => {
    const handleFormReset = () => {
      // Reset the form to default values
      form.reset({
        inviteType: 'friend',
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        notes: '',
        favoriteServices: [],
        acceptTerms: false,
        sponsorSalonId: salonId,
        invitationId: invitationId,
      });
      
      // Show toast notification
      toast({
        title: "Form Reset",
        description: "The form has been reset due to registered phone number",
        variant: "default",
      });
    };
    
    // Add event listener for custom reset event
    document.addEventListener('vmb-form-reset', handleFormReset);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('vmb-form-reset', handleFormReset);
    };
  }, [form, toast, salonId, invitationId]);

  // When invitation data is loaded, populate the form
  // Auto-redirect effect for already processed invitations
  useEffect(() => {
    // Check if we have an invitation and if it's already been accepted/completed
    if (invitation && (invitation.status === "accepted" || invitation.status === "completed")) {
      // Check if a client already exists with this phone number
      const checkForExistingClient = async () => {
        try {
          console.log(`Auto-checking if client with phone ${invitation.phone} already exists...`);
          const response = await fetch(`/api/clients?phone=${encodeURIComponent(invitation.phone)}`);
          
          if (response.ok) {
            const clients = await response.json();
            
            if (clients && clients.length > 0) {
              const clientId = clients[0].id;
              console.log(`Client found with ID ${clientId}, auto-redirecting to dashboard`);
              
              // Show toast notification
              toast({
                title: "Account Found",
                description: "Your account is already registered. Redirecting to your dashboard.",
                variant: "default"
              });
              
              // Set registration complete to show transition UI
              setRegistrationComplete(true);
              
              // Redirect to client dashboard after a short delay
              setTimeout(() => {
                navigate(`/client/${clientId}`);
              }, 1000);
              
              return true; // Client found and redirect in progress
            }
          }
          return false; // No client found
        } catch (error) {
          console.error("Error checking for existing client:", error);
          return false;
        }
      };
      
      // Execute the check
      checkForExistingClient();
    }
  }, [invitation, navigate, toast]);

  // Setup and cleanup effect - reset state when component mounts
  useEffect(() => {
    // Clear the data attribute to reset dialog state on mount
    document.body.removeAttribute('data-address-shown');
    
    // Reset local state tracking for a fresh form start
    setAddressDialogShown(false);
    setShowAddressDialog(false);
    
    return () => {
      // Clean up data attribute when component unmounts
      document.body.removeAttribute('data-address-shown');
    };
  }, []);
  
  // Populate form with invitation data
  useEffect(() => {
    if (invitation) {
      form.reset({
        ...form.getValues(),
        inviteType: form.getValues().inviteType || 'friend', // Preserve inviteType
        name: invitation.name || '',
        email: invitation.email || '',
        phone: invitation.phone || '',
        notes: invitation.notes || '',
        favoriteServices: invitation.favoriteServices || [],
        sponsorSalonId: invitation.salonId || salonId,
        invitationId: invitation.id,
      });
    }
  }, [invitation, form, salonId]);

  // Create a flow testing logger helper for this component
  const logFlow = (step: string, data?: any) => {
    console.log(`[FLOW TEST] ${step}`, data ? data : '');
  };
  
  // Function to handle phone validation - FIXED: Remove automatic address popup trigger
  // This prevents the first popup in the double-popup problem
  const handlePhoneValidation = (isValid: boolean) => {
    // Phone validation success no longer triggers the address dialog automatically
    // The dialog will only show when form is submitted and address is missing
    logFlow(`Phone validation ${isValid ? 'passed' : 'failed'}`);
  };
  
  // Function to handle Later button click in address dialog
  const handleLaterClick = () => {
    logFlow('Later button clicked in address dialog');
    
    // Close the dialog
    setShowAddressDialog(false);
    setAddressDialogShown(true);
    
    // Set data attribute on body to indicate dialog was shown
    document.body.setAttribute('data-address-shown', 'true');
    logFlow('Dialog closed, data-address-shown attribute set to true');
    
    // Focus directly on terms checkbox immediately
    setTimeout(() => {
      if (termsCheckboxRef.current) {
        logFlow('Terms checkbox ref found, focusing');
        termsCheckboxRef.current.focus();
        
        // Scroll to the terms area to make it visible
        termsCheckboxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // No secondary dialog needed - direct navigation to terms checkbox
        logFlow('Terms checkbox focused and scrolled into view after clicking "Later"');
      } else {
        logFlow('ERROR: Terms checkbox not found after clicking "Later"');
      }
    }, 50); // Reduced timeout for faster focus transition
  };
  
  // Handle form submission - FIXED to prevent registration loop issues
  const onSubmit = async (data: ClientFormValues) => {
    try {
      logFlow('Form submission initiated');
      logFlow('Form data', {
        name: data.name,
        phone: data.phone,
        acceptTerms: data.acceptTerms,
        hasAddress: Boolean(data.address || data.city || data.state || data.zipCode)
      });
      
      // First, reset the dialog state on each form submission attempt 
      // to ensure consistent behavior even after multiple form submissions
      if (document.body.hasAttribute('data-address-shown')) {
        logFlow('Resetting address dialog state for new submission');
        document.body.removeAttribute('data-address-shown');
        setAddressDialogShown(false);
      }
      
      // Check if address fields should be prompted but are empty
      const hasNoAddress = !data.address && !data.city && !data.state && !data.zipCode;
      const shouldShowAddressPrompt = hasNoAddress && !addressDialogShown;
      
      // If address is empty and dialog hasn't been shown yet, show the address dialog and halt submission
      if (shouldShowAddressPrompt) {
        logFlow('Address fields empty, showing address dialog');
        logFlow('Address dialog state', {
          hasNoAddress,
          addressDialogShown,
          shouldShowAddressPrompt
        });
        
        setShowAddressDialog(true);
        setAddressDialogShown(true);
        document.body.setAttribute('data-address-shown', 'true');
        
        logFlow('Address dialog opened, submission halted until address provided or skipped');
        return; // Don't proceed with form submission until address is provided or skipped
      }
      
      logFlow('Address validation passed, continuing with form submission');
      
      setIsSubmitting(true);
      
      // Add sponsor information
      const clientData = {
        ...data,
        type: 'client',
        sponsor: salon?.name || invitation?.sponsor || 'Unknown',
        sponsorSalonId: data.sponsorSalonId || salonId || invitation?.salonId,
        isCurrentClient: true,
        accepted_terms: data.acceptTerms || false, // Use snake_case to match database
        invitationId: invitation?.id // Add invitation ID for linking
      };
      
      console.log('Submitting client data:', clientData);
      
      // Create the client
      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      // Parse response JSON
      const responseData = await clientResponse.json();
      
      // Handle duplicate client scenario (HTTP 409 Conflict)
      if (clientResponse.status === 409 && responseData.status === 'duplicate') {
        console.log('Duplicate client detected:', responseData);
        
        // Try to find existing client by the duplicate contact information
        let existingClientId: number | undefined;
        
        // Search for existing client with this phone or email
        const searchResponse = await fetch(`/api/clients?${responseData.field}=${encodeURIComponent(data[responseData.field as keyof ClientFormValues] as string)}`, {
          method: 'GET'
        });
        
        if (searchResponse.ok) {
          const foundClients = await searchResponse.json();
          
          if (foundClients && foundClients.length > 0) {
            // Use the first matching client
            existingClientId = foundClients[0].id;
            console.log('Found existing client with ID:', existingClientId);
            
            // Update invitation status if we have an invitation ID
            if (invitation?.id) {
              await fetch(`/api/invitations/${invitation.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  status: 'accepted',
                  clientId: existingClientId // Link invitation to existing client
                }),
              });
            }
            
            toast({
              title: 'Account Already Exists',
              description: 'We found your existing account. Redirecting to your dashboard.',
              variant: 'default',
            });
            
            setRegistrationComplete(true);
            
            // Redirect to existing client's dashboard after a delay
            setTimeout(() => {
              navigate(`/client/${existingClientId}`);
            }, 1500);
            
            return;
          }
        }
        
        // If we can't find a matching client, show an error
        throw new Error(`A client with this ${responseData.field} already exists. Please use a different ${responseData.field} or contact support.`);
      }
      
      // Handle invalid/error response
      if (!clientResponse.ok) {
        throw new Error(`Failed to register client: ${JSON.stringify(responseData)}`);
      }
      
      // Handle successful client creation (HTTP 201 Created)
      const createdClient = responseData;
      console.log('Created client:', createdClient);
      
      // Update invitation status if we have an invitation ID
      if (invitation?.id) {
        const inviteResponse = await fetch(`/api/invitations/${invitation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: 'accepted',
            clientId: createdClient.id // Link invitation to new client
          }),
        });
        
        if (!inviteResponse.ok) {
          console.warn('Failed to update invitation status, but client was created');
        }
      }
      
      // Show success message
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created successfully.',
        variant: 'default',
      });
      
      // Update registration state
      setRegistrationComplete(true);
      
      // Store client ID for redirection
      const clientId = createdClient?.id;
      console.log('Client created with ID:', clientId);
      
      // Redirect to client dashboard after a short delay
      setTimeout(() => {
        if (clientId) {
          navigate(`/client/${clientId}`);
        } else {
          // Fallback if we don't have the client ID
          console.warn('No client ID available for redirection');
          navigate('/');
        }
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (invitationLoading || salonLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-pink-600 mb-4" />
                <p>Loading registration information...</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  if (registrationComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
                <p className="text-gray-600 mb-4">
                  Your account has been created successfully. Redirecting to your dashboard...
                </p>
                <div className="animate-pulse">
                  <Loader2Icon className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form Column */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Client Registration</CardTitle>
                <CardDescription>
                  {invitation
                    ? `Complete your registration for ${invitation.sponsor || salon?.name || 'the salon'}`
                    : 'Register as a new client'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    {/* Invite Type Radio */}
                    <FormField
                      control={form.control}
                      name="inviteType"
                      render={({ field }) => (
                        <FormItem className="mb-2">
                          <div className="mb-1 font-medium">Who are you inviting?</div>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="friend"
                                checked={field.value === 'friend'}
                                onChange={() => field.onChange('friend')}
                                className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-600"
                              />
                              <label htmlFor="friend" className="text-sm font-medium flex items-center">
                                <UserCircle className="h-4 w-4 mr-1" /> Friend
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="salonOwner"
                                checked={field.value === 'salonOwner'}
                                onChange={() => field.onChange('salonOwner')}
                                className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-600"
                              />
                              <label htmlFor="salonOwner" className="text-sm font-medium flex items-center">
                                <Building2 className="h-4 w-4 mr-1" /> Salon Owner
                              </label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* FIRST ROW: Name and Phone side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Full Name" 
                                {...field} 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Focus the phone field when Enter is pressed in name field
                                    const phoneInput = document.querySelector('input[placeholder="Phone Number"]');
                                    if (phoneInput instanceof HTMLElement) {
                                      phoneInput.focus();
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <PhoneInputField 
                                placeholder="Phone Number" 
                                value={field.value}
                                onChange={field.onChange}
                                onValidationComplete={(isValid, isRegistered) => {
                                  // We are now displaying this information in the dialog
                                  console.log(`Phone validation: isValid=${isValid}, isRegistered=${isRegistered}`);
                                  
                                  if (isValid && !isRegistered && !addressDialogShown) {
                                    // Show address dialog after valid phone is entered
                                    setShowAddressDialog(true);
                                    setAddressDialogShown(true);
                                  }
                                }}
                                onEnterPress={() => {
                                  if (!addressDialogShown) {
                                    // Show the address dialog when Enter is pressed in phone field
                                    // if it hasn't been shown yet
                                    setShowAddressDialog(true);
                                    setAddressDialogShown(true);
                                  } else {
                                    // Focus terms checkbox if dialog was already shown
                                    if (termsCheckboxRef.current) {
                                      termsCheckboxRef.current.focus();
                                    }
                                  }
                                }}
                                clearField={() => {
                                  // Clear the phone field when a registered number is found
                                  field.onChange('');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Show optional fields toggle button */}
                    {addressDialogShown && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowOptionalFields(!showOptionalFields)}
                          className="w-full text-gray-600 border-gray-300"
                        >
                          {showOptionalFields ? (
                            <>
                              <ChevronUp className="mr-2 h-4 w-4" />
                              Hide optional details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              Show optional details
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Optional fields section - only displayed when toggled */}
                    {showOptionalFields && (
                      <div className="space-y-4 mt-3 border-l-2 border-pink-100 pl-3 py-2">
                        {/* Email field - full width */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  placeholder="Email (Optional)" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Address field - full width */}
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Address (Optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* City and State fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="City (Optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="State (Optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* ZIP Code field */}
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="ZIP Code (Optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Notes field */}
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional Notes (Optional)" 
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => {
                        // Use component state for tracking focus and highlight
                        const [isFocused, setIsFocused] = useState(false);
                        const [isHighlighted, setIsHighlighted] = useState(false);
                        
                        return (
                          <FormItem 
                            className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors duration-200 hover:bg-pink-50/50 ${
                              isFocused || isHighlighted ? 'bg-pink-50 border-pink-200 shadow-sm' : ''
                            }`}
                          >
                            <FormControl>
                              <Checkbox
                                ref={termsCheckboxRef}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onMouseEnter={() => setIsHighlighted(true)}
                                onMouseLeave={() => setIsHighlighted(false)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I accept the terms and conditions
                              </FormLabel>
                              <FormDescription>
                                By registering, you agree to our privacy policy and terms of service.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-pink-600 hover:bg-pink-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Info Column */}
          <div className="md:col-span-2">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-xl">Registration Information</CardTitle>
              </CardHeader>
              <CardContent>
                {salon && (
                  <div className="mb-6">
                    <h3 className="font-medium text-lg mb-2">Your Sponsor Salon</h3>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center mb-3">
                        <Avatar className="h-12 w-12 mr-3">
                          <AvatarFallback>{salon.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{salon.name}</p>
                          {salon.address && (
                            <p className="text-sm text-gray-500">
                              {salon.address}, {salon.city}, {salon.state} {salon.zipCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Owner: {salon.ownerName}</p>
                    </div>
                  </div>
                )}
                
                {invitation && invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-lg mb-2">Your Favorite Services</h3>
                    <div className="bg-white rounded-lg p-4 border">
                      <ul className="list-disc pl-5">
                        {invitation.favoriteServices.map((service, idx) => (
                          <li key={idx} className="text-gray-600">{service}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Next Steps</h3>
                  <div className="bg-white rounded-lg p-4 border">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li className="text-gray-600">Complete the registration form</li>
                      <li className="text-gray-600">Access your client dashboard</li>
                      <li className="text-gray-600">Explore available services and styles</li>
                      <li className="text-gray-600">Connect with your salon</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={(open) => {
        setShowAddressDialog(open);
        if (!open) {
          // When dialog is closed, mark it as shown
          setAddressDialogShown(true);
          
          // Focus the terms checkbox when dialog is closed
          setTimeout(() => {
            if (termsCheckboxRef.current) {
              termsCheckboxRef.current.focus();
            }
          }, 100);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Additional Information</DialogTitle>
            <DialogDescription>
              Your address helps us provide location-based services and promotions. 
              You can also add this information later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <div className="mb-2">
                <FormLabel htmlFor="dialog-email">Email (Optional)</FormLabel>
                <Input 
                  id="dialog-email"
                  placeholder="Email" 
                  value={form.getValues().email || ''}
                  onChange={(e) => form.setValue('email', e.target.value)}
                />
              </div>
              
              <div className="mb-2">
                <FormLabel htmlFor="dialog-address">Street Address (Optional)</FormLabel>
                <Input 
                  id="dialog-address"
                  placeholder="Address" 
                  value={form.getValues().address || ''}
                  onChange={(e) => form.setValue('address', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <FormLabel htmlFor="dialog-city">City (Optional)</FormLabel>
                  <Input 
                    id="dialog-city"
                    placeholder="City" 
                    value={form.getValues().city || ''}
                    onChange={(e) => form.setValue('city', e.target.value)}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="dialog-state">State (Optional)</FormLabel>
                  <Input 
                    id="dialog-state"
                    placeholder="State" 
                    value={form.getValues().state || ''}
                    onChange={(e) => form.setValue('state', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <FormLabel htmlFor="dialog-zipcode">ZIP Code (Optional)</FormLabel>
                <Input 
                  id="dialog-zipcode"
                  placeholder="ZIP Code" 
                  value={form.getValues().zipCode || ''}
                  onChange={(e) => form.setValue('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="outline" 
              onClick={handleLaterClick}
              type="button"
            >
              I'll add this later
            </Button>
            <Button 
              type="button"
              onClick={() => {
                // Close dialog
                setShowAddressDialog(false);
                setAddressDialogShown(true);
                
                // Focus directly on terms checkbox immediately
                setTimeout(() => {
                  if (termsCheckboxRef.current) {
                    termsCheckboxRef.current.focus();
                    // Scroll to the terms area to make it visible
                    termsCheckboxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    console.log('[FLOW] Direct navigation to terms checkbox after saving information');
                  }
                }, 50); // Reduced timeout for faster focus transition
              }}
              variant="default"
            >
              Save Information
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}