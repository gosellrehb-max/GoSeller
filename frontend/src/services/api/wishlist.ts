import { api } from "../http/client";
import type { Product } from "./products";

export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt?: string;
}

export interface Wishlist {
  _id: string;
  userId: string;
  items: WishlistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const wishlistAPI = {
  getWishlist: async (): Promise<{ wishlist: Wishlist }> => {
    const response = await api.get("/wishlist");
    const payload = response.data?.data ?? response.data;
    return payload as { wishlist: Wishlist };
  },

  addItem: async (productId: string): Promise<{ wishlist: Wishlist }> => {
    const response = await api.post(`/wishlist/items/${productId}`);
    const payload = response.data?.data ?? response.data;
    return payload as { wishlist: Wishlist };
  },

  syncItems: async (productIds: string[]): Promise<{ wishlist: Wishlist }> => {
    const response = await api.post("/wishlist/sync", { ids: productIds });
    const payload = response.data?.data ?? response.data;
    return payload as { wishlist: Wishlist };
  },

  removeItem: async (productId: string): Promise<{ wishlist: Wishlist }> => {
    const response = await api.delete(`/wishlist/items/${productId}`);
    const payload = response.data?.data ?? response.data;
    return payload as { wishlist: Wishlist };
  },

  clear: async (): Promise<{ wishlist: Wishlist }> => {
    const response = await api.delete("/wishlist");
    const payload = response.data?.data ?? response.data;
    return payload as { wishlist: Wishlist };
  },
};
