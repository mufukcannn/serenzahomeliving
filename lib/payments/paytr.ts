import crypto from "crypto";
import { PaymentProvider } from "@/lib/payments/types";
import { resolveIntegrationConfig } from "@/lib/integrations/settings";

const paytrTokenUrl = "https://www.paytr.com/odeme/api/get-token";
const paytrIframeBaseUrl = "https://www.paytr.com/odeme/guvenli";

export const paytrPaymentProvider: PaymentProvider = {
  name: "paytr",
  capabilities: {
    installments: true,
    guestCheckout: true,
    threeDSecure: true,
    savedCards: false
  },
  async createPayment(request) {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const integration = await resolveIntegrationConfig("payment", "paytr");
    const testMode = integration.mode === "live" ? "0" : "1";
    const credentials = await getPaytrCredentials();
    if (!credentials.complete && testMode === "1") {
      const origin = getLocalTestOrigin(appUrl);
      const token = `test-${request.orderId}-${Date.now()}`;
      return {
        provider: "paytr",
        reference: request.orderId,
        sessionId: token,
        token,
        iframeUrl: `${origin}/api/payment/paytr/test-frame?orderId=${encodeURIComponent(request.orderId)}`,
        callbackUrl: process.env.PAYTR_CALLBACK_URL || `${origin}/api/payment/webhook/paytr`,
        status: "created",
        checkoutMode: "inline",
        expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        fraudSignals: {
          requiresReview: request.amount >= 50000,
          reason: request.amount >= 50000 ? "High value PayTR order" : undefined
        }
      };
    }
    if (!credentials.complete) throw new Error(`${credentials.missing[0]} is required`);
    const { merchantId, merchantKey, merchantSalt } = credentials;
    const config = integration.config as Record<string, unknown>;
    const successUrl = String(config.successUrl || process.env.PAYTR_SUCCESS_URL || `${appUrl}/order-success`);
    const failUrl = String(config.failUrl || process.env.PAYTR_FAIL_URL || `${appUrl}/payment/failed`);
    const callbackUrl = String(config.callbackUrl || process.env.PAYTR_CALLBACK_URL || `${appUrl}/api/payment/webhook/paytr`);
    const debugOn = process.env.PAYTR_DEBUG_ON === "0" ? "0" : "1";
    const userIp = request.userIp || process.env.PAYTR_TEST_USER_IP || "127.0.0.1";
    const paymentAmount = Math.round(request.amount * 100).toString();
    const noInstallment = "0";
    const maxInstallment = "9";
    const currency = "TL";
    const userBasket = Buffer.from(
      JSON.stringify((request.items ?? []).map((item) => [item.title, item.unitPrice.toFixed(2), item.quantity]))
    ).toString("base64");
    const merchantOid = request.orderId;
    const hashStr = `${merchantId}${userIp}${merchantOid}${request.customer.email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = crypto.createHmac("sha256", merchantKey).update(hashStr + merchantSalt).digest("base64");

    const form = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: request.customer.email,
      payment_amount: paymentAmount,
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: debugOn,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: request.customer.name,
      user_address: request.billingAddress?.line1 ?? "-",
      user_phone: request.customer.phone ?? "0000000000",
      merchant_ok_url: withQuery(successUrl, {
        orderId: request.orderId,
        orderNumber: request.orderNumber
      }),
      merchant_fail_url: withQuery(failUrl, {
        orderId: request.orderId,
        provider: "paytr"
      }),
      timeout_limit: "30",
      currency,
      test_mode: testMode,
      lang: "tr"
    });

    const response = await fetch(paytrTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form
    });
    const payload = (await response.json()) as { status?: string; token?: string; reason?: string };
    if (!response.ok || payload.status !== "success" || !payload.token) {
      throw new Error(payload.reason ?? "PayTR token üretilemedi.");
    }

    return {
      provider: "paytr",
      reference: merchantOid,
      sessionId: payload.token,
      token: payload.token,
      iframeUrl: `${paytrIframeBaseUrl}/${payload.token}`,
      callbackUrl,
      status: "created",
      checkoutMode: "inline",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      fraudSignals: {
        requiresReview: request.amount >= 50000,
        reason: request.amount >= 50000 ? "High value PayTR order" : undefined
      }
    };
  },
  async verifyWebhook(payload) {
    const data = payload as {
      merchant_oid?: string;
      status?: string;
      total_amount?: string;
      payment_amount?: string;
      hash?: string;
      failed_reason_msg?: string;
    };
    const { merchantKey, merchantSalt } = await getPaytrCredentials();
    if (!data.merchant_oid || !data.status || !data.hash) throw new Error("Invalid PayTR callback");
    const amount = data.total_amount ?? data.payment_amount ?? "";
    const expectedHash = await createPaytrCallbackHash(data.merchant_oid, data.status, amount, merchantKey, merchantSalt);
    if (expectedHash !== data.hash) throw new Error("PayTR hash verification failed");
    const paid = data.status === "success";

    return {
      orderId: data.merchant_oid,
      providerRef: data.merchant_oid,
      status: paid ? "paid" : "failed",
      amount: amount ? Number(amount) / 100 : undefined,
      gatewayStatus: data.status,
      failureReason: paid ? undefined : data.failed_reason_msg ?? "PayTR payment failed",
      paidAt: paid ? new Date() : undefined,
      raw: payload
    };
  },
  async getInstallments(amount) {
    return [1, 2, 3, 6, 9].map((count) => ({
      count,
      label: count === 1 ? "Tek çekim" : `${count} taksit`,
      totalAmount: amount,
      monthlyAmount: Math.round((amount / count) * 100) / 100
    }));
  }
};

async function getPaytrCredentials() {
  const integration = await resolveIntegrationConfig("payment", "paytr");
  const testMode = integration.mode === "live" ? "0" : "1";
  const config = integration.config as Record<string, unknown>;
  const secrets = integration.secrets as Record<string, unknown>;
  const values = {
    merchantId: String(config.merchantId || process.env.PAYTR_MERCHANT_ID || ""),
    merchantKey: String(secrets.merchantKey || process.env.PAYTR_MERCHANT_KEY || ""),
    merchantSalt: String(secrets.merchantSalt || process.env.PAYTR_MERCHANT_SALT || "")
  };
  const missing = [
    ["PAYTR_MERCHANT_ID", values.merchantId],
    ["PAYTR_MERCHANT_KEY", values.merchantKey],
    ["PAYTR_MERCHANT_SALT", values.merchantSalt]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length && testMode === "1") {
    return {
      complete: false,
      missing,
      merchantId: values.merchantId ?? "PAYTR_TEST_MERCHANT",
      merchantKey: values.merchantKey ?? "PAYTR_TEST_KEY",
      merchantSalt: values.merchantSalt ?? "PAYTR_TEST_SALT"
    };
  }

  if (missing.length) return { complete: false, missing, merchantId: "", merchantKey: "", merchantSalt: "" };
  return {
    complete: true,
    missing,
    merchantId: values.merchantId ?? "",
    merchantKey: values.merchantKey ?? "",
    merchantSalt: values.merchantSalt ?? ""
  };
}

export async function createPaytrCallbackHash(orderId: string, status: string, amount: string, key?: string, salt?: string) {
  const credentials = key && salt ? { merchantKey: key, merchantSalt: salt } : await getPaytrCredentials();
  return crypto.createHmac("sha256", credentials.merchantKey).update(`${orderId}${credentials.merchantSalt}${status}${amount}`).digest("base64");
}

function getLocalTestOrigin(appUrl: string) {
  const callbackUrl = process.env.PAYTR_CALLBACK_URL;
  if (callbackUrl) return new URL(callbackUrl).origin;
  return new URL(appUrl).origin;
}

function withQuery(url: string, params: Record<string, string>) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return target.toString();
}
