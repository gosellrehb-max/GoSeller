"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { cartAPI, Cart, Product, productsAPI } from '../services/api';
import { calculatePrices } from '../utils/productDiscount';
import { useAuth } from './AuthContext';

function cartLineUnitPrice(item: NonNullable<Cart['items']>[number]): number {
  const p = item.product as Product | null | undefined;
  if (p && typeof p === 'object' && 'price' in p && p.price != null) {
    return calculatePrices(p).finalPrice;
  }
  return Number(item.price) || 0;
}

/** Any JWT the API client will send (customer or seller) — cart is tied to user id. */
function hasCartSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('authToken') || localStorage.getItem('sellerToken'));
}

export const GUEST_CART_MESSAGE =
  'Please log in or sign up to add items to your cart.';

const GUEST_CART_STORAGE_KEY = 'goseller_guest_cart_v1';
const MAX_CART_QTY = 99;

type GuestCartItem = {
  _id: string;
  productId: string;
  quantity: number;
  price: number;
  variantKey?: string;
  variantLabel?: string;
  product?: Product;
  addedAt?: string;
};

function normalizeQty(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_CART_QTY, Math.max(1, Math.floor(n)));
}

function cartLineKey(productId: string, variantKey?: string): string {
  return `${String(productId)}::${String(variantKey ?? '')}`;
}

