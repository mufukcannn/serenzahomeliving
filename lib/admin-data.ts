import { demoProducts } from "@/lib/products";

export type AdminSection = "dashboard" | "products" | "inventory" | "orders" | "payment_logs" | "customers" | "shipping" | "marketplaces" | "campaigns" | "roles" | "reports" | "settings";
export type AdminRole = "admin" | "shipping" | "accounting" | "customer_service";
export type AdminPermissionAction = "read" | "create" | "update" | "delete" | "export" | "process";

export type AdminRoleDefinition = {
  id: AdminRole;
  label: string;
  description: string;
  allowedSections: AdminSection[];
  permissions: Partial<Record<AdminSection, AdminPermissionAction[]>>;
};

export const adminRoleDefinitions: AdminRoleDefinition[] = [
  {
    id: "admin",
    label: "Admin",
    description: "Tüm OMS/ERP modüllerine ve ayarlara tam erişim.",
    allowedSections: ["dashboard", "products", "inventory", "orders", "payment_logs", "customers", "shipping", "marketplaces", "campaigns", "roles", "reports", "settings"],
    permissions: {
      products: ["read", "create", "update", "delete", "export", "process"],
      inventory: ["read", "create", "update", "delete", "export", "process"],
      orders: ["read", "create", "update", "delete", "export", "process"],
      payment_logs: ["read", "export"],
      customers: ["read", "create", "update", "delete", "export", "process"],
      shipping: ["read", "create", "update", "delete", "export", "process"],
      marketplaces: ["read", "create", "update", "delete", "export", "process"],
      campaigns: ["read", "create", "update", "delete", "process"],
      roles: ["read", "create", "update", "delete", "export", "process"],
      reports: ["read", "export"]
    }
  },
  {
    id: "shipping",
    label: "Sevkiyat",
    description: "Sadece sipariş işleme ve kargo operasyon ekranlarına erişir.",
    allowedSections: ["orders", "shipping"],
    permissions: {
      orders: ["read", "update", "process"],
      shipping: ["read", "update", "process"]
    }
  },
  {
    id: "accounting",
    label: "Muhasebe",
    description: "Ödeme, fatura ve rapor verilerini okur/dışa aktarır.",
    allowedSections: ["orders", "payment_logs", "customers", "reports"],
    permissions: {
      orders: ["read", "export"],
      payment_logs: ["read", "export"],
      customers: ["read"],
      reports: ["read", "export"]
    }
  },
  {
    id: "customer_service",
    label: "Müşteri Hizmetleri",
    description: "Müşteri ve sipariş kayıtlarını takip eder, destek notlarını yönetir.",
    allowedSections: ["orders", "customers", "shipping"],
    permissions: {
      orders: ["read", "update"],
      customers: ["read", "update"],
      shipping: ["read"]
    }
  }
];

export type AdminProductStatus = "draft" | "published" | "archived";

export type AdminVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
  price: number;
  marketplacePrice?: number;
  basePrice?: number;
  webPrice?: number;
  salePrice?: number;
  comparePrice?: number;
  compareAtPrice?: number;
  discountPercent?: number;
  finalPrice?: number;
  campaignName?: string;
};

export type AdminProduct = {
  id: string;
  title: string;
  displayTitle?: string;
  slug: string;
  collection: string;
  category: string;
  status: AdminProductStatus;
  images: string[];
  hoverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAltText?: string;
  feedEnabled?: boolean;
  feedTitle?: string;
  feedDescription?: string;
  feedCategory?: string;
  googleProductCategory?: string;
  feedImage?: string;
  attributes?: Array<{ name: string; value: string }>;
  variants: AdminVariant[];
};

