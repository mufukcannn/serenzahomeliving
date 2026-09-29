import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const collections = [
  {
    title: "Vintage Koleksiyonu",
    slug: "vintage-koleksiyonu",
    description: "Salon ve oturma alanları için yumuşak geçişli vintage halılar.",
    heroImage: "/brand-images/hali-koleksiyon.png"
  },
  {
    title: "Mini Teaser Koleksiyonu",
    slug: "mini-teaser-koleksiyonu",
    description: "Çocuk odaları için sakin, yumuşak ve dekoratif oyun alanı dokuları.",
    heroImage: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Paspas",
    slug: "paspas",
    description: "Kapı önü kullanımı için dayanıklı ve dekoratif paspaslar.",
    heroImage: "/brand-images/paspas.jpg"
  }
];

for (const collection of collections) {
  await prisma.collection.upsert({
    where: { slug: collection.slug },
    update: collection,
    create: collection
  });
}

const vintage = await prisma.collection.findUniqueOrThrow({ where: { slug: "vintage-koleksiyonu" } });
const mini = await prisma.collection.findUniqueOrThrow({ where: { slug: "mini-teaser-koleksiyonu" } });
const paspas = await prisma.collection.findUniqueOrThrow({ where: { slug: "paspas" } });

const products = [
  {
    title: "Vintage Koleksiyonu Terra Halı",
    slug: "vintage-koleksiyonu-terra-hali",
    collectionId: vintage.id,
    collection: vintage.title,
    category: "Halı",
    description: "Eskitme dokulu, salon ve oturma odaları için sıcak tonlu vintage halı.",
    price: 4890,
    salePrice: 4290,
    stock: 8,
    sku: "RUG-VIN-001",
    barcode: "8680000000011",
    images: ["/brand-images/hali-kategori.jpg", "/brand-images/hali-koleksiyon.png"],
    sizes: ["80x150", "120x180", "160x230", "200x300"],
    colors: ["Terra", "Krem", "Antrasit"],
    seoTitle: "Vintage Koleksiyonu Terra Halı | Serenza Home Living",
    seoDescription: "Eskitme dokulu vintage halı modelleri Serenza Home Living'de.",
    variants: [
      { size: "160x230", color: "Krem", sku: "RUG-VIN-001-160230-KRE", barcode: "8680000001018", price: 4290, comparePrice: 4890, stock: 5 },
      { size: "200x300", color: "Terra", sku: "RUG-VIN-001-200300-TER", barcode: "8680000001025", price: 5890, comparePrice: 6490, stock: 3 }
    ]
  },
  {
    title: "Mini Teaser Çocuk Halısı Bulut",
    slug: "mini-teaser-cocuk-halisi-bulut",
    collectionId: mini.id,
    collection: mini.title,
    category: "Çocuk Halısı",
    description: "Çocuk odaları için yumuşak dokulu, sakin renkli ve oyun alanına uyumlu dekoratif çocuk halısı.",
    price: 2190,
    salePrice: null,
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
    variants: [
      { size: "80x150", color: "Bulut", sku: "RUG-MIN-002-80150-BUL", barcode: "8680000002015", price: 2190, stock: 5 }
    ]
  },
  {
    title: "Kapı Önü Paspas Natural",
    slug: "kapi-onu-paspas-natural",
    collectionId: paspas.id,
    collection: paspas.title,
    category: "Paspas",
    description: "Kapı önü kullanımı için dayanıklı, dekoratif ve kolay temizlenen natural paspas.",
    price: 690,
    salePrice: 590,
    stock: 20,
    sku: "RUG-PAS-005",
    barcode: "8680000000059",
    images: ["/brand-images/paspas.jpg", "/brand-images/paspas-kategori.jpg"],
    sizes: ["40x60", "50x80"],
    colors: ["Natural", "Siyah"],
    seoTitle: "Kapı Önü Paspas Natural | Serenza Home Living",
    seoDescription: "Kapı önü paspas modelleri ve dekoratif giriş ürünleri.",
    variants: [
      { size: "40x60", color: "Natural", sku: "RUG-PAS-005-4060-NAT", barcode: "8680000005016", price: 590, comparePrice: 690, stock: 12 },
      { size: "50x80", color: "Siyah", sku: "RUG-PAS-005-5080-SIY", barcode: "8680000005023", price: 790, stock: 8 }
    ]
  }
];

for (const productData of products) {
  const { variants, ...product } = productData;
  const saved = await prisma.product.upsert({
    where: { sku: product.sku },
    update: product,
    create: product
  });

  await prisma.productImage.deleteMany({ where: { productId: saved.id } });
  await prisma.productImage.createMany({
    data: product.images.map((url, index) => ({
      productId: saved.id,
      url,
      alt: saved.title,
      sortOrder: index,
      isPrimary: index === 0,
      isHover: index === 1
    }))
  });

  for (const variant of variants) {
    const savedVariant = await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: { ...variant, productId: saved.id },
      create: { ...variant, productId: saved.id }
    });

    await prisma.inventory.upsert({
      where: { sku: savedVariant.sku },
      update: {
        productId: saved.id,
        variantId: savedVariant.id,
        onHand: variant.stock,
        reserved: 0,
        safety: 0
      },
      create: {
        productId: saved.id,
        variantId: savedVariant.id,
        sku: savedVariant.sku,
        onHand: variant.stock,
        reserved: 0,
        safety: 0
      }
    });
  }
}

const trendyol = await prisma.marketplaceAccount.upsert({
  where: { channel_name: { channel: "trendyol", name: "Serenza Home Living Trendyol" } },
  update: {
    supplierId: process.env.TRENDYOL_SUPPLIER_ID || null,
    baseUrl: process.env.TRENDYOL_BASE_URL || "https://api.trendyol.com/sapigw"
  },
  create: {
    channel: "trendyol",
    name: "Serenza Home Living Trendyol",
    supplierId: process.env.TRENDYOL_SUPPLIER_ID || null,
    baseUrl: process.env.TRENDYOL_BASE_URL || "https://api.trendyol.com/sapigw"
  }
});

const seededProducts = await prisma.product.findMany({ include: { variants: true } });
for (const product of seededProducts) {
  for (const variant of product.variants) {
    await prisma.marketplaceListing.upsert({
      where: { channel_externalSku: { channel: "trendyol", externalSku: variant.sku } },
      update: {
        accountId: trendyol.id,
        productId: product.id,
        variantId: variant.id,
        barcode: variant.barcode,
        status: "draft"
      },
      create: {
        accountId: trendyol.id,
        productId: product.id,
        variantId: variant.id,
        channel: "trendyol",
        externalSku: variant.sku,
        barcode: variant.barcode,
        status: "draft"
      }
    });
  }
}

await prisma.$disconnect();
