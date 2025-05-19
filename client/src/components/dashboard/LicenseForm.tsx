import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the license form schema with validation
const licenseSchema = z.object({
  licenseName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  licenseNumber: z.string().min(3, { message: 'License number required' }),
  licenseState: z.string().min(2, { message: 'Please select a state' }),
  verifyAccuracy: z.boolean().refine(val => val === true, {
    message: 'You must verify this information is accurate',
  }),
});

// License form values type
type LicenseFormValues = z.infer<typeof licenseSchema>;

// US States array for dropdown
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'District of Columbia'
];

interface LicenseData {
  licenseName?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseStatus?: string;
  licenseVerified?: boolean;
}

interface LicenseFormProps {
  salonId: number;
  licenseData?: LicenseData;
  onSubmit: (data: LicenseFormValues) => Promise<void>;
  onLater?: () => void;
}

export default function LicenseForm({ salonId, licenseData, onSubmit, onLater }: LicenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with existing license data if available
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      licenseName: licenseData?.licenseName || '',
      licenseNumber: licenseData?.licenseNumber || '',
      licenseState: licenseData?.licenseState || '',
      verifyAccuracy: false,
    },
  });

  // Handle form submission
  const handleSubmit = async (values: LicenseFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Error submitting license information:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If license data is available and verified, show the license information
  if (licenseData?.licenseNumber && licenseData?.licenseState) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-2">
          {licenseData.licenseStatus === 'verified' ? (
            <Badge className="bg-green-500">Verified</Badge>
          ) : licenseData.licenseStatus === 'rejected' ? (
            <Badge className="bg-red-500">Rejected</Badge>
          ) : (
            <Badge className="bg-yellow-500">Pending</Badge>
          )}
          <span className="ml-2 text-sm text-gray-600">
            {licenseData.licenseStatus === 'verified' 
              ? 'Your license has been verified' 
              : licenseData.licenseStatus === 'rejected'
              ? 'Your license verification was rejected'
              : 'Your license is pending verification'}
          </span>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <dl className="space-y-2 text-sm">
            <div className="flex">
              <dt className="w-32 font-medium text-gray-600">Name on License:</dt>
              <dd className="text-gray-800">{licenseData.licenseName}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-600">License Number:</dt>
              <dd className="text-gray-800">{licenseData.licenseNumber}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-600">State:</dt>
              <dd className="text-gray-800">{licenseData.licenseState}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  // If no license data, show the form
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">License Information</h3>
            <p className="text-xs text-gray-500 mb-3">
              To register as a SALON OWNER, a valid state license for your specialization IS REQUIRED.
              Enter your license info and submit. The verification of status typically takes 2-3 days; 
              often it's same day, but this is not guaranteed. During this period, you will be limited to 3 client invitations.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="licenseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name as listed on license</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name as shown on license" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter exactly as it appears on your license" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter exactly as it appears on your license (letters and numbers if shown)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licenseState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map((state) => (
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
              
              <FormField
                control={form.control}
                name="verifyAccuracy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I verify this information is accurate
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Enter License'}
                </Button>
                {onLater && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onLater}
                    disabled={isSubmitting}
                  >
                    Enter Later
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}