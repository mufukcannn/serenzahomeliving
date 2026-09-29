import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteConfig } from "@/lib/seo";

type FeedProduct = Awaited<ReturnType<typeof getFeedProducts>>[number];

export async function getFeedProducts() {
  return prisma.product.findMany({
    where: {
      status: ProductStatus.active,
      feedEnabled: true
    },
    include: {
      variants: {
        where: { status: ProductStatus.active },
        include: { inventory: true }
      },
      productImages: {
        orderBy: [{ useInFeed: "desc" }, { isPrimary: "desc" }, { sortOrder: "asc" }]
      },
      collectionRef: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function buildGoogleMerchantXml() {
  const products = await getFeedProducts();
  const items = products.flatMap((product) => buildFeedItems(product)).map(toGoogleItemXml).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(siteConfig.name)}</title>
    <link>${xml(siteConfig.url)}</link>
    <description>${xml(siteConfig.description)}</description>
    ${items}
  </channel>
</rss>`;
}

export async function buildMetaCatalogXml() {
  const products = await getFeedProducts();
  const items = products.flatMap((product) => buildFeedItems(product)).map(toMetaItemXml).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(siteConfig.name)} Meta Catalog</title>
    <link>${xml(siteConfig.url)}</link>
    <description>${xml(siteConfig.description)}</description>
    ${items}
  </channel>
</rss>`;
}

function buildFeedItems(product: FeedProduct) {
  const variants = product.variants.length ? product.variants : [null];
  return variants.map((variant) => {
    const price = Number(variant?.comparePrice ?? product.price);
    const salePrice = Number(variant?.price ?? product.salePrice ?? product.price);
    const inventory = variant?.inventory?.onHand ?? product.stock;
    const selectedImage = product.productImages.find((image) => image.id === product.feedImageId) ?? product.productImages[0];
    const imageUrls = product.productImages.length ? product.productImages.map((image) => image.url) : product.images;

    return {
      id: variant?.sku ?? product.sku,
      itemGroupId: product.sku,
      title: product.feedTitle ?? product.seoTitle ?? product.title,
      description: product.feedDescription ?? product.seoDescription ?? product.description,
      link: absoluteUrl(`/products/${product.slug}`),
      imageLink: absoluteUrl(selectedImage?.url ?? imageUrls[0] ?? "/brand-images/hali-kategori.jpg"),
      additionalImages: imageUrls.filter((url) => url !== selectedImage?.url).slice(0, 10).map((url) => absoluteUrl(url)),
      availability: inventory > 0 ? "in_stock" : "out_of_stock",
      price,
      salePrice: salePrice < price ? salePrice : undefined,
      brand: "Serenza Home & Living",
      gtin: variant?.barcode ?? product.barcode,
      mpn: variant?.sku ?? product.sku,
      condition: "new",
      productType: product.feedCategory ?? `${product.category} > ${product.collection}`,
      googleProductCategory: product.googleProductCategory ?? mapGoogleCategory(product.category),
      shippingPrice: getShippingPrice(variant?.size ?? product.sizes[0], salePrice),
      size: variant?.size,
      color: variant?.color
    };
  });
}

function toGoogleItemXml(item: ReturnType<typeof buildFeedItems>[number]) {
  return `
    <item>
      <g:id>${xml(item.id)}</g:id>
      <g:item_group_id>${xml(item.itemGroupId)}</g:item_group_id>
      <g:title>${xml(item.title)}</g:title>
      <g:description>${xml(item.description)}</g:description>
      <g:link>${xml(item.link)}</g:link>
      <g:image_link>${xml(item.imageLink)}</g:image_link>
      ${item.additionalImages.map((url) => `<g:additional_image_link>${xml(url)}</g:additional_image_link>`).join("")}
      <g:availability>${item.availability}</g:availability>
      <g:price>${money(item.price)}</g:price>
      ${item.salePrice ? `<g:sale_price>${money(item.salePrice)}</g:sale_price>` : ""}
      <g:brand>${xml(item.brand)}</g:brand>
      ${item.gtin ? `<g:gtin>${xml(item.gtin)}</g:gtin>` : ""}
      <g:mpn>${xml(item.mpn)}</g:mpn>
      <g:condition>${item.condition}</g:condition>
      <g:product_type>${xml(item.productType)}</g:product_type>
      <g:google_product_category>${xml(item.googleProductCategory)}</g:google_product_category>
      ${item.size ? `<g:size>${xml(item.size)}</g:size>` : ""}
      ${item.color ? `<g:color>${xml(item.color)}</g:color>` : ""}
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Standard</g:service>
        <g:price>${money(item.shippingPrice)}</g:price>
      </g:shipping>
    </item>`;
}

function toMetaItemXml(item: ReturnType<typeof buildFeedItems>[number]) {
  return `
    <item>
      <g:id>${xml(item.id)}</g:id>
      <g:item_group_id>${xml(item.itemGroupId)}</g:item_group_id>
      <g:title>${xml(item.title)}</g:title>
      <g:description>${xml(item.description)}</g:description>
      <g:link>${xml(item.link)}</g:link>
      <g:image_link>${xml(item.imageLink)}</g:image_link>
      ${item.additionalImages.map((url) => `<g:additional_image_link>${xml(url)}</g:additional_image_link>`).join("")}
      <g:availability>${item.availability}</g:availability>
      <g:price>${money(item.salePrice ?? item.price)}</g:price>
      ${item.salePrice ? `<g:sale_price>${money(item.salePrice)}</g:sale_price>` : ""}
      <g:brand>${xml(item.brand)}</g:brand>
      ${item.gtin ? `<g:gtin>${xml(item.gtin)}</g:gtin>` : ""}
      <g:mpn>${xml(item.mpn)}</g:mpn>
      <g:condition>${item.condition}</g:condition>
      <g:product_type>${xml(item.productType)}</g:product_type>
      ${item.size ? `<g:size>${xml(item.size)}</g:size>` : ""}
      ${item.color ? `<g:color>${xml(item.color)}</g:color>` : ""}
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Standard</g:service>
        <g:price>${money(item.shippingPrice)}</g:price>
      </g:shipping>
    </item>`;
}

function mapGoogleCategory(category: string) {
  const normalized = category.toLocaleLowerCase("tr-TR");
  if (normalized.includes("paspas")) return "Home & Garden > Decor > Door Mats";
  if (normalized.includes("banyo")) return "Home & Garden > Bathroom Accessories > Bath Mats & Rugs";
  return "Home & Garden > Decor > Rugs";
}

function getShippingPrice(size: string | undefined, productPrice: number) {
  if (productPrice >= 6000) return 0;
  const area = getSizeArea(size);
  if (area >= 8) return 499;
  if (area >= 4) return 249;
  return productPrice >= 1500 ? 0 : 149;
}

function getSizeArea(size?: string) {
  if (!size) return 0;
  const match = size.match(/(\d{2,3})\s*x\s*(\d{2,3})/i);
  if (!match) return 0;
  return (Number(match[1]) / 100) * (Number(match[2]) / 100);
}

function money(value: number) {
  return `${value.toFixed(2)} TRY`;
}

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
