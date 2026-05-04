import { api } from "../http/client";
import type { Product } from "./products";

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
  variantKey?: string;
  variantLabel?: string;
  addedAt?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  appliedCoupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    discount: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const cartAPI = {
  getCart: async (): Promise<{ cart: Cart }> => {
    const response = await api.get("/cart");
    const payload = response.data?.data ?? response.data;
    return payload as { cart: Cart };
  },

  addItem: async (body: {
    productId: string;
    quantity?: number;
    price: number;
    variantKey?: string;
    variantLabel?: string;
  }): Promise<{ cart: Cart }> => {
    const response = await api.post("/cart/items", body);
    const payload = response.data?.data ?? response.data;
    return payload as { cart: Cart };
  },

  updateItem: async (
    itemId: string,
    body: { quantity: number },
  ): Promise<{ cart: Cart }> => {
    const response = await api.put(`/cart/items/${itemId}`, body);
    const payload = response.data?.data ?? response.data;
    return payload as { cart: Cart };
  },

  removeItem: async (itemId: string): Promise<{ cart: Cart }> => {
    const response = await api.delete(`/cart/items/${itemId}`);
    const payload = response.data?.data ?? response.data;
    return payload as { cart: Cart };
  },

  clear: async (): Promise<{ cart: Cart }> => {
    const response = await api.delete("/cart");
    const payload = response.data?.data ?? response.data;
    return payload as { cart: Cart };
  },
};
