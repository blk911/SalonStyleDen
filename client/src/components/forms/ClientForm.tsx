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
import { useContactValidation } from "@/hooks/use-contact-validation";
import { ContactValidationDialog } from "@/components/ui/ContactValidationDialog";
import VerificationModal from "@/components/shared/VerificationModal";
import SuccessModal from "@/components/shared/SuccessModal";

// Available salon services - updated to match approved Ven Me, Baby! Style Options
const services = [
  "French Tips / Touch-Up",
  "Luxe Gel Manicure",
  "Sculpted Acrylics",
  "Glam Me! Custom Design",
  "Deluxe Spa Pedicure",
  "Nail Art Enhancements",
];

// Form schema with validation
const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  email: z.string().email({ message: "Please enter a valid email address" }).or(z.literal("")), // Allow empty email
  isCurrentClient: z.enum(["yes", "no"]).default("no"), // Add default value
  acceptTerms: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions" }),
  notes: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  salonId: z.string().optional(),
  salonName: z.string().optional(), // Added for verification display purposes
  sponsor: z.string().default("Ven Me, Baby! LTD"), // Sponsor with default
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

// Define types for salon data
interface SalonOption {
  id: number;
  name: string;
  ownerName: string;
}

interface ClientFormProps {
  initialData?: any;
  onSubmit?: (data: any) => void;
  onError?: (error: any) => void;
  salonId?: number;
}

