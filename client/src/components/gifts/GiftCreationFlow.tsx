import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircleIcon, 
  ChevronRightIcon, 
  UserIcon,
  UserPlusIcon, 
  CreditCardIcon, 
  CalendarIcon,
  Loader2
} from "lucide-react";

interface GiftCreationFlowProps {
  clientId: number;
  salonId?: number;
  onComplete?: () => void;
}

interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  gifUrl?: string;
  featured?: boolean;
}

export default function GiftCreationFlow({ clientId, salonId, onComplete }: GiftCreationFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<string>("style");
  const [recipientData, setRecipientData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [personalMessage, setPersonalMessage] = useState("");

  // If salonId is not provided, we need to fetch the salon associated with the client
  // or default to Tiffany's salon (ID: 2) which is the sponsor
  const useSalonId = salonId || 2; // Default to Tiffany's salon if none specified
  
  // Fetch salon services
  const { data: salonServices, isLoading: isLoadingServices } = useQuery({
    queryKey: [`/api/salons/${useSalonId}/services`],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${useSalonId}/services`);
      if (!response.ok) {
        throw new Error("Failed to fetch salon services");
      }
      return response.json() as Promise<StyleOption[]>;
    },
    enabled: !!useSalonId, // Only fetch if we have a salonId
  });

  // Function to handle style selection
  const handleStyleSelect = (styleId: number) => {
    console.log(`Selected style ID: ${styleId}`);
    setSelectedStyleId(styleId);
    setStep("recipient");
  };

  // Function to handle recipient data submission
  const handleRecipientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientData.name || !recipientData.phone) {
      toast({
        title: "Missing information",
        description: "Please provide recipient name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    setStep("payment");
  };

  // Function to handle payment
  const handlePayment = () => {
    toast({
      title: "Payment Processing",
      description: "This will be connected to Stripe payment processing",
    });
    
    // For now, we'll just proceed to the confirmation
    setStep("confirm");
  };

  // Function to handle gift creation confirmation
  const handleConfirm = () => {
    if (onComplete) {
      onComplete();
    }
    
    toast({
      title: "Gift Created!",
      description: "Your gift has been successfully created",
    });
  };

  return (
    <div className="space-y-4">
      {/* Style Selection Step */}
      <Accordion
        type="single"
        defaultValue={step === "style" ? "style" : undefined}
        collapsible
        className="w-full"
      >
        <AccordionItem value="style" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 1
              </span>
              <span>Pick your style...</span>
            </div>
            {selectedStyleId && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              {isLoadingServices ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                  <span className="ml-2 text-gray-600">Loading salon services...</span>
                </div>
              ) : (
                <VmbStyleOptions 
                  salonId={useSalonId} 
                  onStyleSelect={handleStyleSelect}
                  clientId={clientId}
                  services={salonServices}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Recipient Information Step */}
      <Accordion
        type="single"
        defaultValue={step === "recipient" ? "recipient" : undefined}
        collapsible
        className="w-full"
        disabled={!selectedStyleId}
      >
        <AccordionItem value="recipient" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 2
              </span>
              <span>Recipient information</span>
            </div>
            {step === "payment" && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <form onSubmit={handleRecipientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input 
                      id="recipientName" 
                      placeholder="Enter name" 
                      value={recipientData.name}
                      onChange={(e) => setRecipientData({...recipientData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Recipient Phone</Label>
                    <Input 
                      id="recipientPhone" 
                      placeholder="Enter phone number" 
                      value={recipientData.phone}
                      onChange={(e) => setRecipientData({...recipientData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
                  <Input 
                    id="recipientEmail" 
                    placeholder="Enter email address" 
                    value={recipientData.email}
                    onChange={(e) => setRecipientData({...recipientData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Add a personal message to your gift"
                    className="min-h-[100px]"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Continue to Payment
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Payment Step */}
      <Accordion
        type="single"
        defaultValue={step === "payment" ? "payment" : undefined}
        collapsible
        className="w-full"
        disabled={step !== "payment" && step !== "confirm"}
      >
        <AccordionItem value="payment" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 3
              </span>
              <span>Payment</span>
            </div>
            {step === "confirm" && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gift Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Style ID:</span>
                      <span className="font-medium">{selectedStyleId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipient:</span>
                      <span className="font-medium">{recipientData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">$50.00</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-4">
                      In the full implementation, this will be connected to Stripe for payment processing.
                    </p>
                    
                    <Button 
                      onClick={handlePayment}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      Process Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Confirmation Step */}
      <Accordion
        type="single"
        defaultValue={step === "confirm" ? "confirm" : undefined}
        collapsible
        className="w-full"
        disabled={step !== "confirm"}
      >
        <AccordionItem value="confirm" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between pb-2 pt-2 px-3">
            <div className="flex items-center">
              <span className="bg-pink-100 text-pink-800 font-semibold px-2 py-0.5 rounded-full text-xs mr-2">
                STEP 4
              </span>
              <span>Confirmation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Gift Creation Successful!</h3>
                <p className="text-green-700 mb-6">
                  Your gift has been created and will be sent to {recipientData.name}.
                </p>
                
                <Button 
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}