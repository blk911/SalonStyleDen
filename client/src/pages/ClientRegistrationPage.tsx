import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Loader2Icon, CheckCircleIcon } from 'lucide-react';

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
  const [, params] = useRoute('/client/register');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

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

  // When invitation data is loaded, populate the form
  useEffect(() => {
    if (invitation) {
      form.reset({
        ...form.getValues(),
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

  // Handle form submission
  const onSubmit = async (data: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Add sponsor information
      const clientData = {
        ...data,
        type: 'client',
        sponsor: salon?.name || invitation?.sponsor || 'Unknown',
        sponsorSalonId: data.sponsorSalonId || salonId || invitation?.salonId,
        isCurrentClient: true,
      };
      
      // Create the client
      let createdClient;
      try {
        createdClient = await apiRequest('/api/clients', { 
          method: 'POST',
          data: clientData 
        });
        
        // Update invitation status if we have an invitation ID
        if (invitation?.id) {
          await apiRequest(`/api/invitations/${invitation.id}`, {
            method: 'PATCH',
            data: { status: 'accepted' }
          });
        }
      } catch (error) {
        console.error('API error:', error);
        throw error;
      }
      
      // Show success message
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created successfully.',
        variant: 'default',
      });
      
      // Update registration state
      setRegistrationComplete(true);
      
      // Redirect to client dashboard after a short delay
      setTimeout(() => {
        navigate(`/client/${createdClient.id}`);
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" {...field} />
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
                              <Input placeholder="Your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} />
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
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input placeholder="ZIP Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional preferences or information you'd like to share" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
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
                      )}
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
    </div>
  );
}