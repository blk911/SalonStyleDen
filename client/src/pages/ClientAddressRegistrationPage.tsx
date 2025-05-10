import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCheck } from 'lucide-react';
// No need to import FlowLogger, we'll use console.log directly

// Form validation schema
const clientAddressFormSchema = z.object({
  address: z.string().min(3, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  zipCode: z.string().min(5, { message: 'Valid ZIP code is required' }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
});

type ClientAddressFormValues = z.infer<typeof clientAddressFormSchema>;

export default function ClientAddressRegistrationPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/client-address-registration/:clientId');
  const clientId = params?.clientId;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [client, setClient] = useState<any>(null);

  // Initialize form with default values
  const form = useForm<ClientAddressFormValues>({
    resolver: zodResolver(clientAddressFormSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      agreeToTerms: false
    }
  });

  // Fetch client data if clientId is provided
  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        try {
          const response = await fetch(`/api/clients/${clientId}`);
          if (response.ok) {
            const clientData = await response.json();
            setClient(clientData);
            
            // Populate form with existing data if available
            form.reset({
              address: clientData.address || '',
              city: clientData.city || '',
              state: clientData.state || '',
              zipCode: clientData.zipCode || '',
              agreeToTerms: false
            });
          } else {
            toast({
              title: 'Error',
              description: 'Failed to load client information',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error fetching client:', error);
          toast({
            title: 'Error',
            description: 'An unexpected error occurred',
            variant: 'destructive',
          });
        }
      };

      fetchClient();
    }
  }, [clientId, form, toast]);

  const onSubmit = async (data: ClientAddressFormValues) => {
    if (!clientId) {
      toast({
        title: 'Error',
        description: 'Client ID is missing',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    console.log(`Submitting address information for client ${clientId}`);
    // Use simple console.log for now since we're having FlowLogger issues
    console.log(`[FLOW] Submitting address information for client ${clientId}`);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Your address information has been updated',
          variant: 'default',
        });

        // Redirect to client dashboard
        setTimeout(() => {
          navigate(`/client/${clientId}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Update Failed',
          description: errorData.error || 'Failed to update your information',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Registration</CardTitle>
            <CardDescription>
              Please provide your address information to complete registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="agreeToTerms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the terms and conditions
                        </FormLabel>
                        <FormDescription>
                          You must agree to our terms to create an account
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-gray-500">
              This information helps us serve you better
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}