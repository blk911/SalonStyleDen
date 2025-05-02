import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { PhoneInputField } from '@/components/ui/PhoneInputField';
import { useContactValidation } from '@/hooks/use-contact-validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Loader2 as Loader2Icon,
  CheckCircle,
  Check as CheckIcon,
  UserCircle,
  Building2,
  Mail,
  CheckCheck,
  Scissors,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Create a flow testing logger helper for this component
const logFlow = (step: string, data?: any) => {
  console.log(`[FLOW TEST] ${step}`, data ? data : '');
};

// Client schema with enhanced validation
const clientSchema = z.object({
  inviteType: z.enum(['friend', 'salonOwner']).default('friend'),
  name: z.string().min(2, { message: 'Full name is required (minimum 2 characters)' }),
  phone: z.string()
    .min(10, { message: 'Valid phone number is required (10 digits minimum)' })
    .refine(val => /^[0-9()+\-.\s]+$/.test(val), { 
      message: 'Phone number can only contain digits, spaces, and these symbols: () + - .'
    }),
  email: z.string()
    .email({ message: 'Valid email address is required if provided' })
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal('')),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'You must accept the terms and conditions to continue'
    }),
  sponsorSalonId: z.number().optional(),
});

// Define the form values type
type ClientFormValues = z.infer<typeof clientSchema>;

// Interface for the invitation data
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

// Interface for salon data
interface Salon {
  id: number;
  name: string;
  ownerName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export default function ClientRegistrationPage() {
  const [location, navigate] = useLocation();
  
  // Extract invite hash from URL if present
  const inviteHash = location.includes('/invite/') 
    ? location.split('/invite/')[1]
    : null;
    
  // Extract salon ID from URL if present
  const salonIdParam = location.includes('/salon/') 
    ? location.split('/salon/')[1]
    : null;
    
  const salonId = salonIdParam ? parseInt(salonIdParam, 10) : undefined;
  
  // State management for address dialog and form submission
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressDialogShown, setAddressDialogShown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredClientId, setRegisteredClientId] = useState<number | null>(null);
  const [isExistingClient, setIsExistingClient] = useState(false);
  
  // We'll use a direct approach to the terms checkbox element
  const focusTermsCheckbox = () => {
    logFlow('Focusing terms checkbox - direct approach');
    // Immediate focus attempt without timeout
    const checkbox = document.getElementById('acceptTerms');
    if (checkbox) {
      logFlow('Terms checkbox found by ID, focusing immediately');
      checkbox.focus();
      checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      logFlow('Terms checkbox focused and scrolled into view');
    } else {
      // Extra logging for debugging
      logFlow('ERROR: Terms checkbox not found by ID on first attempt');
      // Try again with a very short delay as a fallback
      setTimeout(() => {
        const retryCheckbox = document.getElementById('acceptTerms');
        if (retryCheckbox) {
          logFlow('Terms checkbox found on retry');
          retryCheckbox.focus();
          retryCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          logFlow('CRITICAL ERROR: Terms checkbox not found even on retry');
        }
      }, 10);
    }
  };
  
