import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 as Loader2Icon, CheckCircle, MapPin } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Simple logging helper (replaced test flow logger)
const logFlow = (step: string, data?: any) => {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`[ClientAddressRegistration] ${step}`, data ? data : '');
  }
};

// US states for dropdown
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

// Address schema
const addressSchema = z.object({
  address: z.string().min(1, { message: "Address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().min(5, { message: "Valid ZIP code is required" }).max(10),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export default function ClientAddressRegistrationPage() {
  const [, setLocation] = useLocation();
  const { clientId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // Fetch client data if clientId is provided
  const { data: client, isLoading } = useQuery({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await apiRequest('GET', `/api/clients/${clientId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      return response.json();
    },
    enabled: !!clientId,
  });

  // Initialize form with default values
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  // Update form when client data is loaded
  useEffect(() => {
    if (client) {
      form.setValue('address', client.address || '');
      form.setValue('city', client.city || '');
      form.setValue('state', client.state || '');
      form.setValue('zipCode', client.zipCode || '');
    }
  }, [client, form]);

  // Handle form submission
  const onSubmit = async (data: AddressFormValues) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client ID found. Please go back to registration.",
        variant: "destructive",
      });
      return;
    }

    logFlow('Address form submission initiated', data);
    setIsSubmitting(true);

    try {
      // Update client with address information
      const response = await apiRequest('PATCH', `/api/clients/${clientId}`, {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      });

      if (!response.ok) {
        throw new Error('Failed to update address information');
      }

      // Success
      logFlow('Address update successful');
      setSubmissionComplete(true);
      
      // Invalidate client query cache
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      
      toast({
        title: "Address Updated",
        description: "Your address information has been saved successfully!",
        variant: "default",
      });

      // Redirect to client dashboard after short delay
      setTimeout(() => {
        setLocation(`/client/${clientId}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating address:', error);
      logFlow('Address update failed', error);
      
      toast({
        title: "Update Failed",
        description: "There was a problem updating your address information. Please try again.",
        variant: "destructive",
      });
      
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching client data
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <Loader2Icon className="h-12 w-12 animate-spin text-pink-500" />
                  <p className="text-xl font-medium text-center">Loading your information...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show success state after form submission
  if (submissionComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <p className="text-2xl font-medium text-center">Registration Complete!</p>
                  <p className="text-center text-gray-500 max-w-xs">
                    Your address information has been updated successfully.
                  </p>
                  <div className="mt-4">
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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Address</CardTitle>
              <CardDescription>
                Please provide your address information to complete your registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Street Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main St, Apt 4B" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City and State side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="City" 
                              {...field} 
                            />
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map(state => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* ZIP Code */}
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ZIP Code" 
                            {...field} 
                            maxLength={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Saving Address...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <p className="text-sm text-gray-500 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Your information is safe with us
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}