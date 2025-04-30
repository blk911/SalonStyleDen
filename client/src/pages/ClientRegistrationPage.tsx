import React, { useState, useRef, useEffect } from 'react';
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
  CheckCircle as CheckCircleIcon,
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

// Client schema with basic validation
const clientSchema = z.object({
  inviteType: z.enum(['friend', 'salonOwner']).default('friend'),
  name: z.string().min(2, { message: 'Name is required' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  favoriteServices: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal('')),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
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
  const navigate = useNavigate();
  const [location] = useLocation();
  
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
  
  // Reference to the terms checkbox for direct focus
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  
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
                                onValidationComplete={handlePhoneValidation}
                                clearField={() => form.setValue('phone', '')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Terms and Conditions Checkbox */}
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              ref={termsCheckboxRef}
                              id="acceptTerms"
                              name="acceptTerms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm cursor-pointer">
                              I accept the <a href="/terms" className="text-pink-600 hover:underline">Terms and Conditions</a>
                            </FormLabel>
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
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Complete Registration'
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
                        <Input {...field} placeholder="Zip" maxLength={5} />
                      </FormControl>
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
                setShowAddressDialog(false);
                setAddressDialogShown(true);
                document.body.setAttribute('data-address-shown', 'true');
                form.handleSubmit(onSubmit)();
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