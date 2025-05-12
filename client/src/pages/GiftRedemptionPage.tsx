import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { 
  Loader2, 
  Gift, 
  CheckCircle, 
  AlertTriangle, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  Building, 
  DollarSign, 
  MessageSquare,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useNavigationContext } from "../context/NavigationContext";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define the form schema for claiming a gift
const claimGiftSchema = z.object({
  phone: z.string().min(1, "Phone number is required").max(15),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type ClaimGiftFormValues = z.infer<typeof claimGiftSchema>;

interface Gift {
  id: number;
  senderId: number;
  senderName?: string;
  salonId: number;
  salonName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientId?: number;
  giftType: string;
  styleId?: number;
  styleName?: string;
  amount: number;
  message?: string;
  status: string;
  giftHash: string;
  createdAt: string;
  expiresAt?: string;
  redeemedAt?: string;
}

export default function GiftRedemptionPage() {
  const [, setLocation] = useLocation();
  const [isRedeemRoute, redeemParams] = useRoute("/redeem-gift/:giftHash");
  const [isAdminRoute, adminParams] = useRoute("/admin/gifts/:id");
  const { updateNavigation } = useNavigationContext();
  const [claimedGift, setClaimedGift] = useState<Gift | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  
  // Determine mode (admin view or redeem flow)
  const isAdminView = isAdminRoute && adminParams?.id;
  const isRedeemView = isRedeemRoute && redeemParams?.giftHash;
  
  // Get the appropriate parameter based on the route
  const giftHash = redeemParams?.giftHash;
  const giftId = adminParams?.id ? parseInt(adminParams.id, 10) : undefined;

  // Set up form for redemption flow
  const form = useForm<ClaimGiftFormValues>({
    resolver: zodResolver(claimGiftSchema),
    defaultValues: {
      phone: "",
      email: "",
    },
  });

  // Fetch the gift by hash or id depending on the route
  const { 
    data: gift, 
    isLoading: isLoadingGift,
    isError,
    error 
  } = useQuery({
    queryKey: isAdminView 
      ? [`/api/gifts/${giftId}`] 
      : [`/api/gifts/by-hash/${giftHash}`],
    queryFn: async () => {
      try {
        // Determine which API endpoint to use based on whether we're in admin view
        const url = isAdminView 
          ? `/api/gifts/${giftId}`
          : `/api/gifts/by-hash/${giftHash}`;
          
        console.log(`Fetching gift data from ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Gift not found or has already been redeemed");
          }
          throw new Error("Failed to fetch gift");
        }
        const data = await response.json();
        return data as Gift;
      } catch (error) {
        console.error("Error fetching gift:", error);
        throw error;
      }
    },
    enabled: !!giftHash || !!giftId,
    retry: 1,
  });

  // Update navigation header
  useEffect(() => {
    updateNavigation({
      title: isAdminView ? "Gift Details" : "Redeem Your Gift",
      showBackButton: true,
      backButtonDestination: isAdminView ? "/admin" : "/",
    });
  }, [updateNavigation, isAdminView]);

  // Check phone number for existing clients
  const checkPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const normalizedPhone = phone.replace(/\D/g, "");
      const response = await fetch(`/api/gifts/check-phone/${normalizedPhone}`);
      if (!response.ok) {
        throw new Error("Failed to check phone number");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.existingClient) {
        // If the client exists, pre-fill the email if available
        form.setValue("email", data.clientEmail || "");
        toast({
          title: "Welcome back!",
          description: "We found your account. Sign in to claim your gift.",
          variant: "default",
        });
      }
    },
  });

  // Handle phone number change to check for existing clients
  const handlePhoneChange = (value: string) => {
    if (value.replace(/\D/g, "").length >= 10) {
      checkPhoneMutation.mutate(value);
    }
  };

  // Redeem gift mutation
  const redeemGiftMutation = useMutation({
    mutationFn: async (formData: ClaimGiftFormValues) => {
      setIsRedeeming(true);
      const normalizedPhone = formData.phone.replace(/\D/g, "");
      
      // First check if this is an existing client
      try {
        const clientCheckResponse = await fetch(`/api/gifts/check-phone/${normalizedPhone}`);
        if (!clientCheckResponse.ok) {
          throw new Error("Failed to check client existence");
        }
        const clientCheckData = await clientCheckResponse.json();
        
        // If this is a new client, register them first
        if (!clientCheckData.existingClient && gift) {
          // Create a new client
          const newClientResponse = await fetch("/api/clients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: "New Client", // Default name
              phone: normalizedPhone,
              email: formData.email || null,
              isCurrentClient: true,
              salonId: gift.salonId,
              // [RULE: SponsorClientRelationship] Set the sponsor to the salon that sent the gift
              sponsor: gift.salonName || "VMB Limited",
              sponsorSalonId: gift.salonId,
              // [RULE: UniqueGiftTracking] Create a unique inviteHash for this client based on the gift
              inviteHash: `VMB-INV-GIFT-${giftHash}`,
              type: "client",
            })
          });
          
          if (!newClientResponse.ok) {
            throw new Error("Failed to create client");
          }
          
          const newClient = await newClientResponse.json();
          console.log("Created new client:", newClient);
          
          // Now update the gift with the new client ID
          const updateGiftResponse = await fetch(`/api/gifts/${gift.id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              recipientId: newClient.id,
              status: "redeemed"
            })
          });
          
          if (!updateGiftResponse.ok) {
            throw new Error("Failed to update gift status");
          }
          
          setClaimedGift({
            ...gift,
            recipientId: newClient.id,
            status: "redeemed",
            redeemedAt: new Date().toISOString(),
          });
          
          return newClient;
        } else if (gift) {
          // This is an existing client, just update the gift
          const clientId = clientCheckData.clientId;
          
          const updateGiftResponse = await fetch(`/api/gifts/${gift.id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              recipientId: clientId,
              status: "redeemed"
            })
          });
          
          if (!updateGiftResponse.ok) {
            throw new Error("Failed to update gift status");
          }
          
          setClaimedGift({
            ...gift,
            recipientId: clientId,
            status: "redeemed",
            redeemedAt: new Date().toISOString(),
          });
          
          return clientCheckData;
        }
        
        throw new Error("Failed to redeem gift");
      } finally {
        setIsRedeeming(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Gift redeemed successfully!",
        description: "Your gift has been added to your account.",
        variant: "default",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/gifts/by-hash/${giftHash}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${data.clientId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/gifts/received/${data.clientId}`] });
    },
    onError: (error) => {
      console.error("Error redeeming gift:", error);
      toast({
        title: "Failed to redeem gift",
        description: "There was an error redeeming your gift. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ClaimGiftFormValues) => {
    redeemGiftMutation.mutate(data);
  };

  // Redirect to client dashboard if already claimed
  const goToClientDashboard = () => {
    setLocation("/client-dashboard");
  };

  if (isLoadingGift) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Redeeming Gift</CardTitle>
            <CardDescription>Please wait while we locate your gift...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !gift) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Gift Not Found</CardTitle>
            <CardDescription>Sorry, we couldn't find your gift</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "The gift may have been redeemed already or the link is invalid."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setLocation("/")}>
              Go to Home Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Handle admin view for gift details
  if (isAdminView && gift) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-6 w-6 text-primary mr-2" />
              Gift Details
            </CardTitle>
            <CardDescription>
              Gift ID: {gift.id} - Status: 
              <Badge className={`ml-2 ${
                gift.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                  : gift.status === 'redeemed' 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
              }`}>
                {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md border">
              <h3 className="font-semibold text-lg mb-3">Gift Information</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <p className="font-medium">Value</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(gift.amount / 100)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">{new Date(gift.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {gift.redeemedAt && (
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    <div>
                      <p className="font-medium">Redeemed</p>
                      <p className="text-sm text-muted-foreground">{new Date(gift.redeemedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                
                {gift.message && (
                  <div className="flex items-start">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Message</p>
                      <p className="text-sm italic">"{gift.message}"</p>
                    </div>
                  </div>
                )}
                
                {gift.styleName && (
                  <div className="flex items-start">
                    <Gift className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Service</p>
                      <p className="text-sm text-muted-foreground">{gift.styleName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-md border">
                <h3 className="font-semibold mb-3">Sender</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">{gift.senderName || "Unknown"}</span>
                  </div>
                  {gift.senderPhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{formatPhoneNumber(gift.senderPhone)}</span>
                    </div>
                  )}
                  {gift.salonName && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{gift.salonName}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md border">
                <h3 className="font-semibold mb-3">Recipient</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">{gift.recipientName || "Unknown"}</span>
                  </div>
                  {gift.recipientPhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{formatPhoneNumber(gift.recipientPhone)}</span>
                    </div>
                  )}
                  {gift.recipientEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{gift.recipientEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            {gift.status === 'pending' && (
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this gift?")) {
                    // TODO: Implement gift cancellation
                    toast({
                      title: "Gift cancellation not implemented",
                      description: "This feature will be available soon",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Cancel Gift
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If gift is already redeemed
  if (gift.status === "redeemed" || claimedGift) {
    const redeemedGift = claimedGift || gift;
    
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Gift Redeemed!
            </CardTitle>
            <CardDescription>Your gift has been successfully claimed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md mb-4">
              <h3 className="font-semibold text-lg mb-1">{redeemedGift.styleName || "Style Card"}</h3>
              <p className="text-muted-foreground">Value: {formatCurrency(redeemedGift.amount / 100)}</p>
              {redeemedGift.message && (
                <p className="mt-2 italic text-sm">"{redeemedGift.message}"</p>
              )}
              <p className="mt-2 text-sm">From: {redeemedGift.senderName || "A VMB Client"}</p>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your gift has been added to your account. You can view it in your dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={goToClientDashboard}>
              Go to My Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Gift found but not yet redeemed
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="h-6 w-6 text-primary mr-2" />
            You've Received a Gift!
          </CardTitle>
          <CardDescription>Claim your gift by providing your contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="font-semibold text-lg mb-1">{gift.styleName || "Style Card"}</h3>
            <p className="text-muted-foreground">Value: {formatCurrency(gift.amount / 100)}</p>
            {gift.message && (
              <p className="mt-2 italic text-sm">"{gift.message}"</p>
            )}
            <p className="mt-2 text-sm">From: {gift.senderName || "A VMB Client"}</p>
            {gift.salonName && (
              <p className="mt-1 text-xs text-muted-foreground">At: {gift.salonName}</p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input 
                          placeholder="(555) 123-4567" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            handlePhoneChange(e.target.value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter your phone number to claim this gift
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input 
                          placeholder="you@example.com" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your email is optional but helps us keep in touch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRedeeming || form.formState.isSubmitting}
              >
                {isRedeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Claim My Gift
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}