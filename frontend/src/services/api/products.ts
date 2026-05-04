import { api } from "../http/client";
import { normalizeVariantOptions } from "@/utils/productVariants";
import { uploadAPI } from "./upload";

export interface ProductData {
  title: string;
  description: string;
  detailedTitle?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  subcategory?: string;
  sellerId: string;
  sku?: string;
  tags?: string[];
  specifications?: Array<{ name: string; value: string }>;
  variants?: Array<{ name: string; options: string[] }>;
  images?: File[];
  isActive?: boolean;
  orderPickupLocation?: string;
  tieredPricing?: string;
  inventory?: string;
}

export function getProductId(
  product: { _id?: string; id?: string } | null | undefined,
): string {
  if (!product) return "";
  const raw = (product as { _id?: unknown; id?: unknown })._id ?? product.id;
  if (raw == null || raw === "") return "";
  return typeof raw === "object" && raw !== null && "toString" in raw
    ? String((raw as { toString(): string }).toString())
    : String(raw);
}

export interface Product {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  detailedTitle?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  discount?: number;
  stock: number;
  category: string;
  subcategory?: string;
  sku?: string;
  imageUrl?: string;
  images: string[];
  tags?: string[];
  specifications?: Array<{ name: string; value: string }>;
  variants?: Array<{ name: string; options: string[] }>;
  orderPickupLocation?: string;
  sellerId: {
    id?: string;
    _id?: string;
    name?: string;
    shopName?: string;
    businessName?: string;
    location?: string;
    verified?: boolean;
    type?: string;
  };
  status: string;
  isActive: boolean;
  isFeatured?: boolean;
  featuredPriority?: number;
  featuredUntil?: string | null;
  trendingScore?: number;
  trendingUpdatedAt?: string | null;
  ordersLast24h?: number;
  viewsLast24h?: number;
  cartAddsLast24h?: number;
  wishlistLast24h?: number;
  views: number;
  sales: number;
  rating: { average: number; count: number };
  createdAt: string;
  updatedAt: string;
}

export const productsAPI = {
  create: async (data: ProductData): Promise<{ product: Product }> => {
    let imageUrls: string[] = [];
    if (data.images?.length) {
      for (const file of data.images) {
        const { url } = await uploadAPI.uploadImage(file);
        imageUrls.push(url);
      }
    }
    const body: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      category: data.category,
      price: Number(data.price),
      stock: Number(data.stock),
      images: imageUrls.length
        ? imageUrls
        : (data.images as unknown as string[]) || [],
      isActive: data.isActive !== false,
    };
    if (data.originalPrice != null && data.originalPrice !== 0)
      body.originalPrice = Number(data.originalPrice);
    if (data.subcategory?.trim()) body.subcategory = data.subcategory.trim();
    if (data.sku?.trim()) body.sku = data.sku.trim();
    if (data.detailedTitle != null && String(data.detailedTitle).trim())
      body.detailedTitle = String(data.detailedTitle).trim();
    if (Array.isArray(data.tags) && data.tags.length > 0) body.tags = data.tags;
    if (Array.isArray(data.specifications) && data.specifications.length > 0)
      body.specifications = data.specifications;
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      body.variants = data.variants
        .map((v) => ({
          name: String((v as { name?: string }).name ?? "").trim(),
          options: normalizeVariantOptions(
            (v as { options?: unknown }).options,
          ),
        }))
        .filter((v) => v.name.length > 0 && v.options.length > 0);
    }
    if (
      data.orderPickupLocation != null &&
      String(data.orderPickupLocation).trim()
    ) {
      body.orderPickupLocation = String(data.orderPickupLocation).trim();
    }

    const response = await api.post("/products", body);
    const result = response.data?.data ?? response.data;
    const product = (result?.product ?? result) as Product;
    return { product };
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    featured?: boolean;
    ids?: string[];
  }): Promise<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const { featured, ...rest } = params ?? {};
    const query: Record<string, unknown> = { ...rest };
    if (featured === true) query.featured = true;
    const response = await api.get("/products", { params: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<{ product: Product }> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  recordView: async (id: string): Promise<{ counted: boolean }> => {
    const response = await api.post(`/products/${id}/view`);
    const payload = response.data?.data ?? response.data;
    return payload as { counted: boolean };
  },

  getHomeShelves: async (): Promise<{
    featured: Product[];
    discounts: Product[];
    trending: Product[];
    newArrivals: Product[];
  }> => {
    const response = await api.get("/products/home-shelves");
    const data = response.data?.data ?? response.data;
    return {
      featured: Array.isArray(data?.featured) ? (data.featured as Product[]) : [],
      discounts: Array.isArray(data?.discounts)
        ? (data.discounts as Product[])
        : [],
      trending: Array.isArray(data?.trending) ? (data.trending as Product[]) : [],
      newArrivals: Array.isArray(data?.newArrivals)
        ? (data.newArrivals as Product[])
        : [],
    };
  },

  getBySeller: async (
    sellerId: string,
    params?: { page?: number; limit?: number; status?: string },
  ): Promise<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await api.get(`/products/seller/${sellerId}`, { params });
    return response.data.data;
  },

  getCurrentSellerProducts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await api.get("/products/seller-self", { params });
    return response.data.data;
  },

  update: async (
    id: string,
    data: Omit<Partial<ProductData>, "images"> & { images?: string[] },
  ): Promise<{ product: Product }> => {
    const { sellerId: _s, ...rest } = data as Record<string, unknown>;
    const skip = new Set(["dimensions", "brand", "weight", "discountPercent"]);
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined && !skip.has(key)) body[key] = value;
    }
    if (Array.isArray(body.variants)) {
      body.variants = (
        body.variants as Array<{ name?: string; options?: unknown }>
      )
        .map((v) => ({
          name: String(v?.name ?? "").trim(),
          options: normalizeVariantOptions(v?.options),
        }))
        .filter((v) => v.name.length > 0 && v.options.length > 0);
    }
    const response = await api.put(`/products/${id}`, body);
    const result = response.data?.data ?? response.data;
    const product = (result?.product ?? result) as Product;
    return { product };
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  getCategories: async (): Promise<{ categories: string[] }> => {
    const response = await api.get("/categories", { params: { limit: 1000 } });
    const data = response.data?.data ?? response.data;
    const raw = data?.categories;
    if (!Array.isArray(raw)) return { categories: [] };
    const categories = raw
      .map((c: { name?: string } | string) =>
        typeof c === "string" ? c : (c?.name ?? ""),
      )
      .filter(Boolean);
    return { categories };
  },

  checkSkuAvailability: async (
    sku: string,
  ): Promise<{ available: boolean; sku: string }> => {
    const response = await api.get("/products/check-sku", { params: { sku } });
    const data = response.data?.data ?? response.data;
    return {
      available: !!data?.available,
      sku: String(data?.sku ?? ""),
    };
  },

  getTrending: async (limit?: number): Promise<{ products: Product[] }> => {
    const response = await api.get("/products", {
      params: { limit: limit ?? 10, sortBy: "views", sortOrder: "desc" },
    });
    const data = response.data?.data ?? response.data;
    return { products: data?.products ?? [] };
  },
};
