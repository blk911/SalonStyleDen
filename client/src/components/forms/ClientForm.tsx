import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPhoneNumber } from "@/lib/utils";
import VerificationModal from "@/components/shared/VerificationModal";
import SuccessModal from "@/components/shared/SuccessModal";

// Available salon services
const services = [
  "Classic Manicure",
  "Chic French Tips",
  "Luxe Gel Manicure",
  "Sculpted Acrylics",
  "Deluxe Spa Pedicure",
  "Bespoke Nail Art",
];

// Form schema with validation
const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().min(14, { message: "Please enter a valid phone number" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  isCurrentClient: z.enum(["yes", "no"]),
  notes: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  salonId: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

// Define types for salon data
interface SalonOption {
  id: number;
  name: string;
  ownerName: string;
}

export default function ClientForm() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [clientId, setClientId] = useState<number | null>(null);
  const [showSalonSelector, setShowSalonSelector] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch available salons
  const { data: salons, isLoading: isLoadingSalons } = useQuery<SalonOption[]>({
    queryKey: ['/api/salons'],
    queryFn: async () => {
      const response = await fetch('/api/salons');
      if (!response.ok) {
        throw new Error('Failed to fetch salons');
      }
      return response.json();
    }
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      isCurrentClient: "no",
      notes: "",
      favoriteServices: [],
      salonId: "",
    },
  });
  
  // Listen for changes to the "isCurrentClient" field
  const isCurrentClient = form.watch("isCurrentClient");
  
  // Update showSalonSelector when isCurrentClient changes
  useEffect(() => {
    setShowSalonSelector(isCurrentClient === "yes");
    
    // If not a current client, set default salon to "Ven Me, Baby! Lux"
    if (isCurrentClient === "no") {
      // Find the Ven Me, Baby Lux salon or use the first salon as fallback
      const defaultSalon = salons?.find(salon => salon.name.includes("Lux")) || salons?.[0];
      if (defaultSalon) {
        form.setValue("salonId", String(defaultSalon.id));
      }
    }
  }, [isCurrentClient, salons, form]);

  const onSubmit = (data: ClientFormValues) => {
    setIsVerifying(true);
  };

  const handleVerificationConfirm = async (data: ClientFormValues) => {
    setIsVerifying(false);
    
    try {
      // Ensure favorite services is always an array
      const favoriteServices = Array.isArray(data.favoriteServices) ? data.favoriteServices : [];
      
      // Find selected salon
      let salonId = data.salonId;
      if (!salonId) {
        // If no salon selected, use default Ven Me, Baby! Lux salon or first available
        const defaultSalon = salons?.find(salon => salon.name.includes("Lux")) || salons?.[0];
        if (defaultSalon) {
          salonId = String(defaultSalon.id);
        }
      }
      
      // Find salon name for display
      const selectedSalon = salons?.find(salon => String(salon.id) === salonId);
      
      // Transform the data for the API
      const clientData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        isCurrentClient: data.isCurrentClient === "yes",
        notes: data.notes || "",
        favoriteServices: favoriteServices,
        salonId: salonId ? parseInt(salonId) : undefined,
        salonName: selectedSalon?.name || "Ven Me, Baby! Lux",
        type: "client",
      };
      
      // Submit to API
      const response = await apiRequest("POST", "/api/clients", clientData);
      const result = await response.json();
      
      // Store the client ID for redirection
      setClientId(result.id);
      setShowSuccess(true);
      
      // Start countdown for auto-redirect
      let count = 5;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        
        if (count <= 0) {
          clearInterval(interval);
          setLocation(`/client/${result.id}`);
        }
      }, 1000);
      
      // If the client belongs to a salon, also post this client to that salon's page
      if (salonId) {
        try {
          // This would call an API endpoint to add the client to the salon's client list
          // For now, we'll just log this
          console.log(`Added client ${result.id} to salon ${salonId}`);
        } catch (err) {
          // If this fails, we won't show an error as the client was still created
          console.error("Failed to add client to salon:", err);
        }
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your registration.",
        variant: "destructive",
      });
    }
  };
  
  const handleGoToDashboard = () => {
    if (clientId) {
      setLocation(`/client/${clientId}`);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft p-8 mb-10">
        <h3 className="font-playfair font-bold text-2xl mb-6 text-center">Client Registration</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Full Name" />
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
                    <Input 
                      {...field} 
                      placeholder="Cell Phone" 
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
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
                  <FormControl>
                    <Input {...field} type="email" placeholder="Email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isCurrentClient"
              render={({ field }) => (
                <FormItem>
                  <div className="text-sm mb-1">Are you a current client?</div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Salon Selector - Only shown when "Yes" is selected for current client */}
            {showSalonSelector && (
              <FormField
                control={form.control}
                name="salonId"
                render={({ field }) => (
                  <FormItem>
                    <div className="text-sm mb-1">Select your current salon:</div>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a salon" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-40">
                            <SelectGroup>
                              {salons ? (
                                salons.slice(0, 5).map((salon) => (
                                  <SelectItem key={salon.id} value={String(salon.id)}>
                                    {salon.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  Loading salons...
                                </SelectItem>
                              )}
                            </SelectGroup>
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Notes (Optional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="favoriteServices"
              render={({ field }) => (
                <FormItem>
                  <div className="text-sm mb-1">My Favorite Services</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map((service) => {
                      // Check if service is in the current value array
                      const isSelected = field.value?.includes(service) || false;
                      
                      return (
                        <div
                          key={service}
                          className={`service-option flex items-center p-2 border ${isSelected ? 'border-[#FF92A5] bg-pink-50' : 'border-gray-200'} rounded-lg hover:border-[#FF92A5] cursor-pointer transition-colors`}
                          onClick={() => {
                            const currentValue = Array.isArray(field.value) ? field.value : [];
                            const newValue = isSelected
                              ? currentValue.filter(item => item !== service)
                              : [...currentValue, service];
                            
                            // Update form value
                            field.onChange(newValue);
                          }}
                        >
                          <FormControl>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentValue = Array.isArray(field.value) ? field.value : [];
                                const newValue = checked
                                  ? [...currentValue, service]
                                  : currentValue.filter(item => item !== service);
                                
                                // Update form value  
                                field.onChange(newValue);
                              }}
                              className="mr-2 data-[state=checked]:bg-pink-500 data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <span className="text-xs text-gray-700 cursor-pointer flex-grow">
                            {service}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <Button type="submit" className="w-full bg-[#FF92A5] hover:bg-[#E57C8E]">
                Register as Client
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      {/* Verification Modal */}
      {isVerifying && (
        <VerificationModal
          data={form.getValues()}
          type="client"
          onConfirm={handleVerificationConfirm}
          onEdit={() => setIsVerifying(false)}
        />
      )}
      
      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          type="client"
          countdown={countdown}
          onRedirect={handleGoToDashboard}
        />
      )}
    </>
  );
}