export type AdminCollection = {
  id: string;
  title: string;
  handle: string;
  description: string;
  heroImage: string;
  seoTitle?: string;
  seoDescription?: string;
  productIds: string[];
  status: "visible" | "hidden";
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    city: string;
    district: string;
    line1: string;
    invoiceType: "individual" | "corporate";
  };
  source: "website" | "trendyol" | "hepsiburada" | "amazon" | "n11";
  externalOrderId?: string;
  trendyolOrderNumber?: string;
  marketplaceOrderNumber?: string;
  total: number;
  paymentStatus: "pending" | "authorized" | "paid" | "failed" | "cancelled" | "refunded";
  orderStatus: "created" | "paid" | "processing" | "preparing" | "shipped" | "delivered" | "cancelled" | "returned";
  items: Array<{
    id: string;
    productId: string;
    title: string;
    image: string;
    sku: string;
    barcode?: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payment: {
    provider: "mock" | "paytr" | "iyzico" | "stripe" | "marketplace";
    reference: string;
    sessionId?: string;
    installment?: number;
    gatewayStatus?: string;
    fraudScore?: number;
    failureReason?: string;
    paidAt?: string;
    amount: number;
  };
  invoice: {
    type: "individual" | "corporate";
    status: "not_issued" | "issued" | "cancelled";
    number?: string;
    url?: string;
    billingName?: string;
    billingCompany?: string;
    billingTaxNumber?: string;
    billingTaxOffice?: string;
    billingAddress: string;
  };
  notes: Array<{ id: string; author: string; body: string; createdAt: string }>;
  timeline: Array<{
    status: AdminOrder["orderStatus"];
    timestamp: string;
    note: string;
  }>;
  carrier?: string;
  carrierProvider?: "manual" | "yurtici";
  trackingCode?: string;
  trackingUrl?: string;
  shippingLabelUrl?: string;
  assignedTo?: string;
  assignedUserId?: string;
  shippedAt?: string;
  shipmentStatus: "not_ready" | "label_created" | "in_transit" | "delivered" | "exception" | "returned";
  shippingServiceLevel?: "standard" | "oversized" | "freight";
  shippingRequiresReview?: boolean;
  shippingCost?: number;
  profit: {
    commission: number;
    cargoCost: number;
    marketplaceFee: number;
    netProfit: number;
  };
  createdAt: string;
};

export type AdminMedia = {
  id: string;
  url: string;
  alt: string;
  type: "product" | "collection" | "editorial";
  optimized: boolean;
};

export const adminProducts: AdminProduct[] = demoProducts.map((product, index) => ({
  id: product.id,
  title: product.title,
  displayTitle: product.displayTitle,
  slug: product.slug,
  collection: product.collection,
  category: product.category,
  status: product.status === "active" ? "published" : "draft",
  images: product.images,
  hoverImage: product.images[1] ?? product.images[0],
  seoTitle: product.seoTitle,
  seoDescription: product.seoDescription,
  imageAltText: `${product.title} ürün görseli`,
  feedEnabled: product.status === "active",
  feedTitle: product.title,
  feedDescription: product.seoDescription,
  feedCategory: `${product.category} > ${product.collection}`,
  googleProductCategory: product.category.includes("Paspas") ? "Home & Garden > Decor > Door Mats" : "Home & Garden > Decor > Rugs",
  feedImage: product.images[0],
  attributes: [
    { name: "Kategori", value: product.category },
    { name: "Koleksiyon", value: product.collection },
    { name: "Ölçüler", value: product.sizes.join(", ") },
    { name: "Renkler", value: product.colors.join(", ") }
  ],
  variants: product.sizes.slice(0, 3).flatMap((size, sizeIndex) =>
    product.colors.slice(0, 2).map((color, colorIndex) => ({
      id: `${product.id}-${sizeIndex}-${colorIndex}`,
      size,
      color,
      stock: Math.max(0, product.stock - sizeIndex - colorIndex - index),
      sku: `${product.sku}-${size.replace("x", "")}-${color.slice(0, 3).toUpperCase()}`,
      price: product.salePrice ?? product.price,
      comparePrice: product.salePrice ? product.price : undefined
    }))
  )
}));

