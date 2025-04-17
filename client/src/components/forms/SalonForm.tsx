import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatPhoneNumber } from "@/lib/utils";
import VerificationModal from "@/components/shared/VerificationModal";
import SuccessModal from "@/components/shared/SuccessModal";

// Form schema with validation
const salonFormSchema = z.object({
  salonName: z.string().min(2, { message: "Salon name must be at least 2 characters" }),
  ownerName: z.string().min(2, { message: "Owner name must be at least 2 characters" }),
  phone: z.string().min(14, { message: "Please enter a valid phone number" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  state: z.string().min(2, { message: "Please select a state" }),
  zipCode: z.string().min(5, { message: "Please enter a valid ZIP code" }),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  pinterest: z.boolean().default(false),
  instagramHandle: z.string().optional(),
  facebookHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  pinterestHandle: z.string().optional(),
});

type SalonFormValues = z.infer<typeof salonFormSchema>;

export default function SalonForm() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [salonId, setSalonId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SalonFormValues>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: {
      salonName: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      instagram: false,
      facebook: false,
      tiktok: false,
      pinterest: false,
      instagramHandle: "",
      facebookHandle: "",
      tiktokHandle: "",
      pinterestHandle: "",
    },
  });

  const onSubmit = (data: SalonFormValues) => {
    setIsVerifying(true);
  };

  const handleVerificationConfirm = async (data: SalonFormValues) => {
    setIsVerifying(false);
    
    try {
      // Prepare social media data
      const socialMedia = [];
      if (data.instagram && data.instagramHandle) socialMedia.push({ platform: "instagram", handle: data.instagramHandle });
      if (data.facebook && data.facebookHandle) socialMedia.push({ platform: "facebook", handle: data.facebookHandle });
      if (data.tiktok && data.tiktokHandle) socialMedia.push({ platform: "tiktok", handle: data.tiktokHandle });
      if (data.pinterest && data.pinterestHandle) socialMedia.push({ platform: "pinterest", handle: data.pinterestHandle });
      
      // Transform the data for the API
      const salonData = {
        name: data.salonName,
        ownerName: data.ownerName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        socialMedia,
        type: "salon",
      };
      
      console.log("Submitting salon data:", salonData);
      
      // Submit to API
      const result = await apiRequest("/api/salons", {
        method: "POST",
        data: salonData
      });
      
      console.log("Salon created successfully:", result);
      
      // Ensure we have a valid ID before proceeding
      if (!result.id) {
        throw new Error("No salon ID received from server");
      }
      
      // Store the salon ID for redirection
      setSalonId(result.id);
      setShowSuccess(true);
      
      // Invalidate the salon queries to ensure fresh data on the dashboard
      import("@/lib/queryClient").then(({ queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
        queryClient.invalidateQueries({ queryKey: ['/api/salons', result.id.toString()] });
      });
      
      // Start countdown for auto-redirect
      let count = 5;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        
        if (count <= 0) {
          clearInterval(interval);
          console.log("Redirecting to salon dashboard:", `/salon/${result.id}`);
          setLocation(`/salon/${result.id}`.replace(/\/\//g, '/'));
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error creating salon:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your registration. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleGoToDashboard = () => {
    if (salonId) {
      setLocation(`/salon/${salonId}`.replace(/\/\//g, '/'));
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft p-8 mb-10">
        <h3 className="font-playfair font-bold text-2xl mb-6 text-center">Salon Registration</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Top line: Salon and Owner Names */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salonName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Salon Name" />
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
                    <FormControl>
                      <Input {...field} placeholder="Owner Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Second line: Phone */}
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
              
            {/* Third line: Email */}
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
            
            {/* Third line: Full address field */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Street Address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Fourth line: City, State, Zip */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="City" />
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
                    <FormControl>
                      <Input {...field} placeholder="State" />
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
                    <FormControl>
                      <Input {...field} placeholder="ZIP Code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Social Media section - using compact button grid like favorite services */}
            <div>
              <div className="text-sm mb-1 font-medium text-center">Social Media (Optional)</div>
              <div className="grid grid-cols-3 grid-rows-2 gap-1.5 mx-auto max-w-md">
                <div
                  onClick={() => form.setValue("instagram", !form.watch("instagram"))}
                  className={`${
                    form.watch("instagram") 
                      ? 'bg-[#FF92A5] text-white border-pink-300 border' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border'
                  } rounded-md py-1.5 px-1 text-center text-xs cursor-pointer transition-colors`}
                >
                  Instagram
                </div>
                
                <div
                  onClick={() => form.setValue("facebook", !form.watch("facebook"))}
                  className={`${
                    form.watch("facebook") 
                      ? 'bg-[#FF92A5] text-white border-pink-300 border' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border'
                  } rounded-md py-1.5 px-1 text-center text-xs cursor-pointer transition-colors`}
                >
                  Facebook
                </div>
                
                <div
                  onClick={() => form.setValue("tiktok", !form.watch("tiktok"))}
                  className={`${
                    form.watch("tiktok") 
                      ? 'bg-[#FF92A5] text-white border-pink-300 border' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border'
                  } rounded-md py-1.5 px-1 text-center text-xs cursor-pointer transition-colors`}
                >
                  TikTok
                </div>
                
                <div
                  onClick={() => form.setValue("pinterest", !form.watch("pinterest"))}
                  className={`${
                    form.watch("pinterest") 
                      ? 'bg-[#FF92A5] text-white border-pink-300 border' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border'
                  } rounded-md py-1.5 px-1 text-center text-xs cursor-pointer transition-colors`}
                >
                  Pinterest
                </div>
                
                <div
                  className="bg-gray-50 text-gray-400 rounded-md py-1.5 px-1 text-center text-xs border-gray-100 border"
                >
                  Twitter
                </div>
                
                <div
                  className="bg-gray-50 text-gray-400 rounded-md py-1.5 px-1 text-center text-xs border-gray-100 border"
                >
                  Snapchat
                </div>
              </div>
            </div>
            
            {/* Conditional social media input fields - in a compact grid */}
            <div className="grid grid-cols-2 gap-3">
              {form.watch("instagram") && (
                <FormField
                  control={form.control}
                  name="instagramHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Instagram Username" 
                          className="text-xs h-8 bg-pink-50 border-pink-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch("facebook") && (
                <FormField
                  control={form.control}
                  name="facebookHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Facebook Page" 
                          className="text-xs h-8 bg-pink-50 border-pink-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch("tiktok") && (
                <FormField
                  control={form.control}
                  name="tiktokHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="TikTok Username" 
                          className="text-xs h-8 bg-pink-50 border-pink-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch("pinterest") && (
                <FormField
                  control={form.control}
                  name="pinterestHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Pinterest Username" 
                          className="text-xs h-8 bg-pink-50 border-pink-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
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
          type="salon"
          onConfirm={handleVerificationConfirm}
          onEdit={() => setIsVerifying(false)}
        />
      )}
      
      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          type="salon"
          countdown={countdown}
          onRedirect={handleGoToDashboard}
        />
      )}
    </>
  );
}
