import { apiRequest } from './apiRequest';

export async function createPaymentIntent(amount: number, giftId?: number): Promise<{
  client_secret: string;
  payment_intent_id: string;
  status: string;
}> {
  const response = await apiRequest('/api/create-payment-intent', 'POST', {
    amount: amount * 100,
    currency: 'usd',
    metadata: {
      gift_id: giftId?.toString() || '',
      payment_type: 'gift_redemption'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

export async function confirmPayment(paymentIntentId: string): Promise<{
  payment_intent: any;
  status: string;
}> {
  const response = await apiRequest('/api/confirm-payment', 'POST', {
    payment_intent_id: paymentIntentId
  });

  if (!response.ok) {
    throw new Error('Failed to confirm payment');
  }

  return response.json();
}

export async function createCheckoutSession(data: {
  customer_email: string;
  line_items: Array<{
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
    };
    quantity: number;
  }>;
  mode: 'payment' | 'subscription';
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
}): Promise<{
  id: string;
  url: string;
  status: string;
}> {
  const response = await apiRequest('/api/create-checkout-session', 'POST', data);

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  return response.json();
}
