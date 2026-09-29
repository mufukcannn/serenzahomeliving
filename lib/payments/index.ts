import { paytrPaymentProvider } from "@/lib/payments/paytr";
import { PaymentProvider, PaymentRequest, PaymentSession } from "@/lib/payments/types";
import { PaymentProviderName } from "@/types/ecommerce";

const providerRegistry: Partial<Record<PaymentProviderName, PaymentProvider>> = {
  paytr: paytrPaymentProvider
};

export function getPaymentProvider(name: string = process.env.PAYMENT_PROVIDER ?? "paytr") {
  const normalized = normalizePaymentProvider(name);
  return providerRegistry[normalized] ?? paytrPaymentProvider;
}

export function normalizePaymentProvider(name?: string): PaymentProviderName {
  return "paytr";
}

export function getCheckoutProviderSequence(requestedProvider?: string) {
  const primary = normalizePaymentProvider(requestedProvider ?? process.env.PAYMENT_PROVIDER);
  return [primary === "marketplace" ? "paytr" : primary];
}

export async function createPaymentSessionWithFallback(input: {
  requestedProvider?: string;
  request: PaymentRequest;
  onAttemptFailure?: (failure: { provider: PaymentProviderName; reason: string }) => Promise<void>;
}): Promise<PaymentSession> {
  const requestedProvider = normalizePaymentProvider(input.requestedProvider ?? process.env.PAYMENT_PROVIDER);
  const sequence = getCheckoutProviderSequence(requestedProvider);
  const failedProviders: Array<{ provider: PaymentProviderName; reason: string }> = [];
  const attemptedProviders: PaymentProviderName[] = [];

  for (const providerName of sequence) {
    const provider = getPaymentProvider(providerName);
    attemptedProviders.push(provider.name);

    try {
      const session = await provider.createPayment(input.request);
      return {
        ...session,
        fallback: {
          requestedProvider,
          attemptedProviders,
          failedProviders
        }
      };
    } catch (error) {
      const failure = {
        provider: provider.name,
        reason: error instanceof Error ? error.message : "Payment provider failed"
      };
      failedProviders.push(failure);
      await input.onAttemptFailure?.(failure);
    }
  }

  throw new Error("Aktif ödeme sağlayıcısı bulunamadı.");
}

export function listPaymentProviders() {
  return Object.values(providerRegistry).filter((provider): provider is PaymentProvider => Boolean(provider));
}
