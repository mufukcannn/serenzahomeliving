export type IntegrationCategory = "payment" | "marketplace" | "shipping";

export type IntegrationProviderDefinition = {
  category: IntegrationCategory;
  provider: string;
  label: string;
  secretFields: string[];
  configFields: string[];
  env: Record<string, string>;
};

export const integrationDefinitions: IntegrationProviderDefinition[] = [
  {
    category: "payment",
    provider: "paytr",
    label: "PayTR",
    secretFields: ["merchantKey", "merchantSalt"],
    configFields: ["merchantId", "callbackUrl", "successUrl", "failUrl"],
    env: {
      merchantId: "PAYTR_MERCHANT_ID",
      merchantKey: "PAYTR_MERCHANT_KEY",
      merchantSalt: "PAYTR_MERCHANT_SALT",
      callbackUrl: "PAYTR_CALLBACK_URL",
      successUrl: "PAYTR_SUCCESS_URL",
      failUrl: "PAYTR_FAIL_URL",
      testMode: "PAYTR_TEST_MODE"
    }
  },
  {
    category: "marketplace",
    provider: "trendyol",
    label: "Trendyol",
    secretFields: ["apiKey", "apiSecret"],
    configFields: ["supplierId", "syncInterval"],
    env: {
      supplierId: "TRENDYOL_SUPPLIER_ID",
      apiKey: "TRENDYOL_API_KEY",
      apiSecret: "TRENDYOL_API_SECRET"
    }
  },
  {
    category: "marketplace",
    provider: "hepsiburada",
    label: "Hepsiburada",
    secretFields: ["apiKey", "apiSecret"],
    configFields: ["merchantId", "syncInterval"],
    env: {}
  },
  {
    category: "marketplace",
    provider: "amazon",
    label: "Amazon",
    secretFields: ["apiKey", "apiSecret"],
    configFields: ["merchantId", "syncInterval"],
    env: {}
  },
  {
    category: "shipping",
    provider: "yurtici",
    label: "Yurtiçi Kargo",
    secretFields: ["apiPassword", "apiKey", "apiSecret"],
    configFields: ["customerCode", "apiUsername"],
    env: {
      customerCode: "YURTICI_CUSTOMER_CODE",
      apiUsername: "YURTICI_API_USERNAME",
      apiPassword: "YURTICI_API_PASSWORD",
      apiKey: "YURTICI_API_KEY",
      apiSecret: "YURTICI_API_SECRET"
    }
  },
  {
    category: "shipping",
    provider: "mng",
    label: "MNG",
    secretFields: ["apiPassword", "apiKey", "apiSecret"],
    configFields: ["customerCode", "apiUsername"],
    env: {}
  },
  {
    category: "shipping",
    provider: "aras",
    label: "Aras",
    secretFields: ["apiPassword", "apiKey", "apiSecret"],
    configFields: ["customerCode", "apiUsername"],
    env: {}
  },
  {
    category: "shipping",
    provider: "surat",
    label: "Sürat",
    secretFields: ["apiPassword", "apiKey", "apiSecret"],
    configFields: ["customerCode", "apiUsername"],
    env: {}
  }
];

export function getIntegrationDefinition(category: IntegrationCategory, provider: string) {
  return integrationDefinitions.find((definition) => definition.category === category && definition.provider === provider);
}
