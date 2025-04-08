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
        socialMedia,
        type: "salon",
      };
      
      // Submit to API
      const response = await apiRequest("POST", "/api/salons", salonData);
      const result = await response.json();
      
      // Store the salon ID for redirection
      setSalonId(result.id);
      setShowSuccess(true);
      
      // Start countdown for auto-redirect
      let count = 5;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        
        if (count <= 0) {
          clearInterval(interval);
          setLocation(`/salon/${result.id}`);
        }
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your registration.",
        variant: "destructive",
      });
    }
  };
  
  const handleGoToDashboard = () => {
    if (salonId) {
      setLocation(`/salon/${salonId}`);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft p-8 mb-10">
        <h3 className="font-playfair font-bold text-2xl mb-6 text-center">Salon Registration</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="salonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salon Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
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
                  <FormLabel>Cell Phone</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="(XXX) XXX-XXXX" 
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Social Media (Optional)</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Instagram</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Facebook</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tiktok"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">TikTok</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pinterest"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Pinterest</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Conditional social media input fields */}
            {form.watch("instagram") && (
              <FormField
                control={form.control}
                name="instagramHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Handle</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Facebook Page</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>TikTok Handle</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Pinterest Handle</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="pt-4">
              <Button type="submit" className="w-full bg-[#FF92A5] hover:bg-[#E57C8E]">
                Register Salon
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
