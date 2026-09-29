import { AdminRole } from "@/lib/admin-data";

export type OrderDetailAccess = {
  role: AdminRole;
  label: string;
  canAccessOrderDetail: boolean;
  canViewProducts: boolean;
  canViewPrices: boolean;
  canViewPaymentStatus: boolean;
  canViewPaymentDetails: boolean;
  canViewInvoiceStatus: boolean;
  canViewInvoiceDetails: boolean;
  canEditInvoice: boolean;
  canViewCustomerContact: boolean;
  canViewShipping: boolean;
  canManageShipping: boolean;
  canPrintLabel: boolean;
  canMarkShipped: boolean;
  canViewProfit: boolean;
  canViewReports: boolean;
  canDeleteProducts: boolean;
  canViewReturns: boolean;
};

export const adminRoles = ["admin", "shipping", "accounting", "customer_service"] as const;

export function parseAdminRole(value?: string | string[] | null): AdminRole | "forbidden" {
  const role = Array.isArray(value) ? value[0] : value;
  if (role && !adminRoles.includes(role as AdminRole)) return "forbidden";
  return adminRoles.includes(role as AdminRole) ? (role as AdminRole) : "admin";
}

export function getOrderDetailAccess(role: AdminRole | "forbidden"): OrderDetailAccess {
  if (role === "forbidden") {
    return {
      role: "customer_service",
      label: "Yetkisiz",
      canAccessOrderDetail: false,
      canViewProducts: false,
      canViewPrices: false,
      canViewPaymentStatus: false,
      canViewPaymentDetails: false,
      canViewInvoiceStatus: false,
      canViewInvoiceDetails: false,
      canEditInvoice: false,
      canViewCustomerContact: false,
      canViewShipping: false,
      canManageShipping: false,
      canPrintLabel: false,
      canMarkShipped: false,
      canViewProfit: false,
      canViewReports: false,
      canDeleteProducts: false,
      canViewReturns: false
    };
  }

  if (role === "shipping") {
    return {
      role,
      label: "Sevkiyat",
      canAccessOrderDetail: true,
      canViewProducts: true,
      canViewPrices: false,
      canViewPaymentStatus: true,
      canViewPaymentDetails: false,
      canViewInvoiceStatus: true,
      canViewInvoiceDetails: false,
      canEditInvoice: false,
      canViewCustomerContact: false,
      canViewShipping: true,
      canManageShipping: true,
      canPrintLabel: true,
      canMarkShipped: true,
      canViewProfit: false,
      canViewReports: false,
      canDeleteProducts: false,
      canViewReturns: false
    };
  }

  if (role === "accounting") {
    return {
      role,
      label: "Muhasebe",
      canAccessOrderDetail: true,
      canViewProducts: false,
      canViewPrices: true,
      canViewPaymentStatus: true,
      canViewPaymentDetails: true,
      canViewInvoiceStatus: true,
      canViewInvoiceDetails: true,
      canEditInvoice: true,
      canViewCustomerContact: true,
      canViewShipping: false,
      canManageShipping: false,
      canPrintLabel: false,
      canMarkShipped: false,
      canViewProfit: false,
      canViewReports: false,
      canDeleteProducts: false,
      canViewReturns: false
    };
  }

  if (role === "customer_service") {
    return {
      role,
      label: "Müşteri Hizmetleri",
      canAccessOrderDetail: true,
      canViewProducts: true,
      canViewPrices: false,
      canViewPaymentStatus: false,
      canViewPaymentDetails: false,
      canViewInvoiceStatus: false,
      canViewInvoiceDetails: false,
      canEditInvoice: false,
      canViewCustomerContact: true,
      canViewShipping: true,
      canManageShipping: false,
      canPrintLabel: false,
      canMarkShipped: false,
      canViewProfit: false,
      canViewReports: false,
      canDeleteProducts: false,
      canViewReturns: true
    };
  }

  return {
    role: "admin",
    label: "Admin",
    canAccessOrderDetail: true,
    canViewProducts: true,
    canViewPrices: true,
    canViewPaymentStatus: true,
    canViewPaymentDetails: true,
    canViewInvoiceStatus: true,
    canViewInvoiceDetails: true,
    canEditInvoice: true,
    canViewCustomerContact: true,
    canViewShipping: true,
    canManageShipping: true,
    canPrintLabel: true,
    canMarkShipped: true,
    canViewProfit: true,
    canViewReports: true,
    canDeleteProducts: true,
    canViewReturns: true
  };
}