export default function ClientForm({ 
  initialData, 
  onSubmit: externalSubmit, 
  onError: externalError,
  salonId: propSalonId 
}: ClientFormProps = {}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [clientId, setClientId] = useState<number | null>(null);
  const [showSalonSelector, setShowSalonSelector] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize enhanced contact validation hook
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validatedContact, setValidatedContact] = useState("");
  const {
    validationResult,
    validateContact,
    isValidating,
    validatedContactType,
    phoneExists,
    emailExists,
    getPhoneProps,
    getEmailProps,
    resetValidation
  } = useContactValidation({
    validateOnChange: false, // We'll validate manually during form submission
    validateOnBlur: false    // We'll validate manually during form submission
  });

  // Fetch available salons
  const { data: salons, isLoading: isLoadingSalons, error: salonsError } = useQuery<SalonOption[]>({
    queryKey: ['/api/salons'],
    queryFn: async () => {
      console.log('Fetching salons for client form...');
      try {
        const response = await fetch('/api/salons');
        if (!response.ok) {
          console.error('Failed to fetch salons:', response.status, response.statusText);
          // Return default fallback salons instead of throwing
          return [
            {
              id: 12,
              name: "Ven Me, Baby! LTD",
              ownerName: "Admin"
            },
            {
              id: 1, 
              name: "Tiffany 5280 Nails Studio",
              ownerName: "Tiffany"
            }
          ];
        }
        const data = await response.json();
        console.log('Salon data loaded:', data);
        return data;
      } catch (error) {
        console.error('Error fetching salons:', error);
        // Return default fallback salons
        return [
          {
            id: 12,
            name: "Ven Me, Baby! LTD",
            ownerName: "Admin"
          },
          {
            id: 1, 
            name: "Tiffany 5280 Nails Studio",
            ownerName: "Tiffany"
          }
        ];
      }
    },
    // Make sure this query runs on component mount and data is fresh
    staleTime: 0,
    refetchOnMount: true
  });

  // Set up form with initial data if provided via props
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      isCurrentClient: initialData?.isCurrentClient === true ? "yes" : "no",
      acceptTerms: initialData?.acceptTerms || false,
      notes: initialData?.notes || "",
      favoriteServices: initialData?.favoriteServices || [],
      salonId: initialData?.salonId ? String(initialData.salonId) : 
               (propSalonId ? String(propSalonId) : "loading"), // Use prop salonId or initialData salonId if available
      salonName: initialData?.salonName || "",
      sponsor: initialData?.sponsor || "Ven Me, Baby! LTD", // Default sponsor
    },
  });

  // Listen for changes to the "isCurrentClient" field
  const isCurrentClient = form.watch("isCurrentClient");
  
  // Apply initialData from props when it changes
  useEffect(() => {
    if (initialData) {
      // Update the form with initial data
      if (initialData.name) form.setValue("name", initialData.name);
      if (initialData.phone) form.setValue("phone", initialData.phone);
      if (initialData.email) form.setValue("email", initialData.email);
      if (initialData.isCurrentClient !== undefined) {
        form.setValue("isCurrentClient", initialData.isCurrentClient === true ? "yes" : "no");
      }
      if (initialData.notes) form.setValue("notes", initialData.notes);
      if (initialData.favoriteServices) form.setValue("favoriteServices", initialData.favoriteServices);
      if (initialData.salonId) form.setValue("salonId", String(initialData.salonId));
      if (initialData.salonName) form.setValue("salonName", initialData.salonName);
      if (initialData.sponsor) form.setValue("sponsor", initialData.sponsor);
      
      console.log("Applied initial form data:", initialData);
    }
    
    // If a salon ID was passed via props, prioritize it over any other values
    if (propSalonId) {
      form.setValue("salonId", String(propSalonId));
      console.log(`Applied salon ID from props: ${propSalonId}`);
    }
  }, [initialData, propSalonId, form]);

  // When salons are loaded, set default salon
  useEffect(() => {
    if (salons && salons.length > 0 && form.getValues("salonId") === "loading") {
      // First try to find a salon with "Ven Me" in the name
      const venMeSalon = salons.find(salon => 
        salon.name.includes("Ven Me")
      );

      // Then try to find a salon with "VMB" in the name
      const vmbSalon = salons.find(salon => 
        salon.name.includes("VMB")
      );

      // Then try to find any salon with "Lux" in the name
      const luxSalon = salons.find(salon => 
        salon.name.includes("Lux")
      );

      // Finally, fall back to Tiffany's salon or the first salon
      const tiffanySalon = salons.find(salon => 
        salon.name.includes("Tiffany") || salon.ownerName.includes("Tiffany")
      );

      // Choose the most appropriate default salon - prioritize Ven Me, Baby! LTD
      const defaultSalon = venMeSalon || vmbSalon || luxSalon || tiffanySalon || salons[0];

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

    // If not a current client, set default salon to Ven Me, Baby! LTD
    if (isCurrentClient === "no" && salons && salons.length > 0) {
      // First try to find a salon with "Ven Me" in the name - highest priority
      const venMeSalon = salons.find(salon => 
        salon.name.includes("Ven Me")
      );

      // Then try to find a salon with "VMB" in the name
      const vmbSalon = salons.find(salon => 
        salon.name.includes("VMB")
      );

      // Then try to find a salon with both "Ven Me" and "Lux" in the name
      const venMeLuxSalon = salons.find(salon => 
        salon.name.includes("Ven Me") && salon.name.includes("Lux")
      );

      // Then try to find any salon with "Lux" in the name
      const luxSalon = salons.find(salon => salon.name.includes("Lux"));

      // Finally, fall back to the first salon or Tiffany's salon if available
      const tiffanySalon = salons.find(salon => 
        salon.name.includes("Tiffany") || salon.ownerName.includes("Tiffany")
      );

      // Choose the most appropriate default salon - ensure Ven Me, Baby! LTD is top priority
      const defaultSalon = venMeSalon || vmbSalon || venMeLuxSalon || luxSalon || tiffanySalon || salons[0];

      if (defaultSalon) {
        form.setValue("salonId", String(defaultSalon.id));
        form.setValue("salonName", defaultSalon.name);
        console.log(`Set default salon to: ${defaultSalon.name} (ID: ${defaultSalon.id})`);
      }
    }
  }, [isCurrentClient, salons, form]);

  const handleFormSubmit = async (data: ClientFormValues) => {
    // Check if we're using the external submit handler provided via props
    if (externalSubmit) {
      // For external mode, directly call the provided handler
      try {
        // Transform the form data to match the expected format
        const clientData = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          isCurrentClient: data.isCurrentClient === "yes",
          notes: data.notes || "",
          favoriteServices: Array.isArray(data.favoriteServices) ? data.favoriteServices : [],
          salonId: propSalonId || (data.salonId && data.salonId !== "loading" ? parseInt(data.salonId) : undefined),
          type: "client"
        };
        
        // Call the external submit handler
        await externalSubmit(clientData);
      } catch (error) {
        // Call external error handler if provided, otherwise use toast
        if (externalError) {
          externalError(error);
        } else {
          toast({
            title: "Registration Error",
            description: error instanceof Error ? error.message : "Failed to complete registration",
            variant: "destructive"
          });
        }
      }
      return;
    }
    
    // Default internal flow when no external handler is provided
    // Check if phone exists in database
    setValidatedContact(data.phone);
    const phoneResult = await validateContact(data.phone);
    
    if (phoneResult === 'registered') {
      setShowValidationDialog(true);
      console.log("Contact validation failed: Phone already exists");
      return; // Stop form submission
    }
    
    // If email is provided, check if it exists
    if (data.email) {
      setValidatedContact(data.email);
      const emailResult = await validateContact(data.email);
      
      if (emailResult === 'registered') {
        setShowValidationDialog(true);
        console.log("Contact validation failed: Email already exists");
        return; // Stop form submission
      }
    }

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
      // Default salon selection - prioritize Ven Me, Baby! LTD
      const defaultSalon = salons.find(salon => salon.name.includes("Ven Me")) || 
                          salons.find(salon => salon.name.includes("VMB")) || 
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
        // Find the most appropriate default salon - prioritize Ven Me, Baby! LTD
        const venMeSalon = salons?.find(salon => 
          salon.name.includes("Ven Me")
        );
        const vmbSalon = salons?.find(salon => 
          salon.name.includes("VMB")
        );
        const venMeLuxSalon = salons?.find(salon => 
          salon.name.includes("Ven Me") && salon.name.includes("Lux")
        );
        const luxSalon = salons?.find(salon => salon.name.includes("Lux"));
        const tiffanySalon = salons?.find(salon => 
          salon.name.includes("Tiffany") || salon.ownerName.includes("Tiffany")
        );
        const defaultSalon = venMeSalon || vmbSalon || venMeLuxSalon || luxSalon || tiffanySalon || salons?.[0];

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
        accepted_terms: data.acceptTerms || false, // Use snake_case to match database
        notes: data.notes || "",
        favoriteServices: favoriteServices,
        // Make sure we don't try to parse "loading" as an integer
        salonId: salonId && salonId !== "loading" ? parseInt(salonId) : undefined,
        salonName: salonName,
        sponsor: data.sponsor || "Ven Me, Baby! LTD", // Use form data or default
        type: "client",
      };

      // Submit to API
      const result = await apiRequest("/api/clients", {
        method: "POST",
        data: clientData
      });

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
          setLocation(`/client/${result.id}`.replace(/\/\//g, '/'));
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
      setLocation(`/client/${clientId}`.replace(/\/\//g, '/'));
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft p-8 mb-10">
        <h3 className="font-playfair font-bold text-2xl mb-6 text-center">Client Registration</h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Top line: Name and Cell Phone in a row */}
            <div className="grid grid-cols-2 gap-4">
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
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Cell Phone (XXX-XXX-XXXX)" 
                          className={`${phoneExists ? "border-red-500" : ""} ${field.value && validationResult === 'registered' && validatedContactType === 'phone' ? "border-red-500" : ""}`}
                          onChange={(e) => {
                            // Use the enhanced phone formatter from our hook
                            const phoneProps = getPhoneProps(field.value);
                            const formatted = phoneProps.onChange(e);
                            field.onChange(formatted);
                          }}
                          onBlur={async (e) => {
                            field.onBlur();
                            const cleaned = field.value.replace(/\D/g, '');
                            if (cleaned.length === 10) {
                              console.log("Special test case detected on blur for phone:", cleaned);
                              setValidatedContact(field.value);
                              // Validate on blur only when we have a complete phone number
                              const result = await validateContact(field.value);
                              if (result === 'registered') {
                                setShowValidationDialog(true);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      {validationResult === 'registered' && validatedContactType === 'phone' && !showValidationDialog && (
                        <p className="text-xs text-red-500 mt-1">
                          This phone number is already registered
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Next line: Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="Email" 
                        className={`${emailExists ? "border-red-500" : ""} ${field.value && validationResult === 'registered' && validatedContactType === 'email' ? "border-red-500" : ""}`}
                        onChange={(e) => {
                          // Use enhanced email props from our hook
                          const emailProps = getEmailProps(field.value);
                          const value = emailProps.onChange(e);
                          field.onChange(value);
                        }}
                        onBlur={async (e) => {
                          field.onBlur();
                          
                          // Only validate on blur if the field has a valid-looking email
                          const value = e.target.value;
                          if (value && value.includes('@') && value.includes('.') && 
                              value.indexOf('@') < value.lastIndexOf('.')) {
                            console.log("Special test case detected on blur for email:", value);
                            setValidatedContact(value);
                            // Validate on blur when email format looks valid
                            const result = await validateContact(value);
                            if (result === 'registered') {
                              setShowValidationDialog(true);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    {validationResult === 'registered' && validatedContactType === 'email' && !showValidationDialog && (
                      <p className="text-xs text-red-500 mt-1">
                        This email is already registered
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                        >
                          Yes! My Ven Me, Baby! Salon is:
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
                        >
                          No! SIGN ME UP!!
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  {/* No text guidance needed here */}
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
                      <span className="text-pink-600"></span>
                    ) : (
                      <span className="text-gray-500"></span>
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
                              // Prioritize "Ven Me, Baby! LTD" at the top of the list
                              [
                                // First display any Ven Me, Baby! salons
                                ...salons
                                  .filter(salon => 
                                    salon.name.includes("Ven Me") || 
                                    salon.name.includes("VMB"))
                                  .map((salon) => (
                                    <SelectItem 
                                      key={salon.id} 
                                      value={String(salon.id)}
                                      className="font-semibold text-pink-600 bg-pink-50"
                                    >
                                      ★ {salon.name}
                                    </SelectItem>
                                  )),
                                // Then display all other salons
                                ...salons
                                  .filter(salon => 
                                    !(salon.name.includes("Ven Me") || 
                                      salon.name.includes("VMB")))
                                  .map((salon) => (
                                    <SelectItem key={salon.id} value={String(salon.id)}>
                                      {salon.name}
                                    </SelectItem>
                                  ))
                              ]
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
                  <div className="text-sm mb-1 font-medium text-center">Favorite Services</div>
                  {/* Small buttons: exactly 3×2 grid for compact display */}
                  <div className="grid grid-cols-3 grid-rows-2 gap-1.5 mx-auto max-w-md">
                    {services.map((service, index) => {
                      // Only show first 6 services to maintain the 3×2 grid
                      if (index >= 6) return null;

                      // Check if service is in the current value array
                      const isSelected = field.value?.includes(service) || false;

                      return (
                        <div
                          key={service}
                          onClick={() => {
                            const currentValue = Array.isArray(field.value) ? field.value : [];
                            const newValue = isSelected
                              ? currentValue.filter(item => item !== service)
                              : [...currentValue, service];
                            field.onChange(newValue);
                          }}
                          className={`${
                            isSelected 
                              ? 'bg-[#FF92A5] text-white border-pink-300 border' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border'
                          } rounded-md py-1.5 px-1 text-center text-xs cursor-pointer transition-colors`}
                        >
                          {service}
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4 mb-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      I accept the <a href="/terms" target="_blank" className="text-pink-600 hover:underline">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-pink-600 hover:underline">Privacy Policy</a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <Button type="submit" className="w-full bg-[#FF92A5] hover:bg-[#E57C8E]">
                Sign me up! Ven Me, Baby!
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

      {/* Contact Validation Dialog */}
      <ContactValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        errorField={validatedContactType === 'unknown' ? '' : validatedContactType}
        errorMessage={validatedContactType === 'phone' 
          ? "This phone number is already registered. Please try a different one." 
          : "This email is already registered. Please use a different one."}
        onClose={resetValidation}
      />
    </>
  );
}