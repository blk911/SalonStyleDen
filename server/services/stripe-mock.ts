import { log } from '../vite';

export interface MockPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface MockCustomer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface MockCheckoutSession {
  id: string;
  url: string;
  payment_status: 'unpaid' | 'paid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  customer?: string;
  metadata?: Record<string, string>;
}

class MockStripeService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    if (!this.isEnabled) {
      log('Stripe API keys not configured - using mock implementation', 'stripe');
    }
  }

  async createCustomer(data: { email: string; name?: string; phone?: string }): Promise<MockCustomer> {
    if (this.isEnabled) {
      throw new Error('Real Stripe implementation not available - using mock');
    }

    const customer: MockCustomer = {
      id: 'cus_mock' + Math.random().toString(36).substring(2, 10),
      email: data.email,
      name: data.name,
      phone: data.phone
    };

    log(`Mock Stripe: Created customer ${customer.id} for ${data.email}`, 'stripe');
    return customer;
  }

  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    customer?: string;
    metadata?: Record<string, string>;
  }): Promise<MockPaymentIntent> {
    if (this.isEnabled) {
      throw new Error('Real Stripe implementation not available - using mock');
    }

    const paymentIntent: MockPaymentIntent = {
      id: 'pi_mock' + Math.random().toString(36).substring(2, 10),
      amount: data.amount,
      currency: data.currency || 'usd',
      status: 'requires_payment_method',
      client_secret: 'pi_mock' + Math.random().toString(36).substring(2, 10) + '_secret_mock',
      metadata: data.metadata
    };

    log(`Mock Stripe: Created payment intent ${paymentIntent.id} for $${data.amount / 100}`, 'stripe');
    return paymentIntent;
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<MockPaymentIntent> {
    if (this.isEnabled) {
      throw new Error('Real Stripe implementation not available - using mock');
    }

    const paymentIntent: MockPaymentIntent = {
      id: paymentIntentId,
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: paymentIntentId + '_secret_mock'
    };

    log(`Mock Stripe: Confirmed payment intent ${paymentIntentId}`, 'stripe');
    return paymentIntent;
  }

  async createCheckoutSession(data: {
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
  }): Promise<MockCheckoutSession> {
    if (this.isEnabled) {
      throw new Error('Real Stripe implementation not available - using mock');
    }

    const session: MockCheckoutSession = {
      id: 'cs_mock' + Math.random().toString(36).substring(2, 10),
      url: 'https://checkout.stripe.com/mock-session',
      payment_status: 'unpaid',
      status: 'open',
      customer: 'cus_mock' + Math.random().toString(36).substring(2, 10),
      metadata: data.metadata
    };

    log(`Mock Stripe: Created checkout session ${session.id} for ${data.customer_email}`, 'stripe');
    return session;
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<MockPaymentIntent> {
    if (this.isEnabled) {
      throw new Error('Real Stripe implementation not available - using mock');
    }

    const paymentIntent: MockPaymentIntent = {
      id: paymentIntentId,
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: paymentIntentId + '_secret_mock'
    };

    log(`Mock Stripe: Retrieved payment intent ${paymentIntentId}`, 'stripe');
    return paymentIntent;
  }

  isStripeEnabled(): boolean {
    return this.isEnabled;
  }
}

export const mockStripe = new MockStripeService();
