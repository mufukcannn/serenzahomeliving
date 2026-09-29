"use client";

import { create } from "zustand";
import { AdminProduct, AdminSection } from "@/lib/admin-data";

type AdminStore = {
  section: AdminSection;
  search: string;
  mode: "light" | "dark";
  products: AdminProduct[];
  productsLoading: boolean;
  productsError: string | null;
  selectedProductId: string | null;
  setSection: (section: AdminSection) => void;
  setSearch: (search: string) => void;
  toggleMode: () => void;
  loadProducts: () => Promise<void>;
  selectProduct: (productId: string | null) => void;
  createProduct: () => void;
  updateProduct: (productId: string, patch: Partial<AdminProduct>) => Promise<void>;
  deleteProduct: (productId: string) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  section: "dashboard",
  search: "",
  mode: "light",
  products: [],
  productsLoading: false,
  productsError: null,
  selectedProductId: null,
  setSection: (section) => set({ section }),
  setSearch: (search) => set({ search }),
  toggleMode: () => set((state) => ({ mode: state.mode === "light" ? "dark" : "light" })),
  loadProducts: async () => {
    set({ productsLoading: true, productsError: null });
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const data = (await response.json()) as { products?: AdminProduct[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Urun katalogu yuklenemedi.");
      const products = data.products ?? [];
      set((state) => ({
        products,
        productsLoading: false,
        selectedProductId: products.some((product) => product.id === state.selectedProductId) ? state.selectedProductId : products[0]?.id ?? null
      }));
    } catch (error) {
      set({
        productsLoading: false,
        productsError: error instanceof Error ? error.message : "Urun katalogu yuklenemedi."
      });
    }
  },
  selectProduct: (productId) => set({ selectedProductId: productId }),
  createProduct: () =>
    set((state) => {
      const product: AdminProduct = {
        id: `draft-${Date.now()}`,
        title: "Yeni Serenza Home Living Ürünü",
        displayTitle: "Yeni Serenza Home Living Ürünü",
        slug: "yeni-serenza-urunu",
        collection: "Vintage Koleksiyonu",
        category: "Halı",
        status: "draft",
        images: ["/brand-images/hali-kategori.jpg"],
        hoverImage: "/brand-images/hali-koleksiyon.png",
        seoTitle: "Yeni Serenza Home Living Ürünü",
        seoDescription: "Serenza Home Living ürün açıklaması.",
        variants: [
          {
            id: `variant-${Date.now()}`,
            size: "160x230",
            color: "Krem",
            stock: 0,
            sku: "RUG-DRAFT",
            price: 0
          }
        ]
      };
      return { products: [product, ...state.products], selectedProductId: product.id, section: "products" };
    }),
  updateProduct: async (productId, patch) => {
    set((state) => ({
      products: state.products.map((product) => (product.id === productId ? { ...product, ...patch } : product))
    }));

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Urun guncellenemedi.");
      }
    } catch (error) {
      set({ productsError: error instanceof Error ? error.message : "Urun guncellenemedi." });
    }
  },
  deleteProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== productId),
      selectedProductId: state.selectedProductId === productId ? state.products.find((product) => product.id !== productId)?.id ?? null : state.selectedProductId
    }))
}));
