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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Gift,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { formatPhoneNumber, cleanPhoneNumber } from '@/lib/utils';

// Simple logging helper (replaced test flow logger)
const logFlow = (step: string, data?: any) => {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`[ClientRegistration] ${step}`, data ? data : '');
  }
};

// Client schema with enhanced validation and more forgiving rules
const clientSchema = z.object({
  clientType: z.enum(['newClient', 'salonOwner', 'giftInvite']).default('newClient'),
  inviteType: z.enum(['friend', 'salonOwner']).default('friend'),
  name: z.string().min(2, { message: 'Full name is required (minimum 2 characters)' }),
  phone: z.string()
    .min(7, { message: 'Valid phone number is required' }) // More forgiving phone validation
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
  zipCode: z.string().optional().or(z.literal('')), // Allow empty string for zip code
  favoriteServices: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal('')),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'You must accept the terms and conditions to continue'
    }),
  sponsorSalonId: z.number().optional().nullable(), // Allow null value
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
  
  // State management for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredClientId, setRegisteredClientId] = useState<number | null>(null);
  const [isExistingClient, setIsExistingClient] = useState(false);
  // Note: Address dialog state variables removed
  
  // We'll use a direct approach to the terms checkbox element
  const focusTermsCheckbox = () => {
    console.log('Focusing terms checkbox - direct approach');
    // Immediate focus attempt without timeout
    const checkbox = document.getElementById('acceptTerms');
    if (checkbox) {
      console.log('Terms checkbox found by ID, focusing immediately');
      checkbox.focus();
      checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('Terms checkbox focused and scrolled into view');
    } else {
      // Extra logging for debugging
      console.log('ERROR: Terms checkbox not found by ID on first attempt');
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
  
  // Form definition with zod validation - enhanced for reliability
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientType: 'newClient',
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
    mode: 'onChange', // Validate fields as they change for better user feedback
  });
  
  // Removed redundant direct submit event listener to fix duplicate submissions
  
  // Contact validation hook for phone validation and gift checking
  const { 
    validateContact, 
    hasUnredeemedGift, 
    requiresAddress,
    validationResult
  } = useContactValidation();
  
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
  
  // Load all salons for the dropdown
  const {
    data: allSalons,
    isLoading: salonListLoading,
  } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    queryFn: async () => {
      const response = await fetch('/api/salons');
      if (!response.ok) {
        throw new Error('Failed to load salon list');
      }
      return response.json();
    },
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
  
  // Function to handle phone validation - checks if phone is valid and if it has unredeemed gifts
  const handlePhoneValidation = async (isValid: boolean, phoneNumber?: string) => {
    logFlow(`Phone validation ${isValid ? 'passed' : 'failed'}`);
    
    // Only show a toast for invalid phone numbers to help user correct them immediately
    if (!isValid) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }
    
    // If phone is valid, check for unredeemed gifts
    if (isValid && phoneNumber) {
      logFlow('Phone is valid, validating with server');
      
      try {
        // Call validateContact with context=registration to check for unredeemed gifts
        const result = await validateContact(phoneNumber);
        
        // If this phone has an unredeemed gift, show appropriate dialog
        if (result === 'has_unredeemed_gift') {
          logFlow('Phone has unredeemed gift');
          
          toast({
            title: 'Gift Available!',
            description: 'You have an unredeemed gift. Complete registration to redeem it.',
            variant: 'default',
          });
          
          // Check if we need to show the address dialog
          if (requiresAddress) {
            logFlow('Gift requires address information');
            // Address dialog functionality removed
            // Show toast notification instead
            toast({
              title: 'Gift Available!',
              description: 'Complete registration to view your gift in your dashboard.',
              variant: 'default',
            });
          }
        }
      } catch (error) {
        console.error('Error validating phone for gifts:', error);
      }
    }
  };
  
  // Address dialog handling removed as requested
  
  // Handle form submission - IMPROVED with better error handling and debugging
  const onSubmit = async (data: ClientFormValues) => {
    // Critical Debug: Show form submission occurred in browser console
    console.log('[CRITICAL DEBUG] CLIENT REGISTRATION FORM SUBMITTED', data);

    try {
      // Show a toast immediately so user knows form was submitted
      toast({
        title: 'Processing Registration',
        description: 'Please wait while we process your information...',
        variant: 'default',
      });

      logFlow('Form submission initiated');
      logFlow('Form data', {
        name: data.name,
        phone: data.phone,
        clientType: data.clientType,
        selectedSalonId: data.sponsorSalonId || 'Not selected',
        acceptTerms: data.acceptTerms,
        hasAddress: Boolean(data.address || data.city || data.state || data.zipCode)
      });
      
      // Clean up any leftover address state attributes
      if (document.body.hasAttribute('data-address-shown')) {
        logFlow('Cleaning up address state attributes');
        document.body.removeAttribute('data-address-shown');
      }
      
      // Skip address popup dialog as requested
      logFlow('Address dialog skipped per client request');
      
      // If client has an unredeemed gift, inform them they can add address in dashboard
      if (hasUnredeemedGift) {
        logFlow('Client has unredeemed gift - showing notification about adding address in dashboard');
        
        // Show toast to inform user they need to add address later
        toast({
          title: 'Complete Your Gift Profile',
          description: 'You can add your address later from your dashboard to receive your gift.',
          variant: 'default',
        });
      }
      
      logFlow('Address validation passed, continuing with form submission');
      
      setIsSubmitting(true);
      
      // Add client type and sponsor information
      const clientData = {
        ...data,
        phone: cleanPhoneNumber(data.phone), // Clean phone number to ensure consistent format
        type: data.clientType === 'salonOwner' ? 'salonOwner' : 'client', // Set type based on selection
        sponsor: data.sponsorSalonId 
          ? (allSalons?.find(s => s.id === data.sponsorSalonId)?.name || 'VMB LTD')
          : (salon?.name || invitation?.sponsor || 'VMB LTD'),
        sponsorSalonId: data.sponsorSalonId || salonId || invitation?.salonId || 1, // Default to VMB LTD (ID 1) if no salon
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
          
          // TODO: CRITICAL FEATURE - IMPLEMENT LOGIN PROMPT FLOW
          // This section needs to be enhanced with a comprehensive login prompt flow
          // that includes the following features:
          // 1. A dedicated dialog explaining that the phone number is already registered
          // 2. Login options (password, verification code, etc.)
          // 3. Account recovery options
          // 4. Option to continue with different phone number
          // 5. Help resources for users who don't recognize the account
          // This will be implemented during the next development phase
          
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
                
                // IMMEDIATE REDIRECT to existing client's dashboard - critical fix
                console.log('REDIRECTING TO EXISTING CLIENT DASHBOARD IMMEDIATELY:', existingClientId);
                logFlow('CRITICAL FIX: Redirecting to existing client dashboard immediately', existingClientId);
                
                // Show success toast for existing client
                toast({
                  title: 'Account Found!',
                  description: 'Your existing account was found. Redirecting to your dashboard...',
                  variant: 'default',
                });
                
                navigate(`/client/${existingClientId}`);
                
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
          
          // IMMEDIATE REDIRECT to client dashboard - critical fix for user flow
        console.log('REDIRECTING TO CLIENT DASHBOARD IMMEDIATELY:', clientId);
        logFlow('CRITICAL FIX: Redirecting to client dashboard immediately', clientId);
                
        // Enhanced toast message for better feedback on redirect
        toast({
          title: 'Registration Complete!',
          description: 'Your account has been created. Redirecting to your dashboard...',
          variant: 'default',
        });
                
        navigate(`/client/${clientId}`);
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
                    : 'Invite a friend or salon owner'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    {/* Client Type Selection */}
                    <FormField
                      control={form.control}
                      name="clientType"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <div className="mb-2 font-medium">I AM:</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center
                                ${field.value === 'newClient' 
                                  ? 'border-[#FF92A5] bg-pink-50' 
                                  : 'border-gray-200 hover:border-[#FF92A5] hover:bg-pink-50'}`}
                              onClick={() => field.onChange('newClient')}
                            >
                              <UserCircle className={`h-8 w-8 mb-2 ${field.value === 'newClient' ? 'text-[#FF92A5]' : 'text-gray-500'}`} />
                              <span className={`font-medium ${field.value === 'newClient' ? 'text-[#FF92A5]' : 'text-gray-700'}`}>
                                New Client
                              </span>
                            </div>
                            
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center
                                ${field.value === 'salonOwner' 
                                  ? 'border-[#FF92A5] bg-pink-50' 
                                  : 'border-gray-200 hover:border-[#FF92A5] hover:bg-pink-50'}`}
                              onClick={() => field.onChange('salonOwner')}
                            >
                              <Building2 className={`h-8 w-8 mb-2 ${field.value === 'salonOwner' ? 'text-[#FF92A5]' : 'text-gray-500'}`} />
                              <span className={`font-medium ${field.value === 'salonOwner' ? 'text-[#FF92A5]' : 'text-gray-700'}`}>
                                Salon Owner
                              </span>
                            </div>
                            
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center
                                ${field.value === 'giftInvite' 
                                  ? 'border-[#FF92A5] bg-pink-50' 
                                  : 'border-gray-200 hover:border-[#FF92A5] hover:bg-pink-50'}`}
                              onClick={() => field.onChange('giftInvite')}
                            >
                              <Gift className={`h-8 w-8 mb-2 ${field.value === 'giftInvite' ? 'text-[#FF92A5]' : 'text-gray-500'}`} />
                              <span className={`font-medium ${field.value === 'giftInvite' ? 'text-[#FF92A5]' : 'text-gray-700'}`}>
                                Gift/Invite
                              </span>
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
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
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
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <PhoneInputField 
                                placeholder="Enter your phone number" 
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
                    
                    {/* Salon Selection Dropdown */}
                    <FormField
                      control={form.control}
                      name="sponsorSalonId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Your Salon</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            defaultValue={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a salon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {salonListLoading ? (
                                <div className="p-2 text-center">Loading salons...</div>
                              ) : allSalons?.length ? (
                                <>
                                  {/* Sort to show VMB LTD first */}
                                  {allSalons
                                    .sort((a, b) => {
                                      // VMB LTD always comes first
                                      if (a.name === 'VMB LTD') return -1;
                                      if (b.name === 'VMB LTD') return 1;
                                      // Then alphabetical
                                      return a.name.localeCompare(b.name);
                                    })
                                    .map((salon) => (
                                      <SelectItem 
                                        key={salon.id} 
                                        value={salon.id.toString()}
                                      >
                                        {salon.name}
                                      </SelectItem>
                                    ))
                                  }
                                </>
                              ) : (
                                <div className="p-2 text-center">No salons available</div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the salon you're associated with, or VMB LTD if none
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Terms and Conditions Checkbox - CRITICALLY ENHANCED for visibility and reliability */}
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6 p-4 rounded-md border-2 border-pink-200 bg-pink-50 shadow-sm">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                console.log("Terms checkbox changed to:", checked);
                                field.onChange(checked);
                                // Set form value explicitly as a backup
                                form.setValue('acceptTerms', !!checked, { shouldValidate: true });
                              }}
                              onClick={(e) => {
                                console.log("Terms checkbox clicked");
                                // Log checkbox state after click to debug any issues
                                setTimeout(() => {
                                  const isChecked = form.getValues().acceptTerms;
                                  console.log("Terms checkbox state after click:", isChecked);
                                }, 10);
                              }}
                              id="acceptTerms"
                              name="acceptTerms"
                              className="h-6 w-6 mt-0.5 border-2 border-pink-400"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base font-medium cursor-pointer" onClick={() => {
                              // Handle label click as a backup for the checkbox
                              const currentValue = form.getValues().acceptTerms;
                              console.log("Terms label clicked, setting checkbox to:", !currentValue);
                              form.setValue('acceptTerms', !currentValue, { shouldValidate: true });
                            }}>
                              I accept the <a href="/terms" target="_blank" className="text-pink-600 font-bold hover:underline">Terms and Conditions</a> of Ven Me, Baby!
                            </FormLabel>
                            <FormDescription className="text-sm font-medium text-pink-800">
                              Required to complete registration
                            </FormDescription>
                            <FormMessage className="font-medium text-red-500 text-sm"/>
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
                        // Removed onClick handler to prevent duplicate submissions
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
      {/* Address dialog removed as requested */}
      
      <Footer />
    </div>
  );
}