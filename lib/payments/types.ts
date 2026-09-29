import { PaymentStatus } from "@prisma/client";
import { CheckoutPaymentMethod, InstallmentOption, PaymentProviderName } from "@/types/ecommerce";

export type PaymentRequest = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: "TRY";
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  userIp?: string;
  billingAddress?: {
    line1: string;
    district: string;
    city: string;
    country?: string;
  };
  items?: Array<{
    title: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  installment?: number;
  successUrl: string;
  failUrl: string;
};

export type PaymentSession = {
  provider: PaymentProviderName;
  reference: string;
  sessionId?: string;
  token?: string;
  iframeUrl?: string;
  callbackUrl?: string;
  redirectUrl?: string;
  htmlForm?: string;
  status: "created" | "paid" | "failed";
  checkoutMode: "redirect" | "html_form" | "inline";
  expiresAt?: string;
  fraudSignals?: {
    requiresReview: boolean;
    reason?: string;
  };
  fallback?: {
    requestedProvider: PaymentProviderName;
    attemptedProviders: PaymentProviderName[];
    failedProviders: Array<{
      provider: PaymentProviderName;
      reason: string;
    }>;
  };
};

export type WebhookResult = {
  orderId: string;
  providerRef?: string;
  sessionId?: string;
  status: PaymentStatus;
  amount?: number;
  gatewayStatus?: string;
  failureReason?: string;
  paidAt?: Date;
  raw: unknown;
};

export type PaymentProviderCapabilities = {
  installments: boolean;
  guestCheckout: boolean;
  threeDSecure: boolean;
  savedCards: boolean;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  capabilities: PaymentProviderCapabilities;
  createPayment(request: PaymentRequest): Promise<PaymentSession>;
  verifyWebhook(payload: unknown, headers: Headers): Promise<WebhookResult>;
  getInstallments?(amount: number): Promise<InstallmentOption[]>;
}

export const allowedCheckoutPaymentMethods: CheckoutPaymentMethod[] = ["paytr"];
