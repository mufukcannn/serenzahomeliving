import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateProductSchema = z.object({
  title: z.string().optional(),
  displayTitle: z.string().nullable().optional(),
  slug: z.string().optional(),
  category: z.string().optional(),
  collection: z.string().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  feedEnabled: z.boolean().optional(),
  feedTitle: z.string().nullable().optional(),
  feedDescription: z.string().nullable().optional(),
  feedCategory: z.string().nullable().optional(),
  googleProductCategory: z.string().nullable().optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const input = updateProductSchema.parse(await request.json());
    const collection = input.collection
      ? await prisma.collection.upsert({
          where: { slug: slugify(input.collection) },
          update: { title: input.collection },
          create: {
            title: input.collection,
            slug: slugify(input.collection),
            description: input.category ? `${input.category} ana kategorisi.` : null,
            status: "visible"
          }
        })
      : null;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...input,
        collectionId: collection?.id,
        feedCategory: input.category && input.collection ? `${input.category} > ${input.collection}` : input.feedCategory
      }
    });

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Urun guncellenemedi." },
      { status: 500 }
    );
  }
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
