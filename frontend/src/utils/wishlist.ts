"use client";

import { useEffect, useMemo, useState } from "react";
import { wishlistAPI } from "@/services/api";

const GUEST_STORAGE_KEY = "gosellr_wishlist_guest";
const USER_STORAGE_PREFIX = "gosellr_wishlist_user_";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("authToken") || "";
}

function parseJwtUserId(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64)) as { id?: string; sub?: string };
    return String(payload.id ?? payload.sub ?? "");
  } catch {
    return "";
  }
}

function getStorageKey(): string {
  const token = getAuthToken();
  const userId = parseJwtUserId(token);
  return userId ? `${USER_STORAGE_PREFIX}${userId}` : GUEST_STORAGE_KEY;
}

function readWishlistIdsFromKey(storageKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .filter((x): x is string => typeof x === "string" && x.length > 0)
          .slice(0, 200),
      ),
    );
  } catch {
    return [];
  }
}

function writeWishlistIdsToKey(storageKey: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    storageKey,
    JSON.stringify(
      Array.from(
        new Set(ids.filter((id) => typeof id === "string" && id.length > 0)),
      ).slice(0, 200),
    ),
  );
}

function clearWishlistKey(storageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}

function readRemoteWishlistIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return Array.from(
    new Set(
      items
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as {
            product?: { _id?: string; id?: string } | string;
          };
          if (typeof row.product === "string") return row.product;
          if (row.product && typeof row.product === "object") {
            return String(row.product._id ?? row.product.id ?? "");
          }
          return "";
        })
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );
}

async function fetchServerWishlistIds(): Promise<string[]> {
  const token = getAuthToken();
  if (!token) return [];
  const response = await wishlistAPI.getWishlist();
  return readRemoteWishlistIds(response.wishlist?.items);
}

export async function syncGuestWishlistToServer(): Promise<string[]> {
  const token = getAuthToken();
  if (!token) return readWishlistIdsFromKey(GUEST_STORAGE_KEY);

  const userKey = getStorageKey();
  const guestIds = readWishlistIdsFromKey(GUEST_STORAGE_KEY);

  // First fetch server's current state
  let serverIds: string[];
  try {
    serverIds = await fetchServerWishlistIds();
  } catch {
    return Array.from(
      new Set([...readWishlistIdsFromKey(userKey), ...guestIds]),
    );
  }

  // IF NO GUEST ITEMS, JUST RETURN IMMEDIATELY (saves 1 full second!)
  if (guestIds.length === 0) {
    writeWishlistIdsToKey(userKey, serverIds);
    return serverIds;
  }

  // Batch-add all missing guest items in a SINGLE request instead of N individual POSTs.
  const missing = guestIds.filter((id) => !serverIds.includes(id));
  let refreshed = serverIds;
  if (missing.length > 0) {
    try {
      const result = await wishlistAPI.syncItems(missing);
      refreshed = readRemoteWishlistIds(result.wishlist?.items);
    } catch {
      // Sync failed — surface what we have locally so the UI stays consistent.
      refreshed = Array.from(new Set([...serverIds, ...guestIds]));
    }
  }

  writeWishlistIdsToKey(userKey, refreshed);
  clearWishlistKey(GUEST_STORAGE_KEY);
  return refreshed;
}

export function getWishlistIds(): string[] {
  const token = getAuthToken();
  if (!token) {
    return readWishlistIdsFromKey(GUEST_STORAGE_KEY);
  }
  const ids = readWishlistIdsFromKey(getStorageKey());
  const guestIds = readWishlistIdsFromKey(GUEST_STORAGE_KEY);
  return Array.from(new Set([...ids, ...guestIds]));
}

export function isWishlistId(
  productId: string | undefined | null,
  ids = getWishlistIds(),
): boolean {
  if (!productId) return false;
  return ids.includes(productId);
}