export const adminCollections: AdminCollection[] = [
  {
    id: "collection-vintage",
    title: "Vintage Koleksiyonu",
    handle: "vintage-koleksiyonu",
    description: "Salon ve oturma alanları için yumuşak geçişli vintage halılar.",
    heroImage: "/brand-images/hali-koleksiyon.png",
    seoTitle: "Vintage Halı Koleksiyonu | Serenza Home Living",
    seoDescription: "Premium vintage halı koleksiyonu; salon ve oturma alanları için sıcak tonlu Serenza Home Living dokuları.",
    productIds: ["demo-001"],
    status: "visible"
  },
  {
    id: "collection-mini",
    title: "Mini Teaser Koleksiyonu",
    handle: "mini-teaser-koleksiyonu",
    description: "Çocuk odaları için sakin, yumuşak ve dekoratif oyun alanı dokuları.",
    heroImage: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop",
    seoTitle: "Mini Teaser Çocuk Halısı Koleksiyonu | Serenza Home Living",
    seoDescription: "Çocuk odaları için yumuşak dokulu, dekoratif ve sakin renkli Mini Teaser halı koleksiyonu.",
    productIds: ["demo-002"],
    status: "visible"
  },
  {
    id: "collection-bath",
    title: "Banyo Serisi",
    handle: "banyo-serisi",
    description: "Suya dayanıklı, yumuşak yüzeyli banyo dokuları.",
    heroImage: "/brand-images/uyelik.png",
    seoTitle: "Banyo Serisi Halı ve Paspas | Serenza Home Living",
    seoDescription: "Banyo alanları için suya dayanıklı, yumuşak ve premium Serenza Home Living dokuları.",
    productIds: ["demo-004"],
    status: "visible"
  }
];