  // Form definition with zod validation
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      inviteType: 'friend',
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
      acceptTerms: false,
      sponsorSalonId: salonId,
    },
  });
  
  // Contact validation hook for phone validation
  const { validateContact } = useContactValidation();
  
  // Load invitation data if invite hash is present
  const { 
    data: invitation,
    isLoading: invitationLoading,
  } = useQuery<Invitation>({
    queryKey: ['/api/invitations/hash', inviteHash],
    queryFn: async () => {
      if (!inviteHash) return null;
      
      const response = await fetch(`/api/invitations/hash/${inviteHash}`);
      if (!response.ok) {
        throw new Error('Failed to load invitation');
      }
      return response.json();
    },
    enabled: !!inviteHash,
  });
  
  // Load salon data if salon ID is present
  const { 
    data: salon,
    isLoading: salonLoading,
  } = useQuery<Salon>({
    queryKey: ['/api/salons', salonId],
    queryFn: async () => {
      if (!salonId) return null;
      
      const response = await fetch(`/api/salons/${salonId}`);
      if (!response.ok) {
        throw new Error('Failed to load salon information');
      }
      return response.json();
    },
    enabled: !!salonId,
  });
  
  // If invitation data is loaded, prefill the form
  useEffect(() => {
    if (invitation) {
      form.reset({
        ...form.getValues(),
        name: invitation.name || '',
        phone: invitation.phone || '',
        email: invitation.email || '',
        notes: invitation.notes || '',
        favoriteServices: invitation.favoriteServices || [],
        sponsorSalonId: invitation.salonId || salonId,
      });
    }
  }, [invitation, form, salonId]);
  
  // Function to handle phone validation - tracks validation state but doesn't affect form flow
  const handlePhoneValidation = (isValid: boolean) => {
    logFlow(`Phone validation ${isValid ? 'passed' : 'failed'}`);
    
    // Only show a toast for invalid phone numbers to help user correct them immediately
    if (!isValid) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
    }
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
    
    // Focus directly on terms checkbox using DOM ID
    focusTermsCheckbox();
  };
  
  // Handle form submission - IMPROVED with better error handling and debugging
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
      
      try {
        // Create the client with better error handling
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });
        
        // Ensure we can parse the response - wrap in try-catch to handle json parse errors
        let responseData;
        try {
          responseData = await clientResponse.json();
          console.log('Client registration response:', { status: clientResponse.status, data: responseData });
        } catch (jsonError) {
          console.error('Failed to parse response JSON:', jsonError);
          toast({
            title: 'Registration Error',
            description: 'Server response was invalid. Please try again.',
            variant: 'destructive',
          });
          return;
        }
        
        // Handle duplicate client scenario (HTTP 409 Conflict)
        if (clientResponse.status === 409 && responseData.status === 'duplicate') {
          console.log('Duplicate client detected:', responseData);
          
          // Show a toast about the duplicate account
          toast({
            title: 'Account Already Exists',
            description: responseData.message || `A client with this ${responseData.field} already exists.`,
            variant: 'default',
          });
          
          // Try to find existing client by the duplicate contact information
          let existingClientId: number | undefined;
          
          // Search for existing client with this phone or email
          const fieldValue = data[responseData.field as keyof ClientFormValues] as string;
          if (!fieldValue) {
            throw new Error(`Missing ${responseData.field} value for duplicate client lookup`);
          }
          
          try {
            const searchResponse = await fetch(`/api/clients?${responseData.field}=${encodeURIComponent(fieldValue)}`, {
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
                  try {
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
                  } catch (inviteError) {
                    console.warn('Failed to update invitation for existing client:', inviteError);
                  }
                }
                
                // Set registration as complete and store client ID for improved UX
                setRegistrationComplete(true);
                setIsExistingClient(true); // Flag this as an existing client for different UI messaging
                if (existingClientId) {
                  setRegisteredClientId(existingClientId);
                }
                
                // Redirect to existing client's dashboard after a longer delay
                // to show the success screen with helpful information
                setTimeout(() => {
                  navigate(`/client/${existingClientId}`);
                }, 2500);
                
                return;
              }
            }
          } catch (searchError) {
            console.error('Error searching for existing client:', searchError);
          }
          
          // If we can't find a matching client, show an error
          throw new Error(`A client with this ${responseData.field} already exists. Please use a different ${responseData.field} or contact support.`);
        }
        
        // Handle invalid/error response
        if (!clientResponse.ok) {
          throw new Error(`Failed to register client: ${responseData.error || JSON.stringify(responseData)}`);
        }
        
        // Handle successful client creation (HTTP 201 Created)
        const createdClient = responseData;
        console.log('Created client:', createdClient);
        
        // Update invitation status if we have an invitation ID
        if (invitation?.id) {
          try {
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
          } catch (inviteError) {
            console.warn('Error updating invitation after client creation:', inviteError);
          }
        }
        
        // Show success message
        toast({
          title: 'Registration Successful',
          description: 'Your account has been created successfully.',
          variant: 'default',
        });
        
        // Update registration state and store client ID
        setRegistrationComplete(true);
        
        const clientId = createdClient?.id;
        if (clientId) {
          setRegisteredClientId(clientId);
          console.log('Client created with ID:', clientId);
          
          // Redirect to client dashboard after a short delay (gives user time to read success message)
          setTimeout(() => {
            navigate(`/client/${clientId}`);
          }, 2500);
        } else {
          // Fallback if we don't have the client ID
          console.warn('No client ID available for redirection');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (fetchError) {
        console.error('Fetch error during client registration:', fetchError);
        toast({
          title: 'Registration Failed',
          description: fetchError instanceof Error ? fetchError.message : 'Network error occurred while registering',
          variant: 'destructive',
        });
      }
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

  // Enhanced success state with animation and better feedback
  if (registrationComplete) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-pink-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-green-100 shadow-md overflow-hidden">
              <div className="bg-green-50 py-4 px-6 border-b border-green-100">
                <div className="flex items-center">
                  <div className="bg-white p-3 rounded-full mr-4">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Registration Complete!</h2>
                    <p className="text-gray-600">
                      {isExistingClient 
                        ? 'Welcome back! Your existing account was found' 
                        : 'Your account has been created successfully'}
                    </p>
                  </div>
                </div>
              </div>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <h3 className="font-medium text-gray-800 mb-3">What's next?</h3>
                    {isExistingClient ? (
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">You'll be redirected to your existing dashboard</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">Your invitation has been linked to your account</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">Continue enjoying all member benefits</span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">You'll be redirected to your new dashboard</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">Browse services from your sponsoring salon</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">Invite your friends for special offers</span>
                        </li>
                      </ul>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center pt-2">
                    <div className="flex items-center space-x-2 bg-gray-50 py-2 px-4 rounded-full">
                      <Loader2Icon className="animate-spin h-4 w-4 text-pink-500" />
                      <span className="text-sm text-gray-600">Redirecting to your dashboard...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                                onValidationComplete={handlePhoneValidation}
                                clearField={() => form.setValue('phone', '')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Terms and Conditions Checkbox - Enhanced for visibility */}
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6 p-3 rounded-md border-2 border-pink-100 bg-pink-50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="acceptTerms"
                              name="acceptTerms"
                              className="h-5 w-5 mt-0.5"
                              // Using DOM reference directly rather than ref forwarding
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              I accept the <a href="/terms" target="_blank" className="text-pink-600 font-bold hover:underline">Terms and Conditions</a> of Ven Me, Baby!
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Required to complete registration
                            </FormDescription>
                            <FormMessage className="font-medium text-red-500"/>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* Submit Button */}
                    <div className="mt-6">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                        variant={isSubmitting ? "outline" : "default"}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            Processing Registration...
                          </>
                        ) : (
                          <>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Complete Registration
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Information Column */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to the VMB Network</CardTitle>
                <CardDescription>
                  A connection-driven personal gifting platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-pink-100 p-2 rounded-full">
                      <CheckCheck className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Personalized Service</h3>
                      <p className="text-sm text-gray-500">Unlock personalized recommendations from top salons.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-pink-100 p-2 rounded-full">
                      <Scissors className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Exclusive Offers</h3>
                      <p className="text-sm text-gray-500">Access to special promotions and member-only services.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-pink-100 p-2 rounded-full">
                      <Sparkles className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Gifting Economy</h3>
                      <p className="text-sm text-gray-500">Join a community that values personal connection and gifting.</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mt-6">
                    <p className="text-sm text-gray-700">
                      By joining Ven Me, Baby!, you're entering a network of salons and clients focused on authentic connections and personalized beauty experiences.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Address Collection Dialog */}
      <Dialog 
        open={showAddressDialog} 
        onOpenChange={setShowAddressDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Your Address</DialogTitle>
            <DialogDescription>
              Adding your address helps us provide more personalized service recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main St" />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State" maxLength={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Zip" 
                          maxLength={10} 
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numbers and hyphens
                            if (/^[\d-]*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            // Validate zip code format on blur
                            if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
                              toast({
                                title: "Invalid ZIP Code",
                                description: "Please use format 12345 or 12345-6789",
                                variant: "destructive"
                              });
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Format: 12345 or 12345-6789
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Any special requests or information you'd like to share" 
                      className="min-h-[80px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleLaterClick}
            >
              Later
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                try {
                  // Get the current form values
                  const formValues = form.getValues();
                  
                  // First, close the dialog and update state
                  setShowAddressDialog(false);
                  setAddressDialogShown(true);
                  document.body.setAttribute('data-address-shown', 'true');
                  
                  // Log that we're about to continue with form submission
                  logFlow('Address saved, continuing with form submission');
                  
                  // Give the dialog time to close before submitting
                  // This prevents UI glitches during form submission
                  setTimeout(() => {
                    form.handleSubmit(onSubmit)();
                  }, 100);
                } catch (error) {
                  console.error('Error in Save & Continue handler:', error);
                  toast({
                    title: 'Form Error',
                    description: 'There was a problem continuing with registration. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}