export function addWishlistId(productId: string): void {
  if (typeof window === "undefined" || !productId) return;
  try {
    const storageKey = getStorageKey();
    const prev = readWishlistIdsFromKey(storageKey).filter(
      (id) => id !== productId,
    );
    prev.unshift(productId);
    writeWishlistIdsToKey(storageKey, prev.slice(0, 200));
    window.dispatchEvent(new CustomEvent("gosellr-wishlist-updated"));
    if (getAuthToken()) {
      void wishlistAPI.addItem(productId).catch(() => undefined);
    }
  } catch {
    /* quota / private mode */
  }
}

export function toggleWishlistId(productId: string): boolean {
  if (typeof window === "undefined" || !productId) return false;
  const storageKey = getStorageKey();
  const ids = readWishlistIdsFromKey(storageKey);
  const next = ids.includes(productId)
    ? ids.filter((id) => id !== productId)
    : [productId, ...ids.filter((id) => id !== productId)];
  writeWishlistIdsToKey(storageKey, next.slice(0, 200));
  window.dispatchEvent(new CustomEvent("gosellr-wishlist-updated"));
  if (getAuthToken()) {
    void (
      next.includes(productId)
        ? wishlistAPI.addItem(productId)
        : wishlistAPI.removeItem(productId)
    ).catch(() => undefined);
  }
  return next.includes(productId);
}

export function removeWishlistId(productId: string): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getStorageKey();
    const next = readWishlistIdsFromKey(storageKey).filter(
      (id) => id !== productId,
    );
    writeWishlistIdsToKey(storageKey, next);
    window.dispatchEvent(new CustomEvent("gosellr-wishlist-updated"));
    if (getAuthToken()) {
      void wishlistAPI.removeItem(productId).catch(() => undefined);
    }
  } catch {
    /* quota / private mode */
  }
}

export function clearWishlistIds(): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getStorageKey();
    clearWishlistKey(storageKey);
    window.dispatchEvent(new CustomEvent("gosellr-wishlist-updated"));
    if (getAuthToken()) {
      void wishlistAPI.clear().catch(() => undefined);
    }
  } catch {
    /* quota / private mode */
  }
}

/**
 * @deprecated Use `useWishlist()` from `@/contexts/WishlistContext` instead.
 * This hook triggers API calls on every component render. The context syncs once at app startup.
 */
export function useWishlistIds(): string[] {
  const [ids, setIds] = useState<string[]>(() =>
    typeof window !== "undefined" ? getWishlistIds() : [],
  );
  const token = useMemo(
    () => (typeof window !== "undefined" ? getAuthToken() : ""),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const sync = () => setIds(getWishlistIds());

    const hydrate = async () => {
      if (!token) {
        sync();
        return;
      }
      try {
        const serverIds = await syncGuestWishlistToServer();
        if (!cancelled) setIds(serverIds);
      } catch {
        if (!cancelled) sync();
      }
    };

    void hydrate();
    window.addEventListener("gosellr-wishlist-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("gosellr-wishlist-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [token]);

  return ids;
}

/**
 * @deprecated Use `useWishlist()` from `@/contexts/WishlistContext` instead.
 * This hook triggers API calls on every component render. The context syncs once at app startup.
 */
export function useWishlistIdsWithLoading(): {
  ids: string[];
  isLoading: boolean;
} {
  const [ids, setIds] = useState<string[]>(() =>
    typeof window !== "undefined" ? getWishlistIds() : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const token = useMemo(
    () => (typeof window !== "undefined" ? getAuthToken() : ""),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const sync = () => setIds(getWishlistIds());

    const hydrate = async () => {
      if (!token) {
        sync();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const serverIds = await syncGuestWishlistToServer();
        if (!cancelled) {
          setIds(serverIds);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          sync();
          setIsLoading(false);
        }
      }
    };

    void hydrate();
    window.addEventListener("gosellr-wishlist-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("gosellr-wishlist-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [token]);

  return { ids, isLoading };
}
