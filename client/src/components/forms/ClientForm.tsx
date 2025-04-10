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
  salonName: z.string().optional(), // Added for verification display purposes
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
      console.log('Fetching salons for client form...');
      const response = await fetch('/api/salons');
      if (!response.ok) {
        console.error('Failed to fetch salons:', response.status, response.statusText);
        throw new Error('Failed to fetch salons');
      }
      const data = await response.json();
      console.log('Salon data loaded:', data);
      return data;
    },
    // Make sure this query runs on component mount and data is fresh
    staleTime: 0,
    refetchOnMount: true
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
      salonId: "loading", // Will be updated once salons are loaded
      salonName: "",
    },
  });
  
  // Listen for changes to the "isCurrentClient" field
  const isCurrentClient = form.watch("isCurrentClient");
  
  // When salons are loaded, set default salon
  useEffect(() => {
    if (salons && salons.length > 0 && form.getValues("salonId") === "loading") {
      // First try to find a salon with "Ven Me" and "Lux" in the name
      const venMeLuxSalon = salons.find(salon => 
        salon.name.includes("Ven Me") && salon.name.includes("Lux")
      );
      
      // Then try to find any salon with "Lux" in the name
      const luxSalon = salons.find(salon => salon.name.includes("Lux"));
      
      // Finally, fall back to Tiffany's salon or the first salon
      const tiffanySalon = salons.find(salon => 
        salon.name.includes("Tiffany") || salon.ownerName.includes("Tiffany")
      );
      
      // Choose the most appropriate default salon
      const defaultSalon = venMeLuxSalon || luxSalon || tiffanySalon || salons[0];
      
      if (defaultSalon) {
        form.setValue("salonId", String(defaultSalon.id));
        form.setValue("salonName", defaultSalon.name);
        console.log(`Set initial default salon to: ${defaultSalon.name} (ID: ${defaultSalon.id})`);
      }
    }
  }, [salons, form]);

  // Handle changes to isCurrentClient status
  useEffect(() => {
    // Update the visibility flag for the UI (now always visible but conditionally disabled)
    setShowSalonSelector(isCurrentClient === "yes");
    
    // If not a current client, set default salon to one with "Lux" in the name
    if (isCurrentClient === "no" && salons && salons.length > 0) {
      // First try to find a salon with "Ven Me" and "Lux" in the name
      const venMeLuxSalon = salons.find(salon => 
        salon.name.includes("Ven Me") && salon.name.includes("Lux")
      );
      
      // Then try to find any salon with "Lux" in the name
      const luxSalon = salons.find(salon => salon.name.includes("Lux"));
      
      // Finally, fall back to the first salon or Tiffany's salon if available
      const tiffanySalon = salons.find(salon => 
        salon.name.includes("Tiffany") || salon.ownerName.includes("Tiffany")
      );
      
      // Choose the most appropriate default salon
      const defaultSalon = venMeLuxSalon || luxSalon || tiffanySalon || salons[0];
      
      if (defaultSalon) {
        form.setValue("salonId", String(defaultSalon.id));
        form.setValue("salonName", defaultSalon.name);
        console.log(`Set default salon to: ${defaultSalon.name} (ID: ${defaultSalon.id})`);
      }
    }
  }, [isCurrentClient, salons, form]);

  const onSubmit = (data: ClientFormValues) => {
    // Find selected salon to include salon name in verification
    if (data.salonId && salons) {
      const selectedSalon = salons.find(salon => String(salon.id) === data.salonId);
      if (selectedSalon) {
        // Add the salon name to the form data for verification display
        const enrichedData = {
          ...data,
          salonName: selectedSalon.name
        };
        // Update the form values with the enriched data including salon name
        form.setValue("salonName", selectedSalon.name);
        console.log(`Added salon name to form data: ${selectedSalon.name}`);
      }
    } else if (salons && salons.length > 0) {
      // Default salon selection
      const defaultSalon = salons.find(salon => salon.name.includes("Ven Me")) || 
                          salons.find(salon => salon.name.includes("Lux")) || 
                          salons[0];
      if (defaultSalon) {
        form.setValue("salonName", defaultSalon.name);
        console.log(`Added default salon name to form data: ${defaultSalon.name}`);
      }
    }
    
    setIsVerifying(true);
  };

  const handleVerificationConfirm = async (data: ClientFormValues) => {
    setIsVerifying(false);
    
    try {
      // Ensure favorite services is always an array
      const favoriteServices = Array.isArray(data.favoriteServices) ? data.favoriteServices : [];
      
      // Find selected salon ID
      let salonId = data.salonId;
      
      // If no salon selected or invalid salon ID or is still loading, use default salon
      if (!salonId || salonId === "loading" || !salons?.some(salon => String(salon.id) === salonId)) {
        // Find the most appropriate default salon
        const venMeLuxSalon = salons?.find(salon => 
          salon.name.includes("Ven Me") && salon.name.includes("Lux")
        );
        const luxSalon = salons?.find(salon => salon.name.includes("Lux"));
        const tiffanySalon = salons?.find(salon => 
          salon.name.includes("Tiffany") || salon.ownerName.includes("Tiffany")
        );
        const defaultSalon = venMeLuxSalon || luxSalon || tiffanySalon || salons?.[0];
        
        if (defaultSalon) {
          salonId = String(defaultSalon.id);
          console.log(`Using default salon: ${defaultSalon.name} (ID: ${defaultSalon.id})`);
        }
      }
      
      // Find salon name for display
      const selectedSalon = salons?.find(salon => String(salon.id) === salonId);
      const salonName = selectedSalon?.name || "Ven Me, Baby! Lux";
      
      console.log(`Client will be associated with salon: ${salonName} (ID: ${salonId})`);
      
      // Transform the data for the API
      const clientData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        isCurrentClient: data.isCurrentClient === "yes",
        notes: data.notes || "",
        favoriteServices: favoriteServices,
        // Make sure we don't try to parse "loading" as an integer
        salonId: salonId && salonId !== "loading" ? parseInt(salonId) : undefined,
        salonName: salonName,
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
                  <div className="text-sm mb-1 font-medium">Are you a current client?</div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        console.log(`Client status changed to: ${value}`);
                        field.onChange(value);
                      }}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem 
                            value="yes" 
                            className={field.value === "yes" ? "border-pink-500 bg-pink-500 text-white" : ""}
                          />
                        </FormControl>
                        <FormLabel 
                          className={`font-semibold text-sm ${field.value === "yes" ? "text-pink-600" : "text-gray-600"}`}
                          onClick={() => field.onChange("yes")}
                        >
                          Yes - I visit a salon regularly
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem 
                            value="no" 
                            className={field.value === "no" ? "border-pink-500 bg-pink-500 text-white" : ""}
                          />
                        </FormControl>
                        <FormLabel 
                          className={`font-semibold text-sm ${field.value === "no" ? "text-pink-600" : "text-gray-600"}`}
                          onClick={() => field.onChange("no")}
                        >
                          No - New client
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  {field.value === "yes" && (
                    <p className="text-xs text-pink-500 mt-1">
                      Select your salon below
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Salon Selector - Always shown but with different styling based on isCurrentClient */}
            <FormField
              control={form.control}
              name="salonId"
              render={({ field }) => (
                <FormItem>
                  <div className="text-sm mb-1 font-medium">
                    {isCurrentClient === "yes" ? (
                      <span className="text-pink-600">Select your current salon:</span>
                    ) : (
                      <span className="text-gray-500">Default salon:</span>
                    )}
                  </div>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        console.log(`Salon dropdown selection changed to: ${value}`);
                        field.onChange(value);
                      }}
                      value={field.value}
                      disabled={isCurrentClient === "no"} // Disable if not a current client
                    >
                      <SelectTrigger 
                        className={`w-full transition-all duration-300 ${
                          isCurrentClient === "yes" 
                            ? "border-pink-500 border-2 bg-pink-50 shadow-md ring-2 ring-pink-200" 
                            : "border-gray-200 bg-gray-100 opacity-70"
                        }`}
                      >
                        <SelectValue placeholder={isCurrentClient === "yes" ? "Choose your salon" : "Auto-selected"} />
                        {isCurrentClient === "yes" && (
                          <span className="text-pink-500 animate-pulse">▼</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          <SelectGroup>
                            {isLoadingSalons ? (
                              <SelectItem value="loading" disabled>
                                Loading salon list...
                              </SelectItem>
                            ) : salons && salons.length > 0 ? (
                              salons.map((salon) => (
                                <SelectItem key={salon.id} value={String(salon.id)}>
                                  {salon.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                No salons available
                              </SelectItem>
                            )}
                          </SelectGroup>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {isCurrentClient === "yes" && (
                    <p className="text-xs text-pink-500 mt-1">
                      Please select the salon where you currently get services
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