export const adminOrders: AdminOrder[] = [
  {
    id: "order-001",
    orderNumber: "WEB-25MAY-A104",
    customer: { name: "Elif Kaya", email: "elif@example.com", phone: "+90 532 000 00 11" },
    address: {
      city: "İstanbul",
      district: "Kadıköy",
      line1: "Caferağa Mah. Moda Cad. No: 18 D: 4",
      invoiceType: "individual"
    },
    source: "website",
    total: 4290,
    paymentStatus: "paid",
    orderStatus: "paid",
    items: [
      {
        id: "order-item-001",
        productId: "demo-001",
        title: "Vintage Koleksiyonu Terra Halı",
        image: "/brand-images/hali-kategori.jpg",
        sku: "RUG-VIN-001-160230-KRE",
        barcode: "8680000000011",
        size: "160x230",
        color: "Krem",
        quantity: 1,
        unitPrice: 4290,
        total: 4290
      }
    ],
    payment: { provider: "iyzico", reference: "iyzico-order-001", sessionId: "iyzico-order-001", installment: 3, gatewayStatus: "SUCCESS", fraudScore: 0.12, paidAt: "2026-05-25 21:43", amount: 4290 },
    invoice: {
      type: "individual",
      status: "issued",
      number: "RUG202600001",
      url: "https://serenza.com/invoices/RUG202600001.pdf",
      billingName: "Elif Kaya",
      billingTaxNumber: "11111111110",
      billingAddress: "Caferağa Mah. Moda Cad. No: 18 D: 4 / Kadıköy / İstanbul"
    },
    notes: [{ id: "note-001", author: "Admin", body: "Müşteri paketleme öncesi telefonla bilgilendirilecek.", createdAt: "2026-05-25 21:45" }],
    timeline: [
      { status: "created", timestamp: "2026-05-25 21:42", note: "Web checkout siparişi oluşturdu." },
      { status: "paid", timestamp: "2026-05-25 21:43", note: "Mock ödeme başarılı olarak doğrulandı." }
    ],
    carrier: "Yurtiçi Kargo",
    carrierProvider: "yurtici",
    trackingCode: "YK123456789",
    trackingUrl: "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula",
    shipmentStatus: "label_created",
    shippingServiceLevel: "oversized",
    shippingRequiresReview: false,
    shippingCost: 249,
    profit: { commission: 0, cargoCost: 149, marketplaceFee: 0, netProfit: 4141 },
    createdAt: "2026-05-25 21:42"
  },
  {
    id: "order-002",
    orderNumber: "TY-25MAY-B218",
    customer: { name: "Murat Demir", email: "trendyol-customer@example.com", phone: "+90 555 000 00 22" },
    address: {
      city: "Ankara",
      district: "Çankaya",
      line1: "Trendyol masked address / paket teslim adresi",
      invoiceType: "individual"
    },
    source: "trendyol",
    total: 1490,
    paymentStatus: "paid",
    orderStatus: "preparing",
    items: [
      {
        id: "order-item-002",
        productId: "demo-003",
        title: "Kaymaz Taban Halı Linea",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
        sku: "RUG-KAY-003-80150-GRI",
        barcode: "8680000000035",
        size: "80x150",
        color: "Gri",
        quantity: 1,
        unitPrice: 1490,
        total: 1490
      }
    ],
    payment: { provider: "marketplace", reference: "TY-PACKAGE-987654", paidAt: "2026-05-25 20:11", amount: 1490 },
    invoice: {
      type: "individual",
      status: "not_issued",
      billingName: "Murat Demir",
      billingTaxNumber: "22222222220",
      billingAddress: "Trendyol masked address / paket teslim adresi / Çankaya / Ankara"
    },
    notes: [{ id: "note-002", author: "System", body: "Trendyol siparişi stoktan düşüldü, pazaryeri paketi hazırlanıyor.", createdAt: "2026-05-25 20:12" }],
    timeline: [
      { status: "created", timestamp: "2026-05-25 20:10", note: "Trendyol siparişi içeri alındı." },
      { status: "paid", timestamp: "2026-05-25 20:11", note: "Pazaryeri ödeme durumu paid." },
      { status: "preparing", timestamp: "2026-05-25 20:18", note: "Paket hazırlama kuyruğuna alındı." }
    ],
    carrier: "Trendyol Express",
    carrierProvider: "manual",
    trackingCode: "TYX987654321",
    trackingUrl: "https://www.trendyol.com/yardim/sorular",
    shipmentStatus: "in_transit",
    shippingServiceLevel: "standard",
    shippingRequiresReview: false,
    shippingCost: 74,
    profit: { commission: 178.8, cargoCost: 74, marketplaceFee: 21.5, netProfit: 1215.7 },
    createdAt: "2026-05-25 20:10"
  },
  {
    id: "order-003",
    orderNumber: "WEB-25MAY-C781",
    customer: { name: "Zeynep Arslan", email: "zeynep@example.com", phone: "+90 533 000 00 33" },
    address: {
      city: "İzmir",
      district: "Karşıyaka",
      line1: "Bostanlı Mah. 1820 Sok. No: 7",
      invoiceType: "individual"
    },
    source: "website",
    total: 590,
    paymentStatus: "pending",
    orderStatus: "created",
    items: [
      {
        id: "order-item-003",
        productId: "demo-005",
        title: "Kapı Önü Paspas Natural",
        image: "/brand-images/paspas.jpg",
        sku: "RUG-PAS-005-4060-NAT",
        barcode: "8680000000059",
        size: "40x60",
        color: "Natural",
        quantity: 1,
        unitPrice: 590,
        total: 590
      }
    ],
    payment: { provider: "mock", reference: "mock-WEB-25MAY-C781", installment: 1, gatewayStatus: "created", amount: 590 },
    invoice: {
      type: "corporate",
      status: "not_issued",
      billingCompany: "Zeynep Arslan Tasarım",
      billingTaxNumber: "1234567890",
      billingTaxOffice: "Karşıyaka",
      billingAddress: "Bostanlı Mah. 1820 Sok. No: 7 / Karşıyaka / İzmir"
    },
    notes: [],
    timeline: [{ status: "created", timestamp: "2026-05-25 18:26", note: "Sipariş oluşturuldu, ödeme bekleniyor." }],
    carrierProvider: "manual",
    shipmentStatus: "not_ready",
    shippingServiceLevel: "standard",
    shippingRequiresReview: false,
    shippingCost: 149,
    profit: { commission: 0, cargoCost: 0, marketplaceFee: 0, netProfit: 590 },
    createdAt: "2026-05-25 18:26"
  }
];

export function getAdminOrder(orderId: string) {
  return adminOrders.find((order) => order.id === orderId || order.orderNumber === orderId);
}

export const adminMedia: AdminMedia[] = [
  { id: "media-001", url: "/brand-images/hali-kategori.jpg", alt: "Vintage halı yaşam alanı", type: "product", optimized: true },
  { id: "media-002", url: "/brand-images/hali-koleksiyon.png", alt: "Vintage koleksiyon editorial", type: "collection", optimized: true },
  { id: "media-003", url: "/brand-images/paspas.jpg", alt: "Kapı önü paspas", type: "product", optimized: false },
  { id: "media-004", url: "/brand-images/uyelik.png", alt: "Banyo serisi dokusu", type: "editorial", optimized: false }
];
