import { useEffect, useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

const CheckoutForm = ({ amount, giftId }: { amount: number, giftId?: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message ?? "An unexpected error occurred.");
        setPaymentStatus('error');
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Handle successful payment and update gift status
        if (giftId) {
          await apiRequest("POST", "/api/activate-gift", { giftId });
        }
        
        setPaymentStatus('success');
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        
        // Redirect after successful payment
        setTimeout(() => {
          setLocation("/gifts");
        }, 2000);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage("An unexpected error occurred.");
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="mb-4">Thank you for your purchase. Your payment has been processed successfully.</p>
        <Button asChild>
          <Link href="/gifts">Return to Gifts</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Payment failed</h3>
            <p className="text-red-700 text-sm">{message}</p>
          </div>
        </div>
      )}
      
      <PaymentElement />
      
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" type="button" asChild>
          <Link href="/gifts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Link>
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(25.00); // Default amount
  const [giftId, setGiftId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, params] = useLocation();

  useEffect(() => {
    // Extract amount and giftId from URL query params if available
    const urlParams = new URLSearchParams(window.location.search);
    const amountParam = urlParams.get('amount');
    const giftParam = urlParams.get('giftId');
    
    if (amountParam) {
      const parsedAmount = parseFloat(amountParam);
      if (!isNaN(parsedAmount)) {
        setAmount(parsedAmount);
      }
    }
    
    if (giftParam) {
      setGiftId(giftParam);
    }

    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: amount,
          giftId: giftParam
        });
        
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("Failed to create payment intent:", err);
        setError("Could not initialize payment system. Please try again later.");
        toast({
          title: "Payment Error",
          description: "Could not initialize the payment system. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      setError("Payment system is not properly configured. Please contact support.");
      setIsLoading(false);
      return;
    }

    createPaymentIntent();
  }, [toast]);

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>
            Securely process your payment for the selected service
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3">Initializing payment...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-medium text-red-800 mb-1">Payment Error</h3>
              <p className="text-red-700">{error}</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/gifts">Return to Gifts</Link>
              </Button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm amount={amount} giftId={giftId} />
            </Elements>
          ) : null}
        </CardContent>
        
        <CardFooter className="flex flex-col items-start">
          <div className="text-sm text-muted-foreground">
            <p>Your payment is secured with Stripe. We do not store your card details.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}