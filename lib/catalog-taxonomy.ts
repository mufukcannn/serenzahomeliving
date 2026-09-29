export type CatalogCategory = {
  title: string;
  slug: string;
  collections: Array<{
    title: string;
    slug: string;
  }>;
};

export const catalogTaxonomy: CatalogCategory[] = [
  {
    title: "Halı",
    slug: "hali",
    collections: [{ title: "Vintage Koleksiyonu", slug: "vintage-koleksiyonu" }]
  },
  {
    title: "Çocuk Halısı",
    slug: "cocuk-halisi",
    collections: [{ title: "Mini Teaser Koleksiyonu", slug: "mini-teaser-koleksiyonu" }]
  },
  {
    title: "Kaymaz Taban Halı",
    slug: "kaymaz-taban-hali",
    collections: [{ title: "Kaymaz Taban Halı", slug: "kaymaz-taban-hali" }]
  },
  {
    title: "Banyo Serisi",
    slug: "banyo-serisi",
    collections: [{ title: "Banyo Serisi", slug: "banyo-serisi" }]
  },
  {
    title: "Paspas",
    slug: "paspas",
    collections: [{ title: "Kapı Önü", slug: "kapi-onu" }]
  }
];

export function getCollectionsForCategory(category: string) {
  return catalogTaxonomy.find((item) => item.title === category)?.collections ?? [];
}

export function inferCatalogAssignment(input: { categoryName?: string; title?: string }) {
  const text = `${input.categoryName ?? ""} ${input.title ?? ""}`.toLocaleLowerCase("tr-TR");

  if (text.includes("banyo")) {
    return { category: "Banyo Serisi", collection: "Banyo Serisi" };
  }

  if (text.includes("kapı") || text.includes("kapi") || text.includes("paspas")) {
    return { category: "Paspas", collection: "Kapı Önü" };
  }

  if (text.includes("çocuk") || text.includes("cocuk") || text.includes("mini teaser")) {
    return { category: "Çocuk Halısı", collection: "Mini Teaser Koleksiyonu" };
  }

  if (text.includes("kaymaz")) {
    return { category: "Kaymaz Taban Halı", collection: "Kaymaz Taban Halı" };
  }

  return { category: "Halı", collection: "Vintage Koleksiyonu" };
}
