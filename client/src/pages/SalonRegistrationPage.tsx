import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Loader2Icon, CheckCircleIcon } from 'lucide-react';
import { PhoneInputField } from '@/components/ui/PhoneInputField';

// Import necessary modules

// Create a salon registration schema
const salonSchema = z.object({
  name: z.string().min(2, { message: 'Salon name must be at least 2 characters' }),
  ownerName: z.string().min(2, { message: 'Owner name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  description: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type SalonFormValues = z.infer<typeof salonSchema>;

export default function SalonRegistrationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Initialize form
  const form = useForm<SalonFormValues>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      description: '',
      acceptTerms: false,
    },
  });
  
  // Listen for form reset event from PhoneInputField
  useEffect(() => {
    const handleFormReset = () => {
      // Reset the form to default values
      form.reset({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        description: '',
        acceptTerms: false,
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
  }, [form, toast]);

  // Handle form submission
  const onSubmit = async (data: SalonFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare salon data
      const salonData = {
        ...data,
        type: 'salon',
        accepted_terms: data.acceptTerms || false,
      };
      
      console.log('Submitting salon data:', salonData);
      
      // Create the salon
      const salonResponse = await fetch('/api/salons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salonData),
      });
      
      // Parse response JSON
      const responseData = await salonResponse.json();
      
      // Handle duplicate salon scenario
      if (salonResponse.status === 409) {
        throw new Error(`A salon with this ${responseData.field || 'information'} already exists. Please use different information or contact support.`);
      }
      
      // Handle invalid/error response
      if (!salonResponse.ok) {
        throw new Error(`Failed to register salon: ${JSON.stringify(responseData)}`);
      }
      
      // Handle successful salon creation
      const createdSalon = responseData;
      console.log('Created salon:', createdSalon);
      
      // Show success message
      toast({
        title: 'Registration Successful',
        description: 'Your salon has been registered successfully.',
        variant: 'default',
      });
      
      // Update registration state
      setRegistrationComplete(true);
      
      // Store salon ID for redirection
      const salonId = createdSalon?.id;
      console.log('Salon created with ID:', salonId);
      
      // Redirect to salon dashboard after a short delay
      setTimeout(() => {
        if (salonId) {
          navigate(`/dashboard/salon/${salonId}`);
        } else {
          // Fallback if we don't have the salon ID
          console.warn('No salon ID available for redirection');
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
                  Your salon has been registered successfully. Redirecting to your dashboard...
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
                <CardTitle>Salon Registration</CardTitle>
                <CardDescription>
                  Register your salon to start promoting your services
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
                            <FormLabel>Salon Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your salon name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Owner's full name" {...field} />
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
                              <Input placeholder="Contact email" {...field} />
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <PhoneInputField 
                                placeholder="Contact phone" 
                                value={field.value}
                                onChange={field.onChange}
                                onValidationComplete={(isValid, isRegistered) => {
                                  // We are now displaying this information in the dialog
                                  console.log(`Phone validation: isValid=${isValid}, isRegistered=${isRegistered}`);
                                }}
                                onEnterPress={() => {
                                  // Focus the address field when Enter is pressed
                                  const addressField = document.querySelector('input[name="address"]');
                                  if (addressField instanceof HTMLElement) {
                                    addressField.focus();
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
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Street address" 
                                id="address-field" 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const cityField = document.getElementById('city-field');
                                    if (cityField instanceof HTMLElement) {
                                      cityField.focus();
                                    }
                                  }
                                }}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="City" 
                                id="city-field"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const stateField = document.getElementById('state-field');
                                    if (stateField instanceof HTMLElement) {
                                      stateField.focus();
                                    }
                                  }
                                }}
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
                            <FormControl>
                              <Input 
                                placeholder="State" 
                                id="state-field"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const zipField = document.getElementById('zip-field');
                                    if (zipField instanceof HTMLElement) {
                                      zipField.focus();
                                    }
                                  }
                                }}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
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
                                placeholder="Zip code" 
                                id="zip-field"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const termsCheckbox = document.querySelector('input[name="acceptTerms"]');
                                    if (termsCheckbox instanceof HTMLElement) {
                                      termsCheckbox.focus();
                                    }
                                  }
                                }}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salon Description <span className="text-xs text-gray-500">(Press Ctrl+Enter to move to Terms)</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your salon" 
                              className="min-h-[100px]"
                              id="description-field"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  e.preventDefault();
                                  const termsCheckbox = document.querySelector('input[name="acceptTerms"]');
                                  if (termsCheckbox instanceof HTMLElement) {
                                    termsCheckbox.focus();
                                  }
                                }
                              }}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Terms Checkbox with Focus Effect */}
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => {
                        // Use component state for tracking focus
                        const [isFocused, setIsFocused] = useState(false);
                        
                        return (
                          <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors duration-200 hover:bg-pink-50/50 ${
                            isFocused ? 'bg-pink-50 border-pink-200 shadow-sm' : ''
                          }`}>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="terms-checkbox"
                                  name="acceptTerms"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  onFocus={() => setIsFocused(true)}
                                  onBlur={() => setIsFocused(false)}
                                  className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const submitButton = document.querySelector('button[type="submit"]');
                                      if (submitButton instanceof HTMLElement) {
                                        submitButton.focus();
                                      }
                                    }
                                  }}
                                />
                                <label htmlFor="terms-checkbox" className="cursor-pointer select-none">
                                  I accept the terms and conditions
                                </label>
                              </div>
                            </FormControl>
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
                        'Register Salon'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Info Column */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Why Register Your Salon?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Join our network of professional salons and connect with clients looking for your services.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Create and manage your salon profile</li>
                    <li>Promote your services to new clients</li>
                    <li>Send digital invitations to clients</li>
                    <li>Track customer engagement</li>
                    <li>Build your client base</li>
                  </ul>
                  <p className="pt-4 font-medium text-pink-600">
                    Once registered, you'll have access to the full suite of salon management tools!
                  </p>
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