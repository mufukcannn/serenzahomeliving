export type Product = {
  id: string;
  title: string;
  displayTitle?: string;
  slug: string;
  collection: string;
  category: string;
  description: string;
  price: number;
  marketplacePrice?: number;
  basePrice?: number;
  webPrice?: number;
  salePrice?: number;
  compareAtPrice?: number;
  discountPercent?: number;
  finalPrice?: number;
  stock: number;
  sku: string;
  barcode: string;
  images: string[];
  sizes: string[];
  colors: string[];
  seoTitle: string;
  seoDescription: string;
  trendyolProductId?: string;
  trendyolBarcode?: string;
  trendyolUrl?: string;
  status: "active" | "draft" | "archived";
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  title?: string;
  size: string;
  color: string;
  sku: string;
  barcode?: string;
  price: number;
  marketplacePrice?: number;
  basePrice?: number;
  webPrice?: number;
  salePrice?: number;
  compareAtPrice?: number;
  discountPercent?: number;
  finalPrice?: number;
  stock: number;
  images?: string[];
};

export function getProductFinalPrice(product: Product) {
  return product.finalPrice ?? product.webPrice ?? product.salePrice ?? product.price;
}

export function getProductComparePrice(product: Product) {
  const finalPrice = getProductFinalPrice(product);
  const compareAtPrice = product.compareAtPrice ?? product.price;
  return compareAtPrice > finalPrice ? compareAtPrice : undefined;
}

export function getVariantFinalPrice(variant: ProductVariant, product?: Product) {
  return variant.finalPrice ?? variant.webPrice ?? variant.salePrice ?? variant.price ?? (product ? getProductFinalPrice(product) : 0);
}

export function getVariantComparePrice(variant: ProductVariant, product?: Product) {
  const finalPrice = getVariantFinalPrice(variant, product);
  const compareAtPrice = variant.compareAtPrice ?? product?.compareAtPrice ?? product?.price;
  return compareAtPrice && compareAtPrice > finalPrice ? compareAtPrice : undefined;
}

export const demoProducts: Product[] = [
  {
    id: "demo-001",
    title: "Vintage Koleksiyonu Terra Halı",
    slug: "vintage-koleksiyonu-terra-hali",
    category: "Halı",
    collection: "Vintage Koleksiyonu",
    description:
      "Eskitme dokulu, salon ve oturma odaları için sıcak tonlu vintage halı. Serenza Home Living'in ana halı koleksiyonundan seçili demo ürün.",
    price: 4890,
    salePrice: 4290,
    stock: 8,
    sku: "RUG-VIN-001",
    barcode: "8680000000011",
    images: [
      "/brand-images/hali-kategori.jpg",
      "/brand-images/hali-koleksiyon.png"
    ],
    sizes: ["80x150", "120x180", "160x230", "200x300"],
    colors: ["Terra", "Krem", "Antrasit"],
    seoTitle: "Vintage Koleksiyonu Terra Halı | Serenza Home Living",
    seoDescription: "Eskitme dokulu vintage halı modelleri Serenza Home Living'de.",
    status: "active"
  },
  {
    id: "demo-002",
    title: "Mini Teaser Çocuk Halısı Bulut",
    slug: "mini-teaser-cocuk-halisi-bulut",
    category: "Çocuk Halısı",
    collection: "Mini Teaser Koleksiyonu",
    description:
      "Çocuk odaları için yumuşak dokulu, sakin renkli ve oyun alanına uyumlu dekoratif çocuk halısı.",
    price: 2190,
    stock: 5,
    sku: "RUG-MIN-002",
    barcode: "8680000000028",
    images: [
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600&auto=format&fit=crop"
    ],
    sizes: ["80x150", "100x160", "120x180"],
    colors: ["Bulut", "Pudra", "Mint"],
    seoTitle: "Mini Teaser Çocuk Halısı | Serenza Home Living",
    seoDescription: "Çocuk odaları için yumuşak dokulu Mini Teaser halı koleksiyonu.",
    status: "active"
  },
  {
    id: "demo-003",
    title: "Kaymaz Taban Halı Linea",
    slug: "kaymaz-taban-hali-linea",
    collection: "Kaymaz Taban Halı",
    category: "Kaymaz Taban Halı",
    description:
      "Günlük kullanım alanları için pratik, kaymaz tabanlı ve kolay yerleşen modern desenli halı.",
    price: 1790,
    salePrice: 1490,
    stock: 3,
    sku: "RUG-KAY-003",
    barcode: "8680000000035",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop"
    ],
    sizes: ["80x150", "100x200", "120x180"],
    colors: ["Gri", "Bej"],
    seoTitle: "Kaymaz Taban Halı Linea | Serenza Home Living",
    seoDescription: "Kaymaz tabanlı modern halı modelleri Serenza Home Living'de.",
    status: "active"
  },
  {
    id: "demo-004",
    title: "Banyo Serisi Soft Taş",
    slug: "banyo-serisi-soft-tas",
    collection: "Banyo Serisi",
    category: "Banyo Serisi",
    description:
      "Banyo alanları için suya dayanıklı, yumuşak dokulu ve sade taş rengi banyo halısı.",
    price: 990,
    stock: 14,
    sku: "RUG-BAN-004",
    barcode: "8680000000042",
    images: [
      "/brand-images/uyelik.png",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=1600&auto=format&fit=crop"
    ],
    sizes: ["50x80", "60x100", "2'li Set"],
    colors: ["Taş", "Ekru", "Gri"],
    seoTitle: "Banyo Serisi Soft Taş | Serenza Home Living",
    seoDescription: "Banyo serisi kaymaz ve yumuşak banyo halısı modelleri.",
    status: "active"
  },
  {
    id: "demo-005",
    title: "Kapı Önü Paspas Natural",
    slug: "kapi-onu-paspas-natural",
    collection: "Paspas",
    category: "Paspas",
    description:
      "Kapı önü kullanımı için dayanıklı, dekoratif ve kolay temizlenen natural paspas.",
    price: 690,
    salePrice: 590,
    stock: 20,
    sku: "RUG-PAS-005",
    barcode: "8680000000059",
    images: [
      "/brand-images/paspas.jpg",
      "/brand-images/paspas-kategori.jpg"
    ],
    sizes: ["40x60", "50x80"],
    colors: ["Natural", "Siyah"],
    seoTitle: "Kapı Önü Paspas Natural | Serenza Home Living",
    seoDescription: "Kapı önü paspas modelleri ve dekoratif giriş ürünleri.",
    status: "active"
  }
];

export function getProduct(slug: string) {
  return demoProducts.find((product) => product.slug === slug);
}

export const collections = Array.from(new Set(demoProducts.map((product) => product.collection)));