function readGuestCartItems(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const map = new Map<string, GuestCartItem>();
    for (const row of parsed) {
      const r = row as Partial<GuestCartItem> | null;
      if (!r || !r.productId) continue;
      const key = cartLineKey(String(r.productId), r.variantKey);
      const qty = normalizeQty(r.quantity);
      const existing = map.get(key);
      if (existing) {
        existing.quantity = normalizeQty(existing.quantity + qty);
      } else {
        map.set(key, {
          _id: String(r._id || `guest-${Math.random().toString(36).slice(2, 11)}`),
          productId: String(r.productId),
          quantity: qty,
          price: Number(r.price) || 0,
          variantKey: r.variantKey ?? '',
          variantLabel: r.variantLabel ?? '',
          product: r.product as Product | undefined,
          addedAt: r.addedAt || new Date().toISOString(),
        });
      }
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

function writeGuestCartItems(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
}

function clearGuestCartItems(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

function guestItemsToCart(items: GuestCartItem[]): Cart {
  return {
    _id: 'guest-cart',
    userId: 'guest',
    items: items.map((item) => ({
      _id: item._id,
      product: item.product ?? ({ _id: item.productId } as Product),
      quantity: normalizeQty(item.quantity),
      price: Number(item.price) || 0,
      variantKey: item.variantKey ?? '',
      variantLabel: item.variantLabel ?? '',
      addedAt: item.addedAt,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Cart State Interface
interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
}

// Cart Action Types
type CartAction =
  | { type: 'CART_LOADING' }
  | { type: 'CART_SUCCESS'; payload: Cart }
  | { type: 'CART_ERROR'; payload: string }
  | { type: 'CART_UPDATING' }
  | { type: 'CART_CLEAR' }
  | { type: 'CLEAR_ERROR' };

// Cart Context Interface
interface CartContextType extends CartState {
  addToCart: (
    product: Product,
    quantity: number,
    variantMeta?: { variantKey: string; variantLabel: string },
  ) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  loadCart: () => Promise<void>;
  clearError: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  /**
   * True if this product is in the cart. If `variantKey` is passed, only the matching line counts
   * (same product with different options is a separate line). If omitted, any line with that product matches.
   */
  isProductInCart: (productId: string | undefined | null, variantKey?: string) => boolean;
}

// Initial State
const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
  isUpdating: false,
};

// Cart Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'CART_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'CART_SUCCESS':
      return {
        ...state,
        cart: action.payload,
        isLoading: false,
        error: null,
        isUpdating: false,
      };
    case 'CART_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isUpdating: false,
      };
    case 'CART_UPDATING':
      return {
        ...state,
        isUpdating: true,
        error: null,
      };
    case 'CART_CLEAR':
      return {
        ...state,
        cart: null,
        isLoading: false,
        error: null,
        isUpdating: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider Props
interface CartProviderProps {
  children: ReactNode;
}

// Cart Provider Component
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  const mergeGuestCartIntoServer = useCallback(async (serverCart: Cart): Promise<Cart> => {
    const guestItems = readGuestCartItems();
    if (!guestItems.length) return serverCart;

    // --- Batch-validate all guest product IDs in a single request ---
    // Previously this was N individual GET /products/:id calls.
    const guestProductIds = Array.from(
      new Set(guestItems.map((g) => String(g.productId || '').trim()).filter(Boolean)),
    );
    const validProductIds = new Set<string>();
    try {
      const batchRes = await productsAPI.getAll({ ids: guestProductIds });
      for (const p of batchRes?.products ?? []) {
        const pid = String((p as any)._id ?? (p as any).id ?? '').trim();
        if (pid && (p as any).status !== 'rejected' && (p as any).isActive !== false) {
          validProductIds.add(pid);
        }
      }
    } catch {
      // If the batch fetch fails, be optimistic — let the cart API reject bad IDs.
      guestProductIds.forEach((id) => validProductIds.add(id));
    }

    let currentCart = serverCart;
    const existingByKey = new Map<string, NonNullable<Cart['items']>[number]>();
    for (const item of currentCart.items ?? []) {
      const p = item.product as { _id?: string; id?: string } | null | undefined;
      const pid = p?._id != null ? String(p._id) : p?.id != null ? String(p.id) : '';
      if (!pid) continue;
      existingByKey.set(cartLineKey(pid, item.variantKey), item);
    }

    for (const guest of guestItems) {
      const productId = String(guest.productId || '').trim();
      if (!productId || !validProductIds.has(productId)) continue;
      const qty = normalizeQty(guest.quantity);

      const key = cartLineKey(productId, guest.variantKey);
      const existing = existingByKey.get(key);
      if (existing) {
        const mergedQty = normalizeQty((Number(existing.quantity) || 0) + qty);
        const updated = await cartAPI.updateItem(String(existing._id), { quantity: mergedQty });
        currentCart = updated.cart;
        const updatedLine = (currentCart.items || []).find((it) => String(it._id) === String(existing._id));
        if (updatedLine) existingByKey.set(key, updatedLine);
      } else {
        try {
          const added = await cartAPI.addItem({
            productId,
            quantity: qty,
            price: Number(guest.price) || 0,
            variantKey: guest.variantKey ?? '',
            variantLabel: guest.variantLabel ?? '',
          });
          currentCart = added.cart;
          const newLine = (currentCart.items || []).find((it) => {
            const p = it.product as { _id?: string; id?: string } | null | undefined;
            const pid = p?._id != null ? String(p._id) : p?.id != null ? String(p.id) : '';
            return cartLineKey(pid, it.variantKey) === key;
          });
          if (newLine) existingByKey.set(key, newLine);
        } catch {
          // Item rejected by the cart API (e.g. out of stock) — skip it.
        }
      }
    }

    clearGuestCartItems();
    return currentCart;
  }, []);

  const loadCart = useCallback(async () => {
    if (!hasCartSession()) {
      const guestItems = readGuestCartItems();
      dispatch({ type: 'CART_SUCCESS', payload: guestItemsToCart(guestItems) });
      return;
    }
    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await cartAPI.getCart();
      const merged = await mergeGuestCartIntoServer(response.cart);
      dispatch({ type: 'CART_SUCCESS', payload: merged });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || error.message || 'Failed to load cart',
      });
    }
  }, [mergeGuestCartIntoServer]);

  // Wait for AuthContext to finish resolving before loading cart.
  // Without this guard the effect fires twice: once on mount (when isAuthenticated is still
  // false but a token may already be in localStorage) and again when isAuthenticated flips
  // to true — causing two API calls per page load.
  useEffect(() => {
    if (authIsLoading) return;
    loadCart();
  }, [loadCart, isAuthenticated, authIsLoading]);

  const addToCart = useCallback(
    async (
      product: Product,
      quantity: number,
      variantMeta?: { variantKey: string; variantLabel: string },
    ) => {
    const productId = String((product as any)._id ?? (product as any).id ?? '').trim();
    if (!productId) return;
    const qty = normalizeQty(quantity);
    try {
      dispatch({ type: 'CART_UPDATING' });
      if (!hasCartSession()) {
        const current = readGuestCartItems();
        const key = cartLineKey(productId, variantMeta?.variantKey);
        const existingIdx = current.findIndex((it) => cartLineKey(it.productId, it.variantKey) === key);
        const price = calculatePrices(product).finalPrice;
        if (existingIdx >= 0) {
          current[existingIdx] = {
            ...current[existingIdx],
            quantity: normalizeQty((current[existingIdx].quantity || 0) + qty),
            price: Number(current[existingIdx].price) || price,
          };
        } else {
          current.push({
            _id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            productId,
            quantity: qty,
            price,
            variantKey: variantMeta?.variantKey ?? '',
            variantLabel: variantMeta?.variantLabel ?? '',
            product,
            addedAt: new Date().toISOString(),
          });
        }
        writeGuestCartItems(current);
        dispatch({ type: 'CART_SUCCESS', payload: guestItemsToCart(current) });
        return;
      }

      const response = await cartAPI.addItem({
        productId,
        quantity: qty,
        price: calculatePrices(product).finalPrice,
        variantKey: variantMeta?.variantKey ?? '',
        variantLabel: variantMeta?.variantLabel ?? '',
      });
      const merged = await mergeGuestCartIntoServer(response.cart);
      dispatch({ type: 'CART_SUCCESS', payload: merged });
    } catch (error: any) {
      const status = error.response?.status;
      const msg =
        status === 401
          ? GUEST_CART_MESSAGE
          : error.response?.data?.message || error.message || 'Failed to add item to cart';
      dispatch({ type: 'CART_ERROR', payload: msg });
      if (status === 401) {
        toast.error(msg);
      }
    }
  },
  [mergeGuestCartIntoServer],
  );

  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: 'CART_UPDATING' });
      const qty = normalizeQty(quantity);
      if (!hasCartSession()) {
        const current = readGuestCartItems();
        const idx = current.findIndex((it) => String(it._id) === String(itemId));
        if (idx < 0) {
          dispatch({ type: 'CART_SUCCESS', payload: guestItemsToCart(current) });
          return;
        }
        current[idx] = { ...current[idx], quantity: qty };
        writeGuestCartItems(current);
        dispatch({ type: 'CART_SUCCESS', payload: guestItemsToCart(current) });
        return;
      }
      const response = await cartAPI.updateItem(itemId, { quantity });
      dispatch({ type: 'CART_SUCCESS', payload: response.cart });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || error.message || 'Failed to update cart item',
      });
    }
  }, []);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      dispatch({ type: 'CART_UPDATING' });
      if (!hasCartSession()) {
        const current = readGuestCartItems().filter((it) => String(it._id) !== String(itemId));
        writeGuestCartItems(current);
        dispatch({ type: 'CART_SUCCESS', payload: guestItemsToCart(current) });
        return;
      }
      const response = await cartAPI.removeItem(itemId);
      dispatch({ type: 'CART_SUCCESS', payload: response.cart });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || error.message || 'Failed to remove item from cart',
      });
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      dispatch({ type: 'CART_UPDATING' });
      if (!hasCartSession()) {
        clearGuestCartItems();
        dispatch({ type: 'CART_SUCCESS', payload: guestItemsToCart([]) });
        return;
      }
      const response = await cartAPI.clear();
      dispatch({ type: 'CART_SUCCESS', payload: response.cart });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || error.message || 'Failed to clear cart',
      });
    }
  }, []);

  const applyCoupon = useCallback(async (_code: string) => {
    dispatch({ type: 'CART_ERROR', payload: 'Coupons are not supported yet.' });
  }, []);

  const removeCoupon = useCallback(async () => {
    dispatch({ type: 'CART_ERROR', payload: 'Coupons are not supported yet.' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const getCartItemCount = useCallback((): number => {
    if (!state.cart?.items) return 0;
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.cart]);

  const getCartTotal = useCallback((): number => {
    if (!state.cart?.items?.length) return 0;
    const subtotal = state.cart.items.reduce(
      (sum, item) => sum + cartLineUnitPrice(item) * (Number(item.quantity) || 0),
      0,
    );
    const discount = Number(state.cart.appliedCoupon?.discount ?? 0);
    return Math.max(0, subtotal - discount);
  }, [state.cart]);

  const isProductInCart = useCallback(
    (productId: string | undefined | null, variantKey?: string): boolean => {
      if (productId == null || productId === '' || !state.cart?.items?.length) return false;
      const want = String(productId);
      return state.cart.items.some((item) => {
        const p = item.product as { _id?: string; id?: string } | null | undefined;
        if (!p) return false;
        const pid = p._id != null ? String(p._id) : p.id != null ? String(p.id) : '';
        if (pid !== want) return false;
        if (variantKey === undefined) return true;
        return (item.variantKey ?? '') === variantKey;
      });
    },
    [state.cart],
  );

  const value: CartContextType = useMemo(
    () => ({
      ...state,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      loadCart,
      clearError,
      getCartItemCount,
      getCartTotal,
      isProductInCart,
    }),
    [
      state,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      loadCart,
      clearError,
      getCartItemCount,
      getCartTotal,
      isProductInCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
