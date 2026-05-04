'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncGuestWishlistToServer, getWishlistIds } from '@/utils/wishlist';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistContextType {
  ids: string[];
  isLoading: boolean;
  isInitialized: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() =>
    typeof window !== 'undefined' ? getWishlistIds() : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Wait for auth to settle before syncing.  Without the authIsLoading guard this
  // effect would fire on mount (when auth hasn't resolved yet) AND potentially again
  // right after — producing duplicate GET /wishlist calls.  Depending on isAuthenticated
  // also ensures the wishlist re-syncs whenever the user logs in or out.
  const { isLoading: authIsLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (authIsLoading) return;

    let cancelled = false;

    const hydrate = async () => {
      try {
        setIsLoading(true);
        const serverIds = await syncGuestWishlistToServer();
        if (!cancelled) {
          setIds(serverIds);
        }
      } catch {
        if (!cancelled) {
          setIds(getWishlistIds());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    void hydrate();

    const handleWishlistUpdated = () => {
      setIds(getWishlistIds());
    };

    const handleStorageChange = () => {
      setIds(getWishlistIds());
    };

    window.addEventListener('gosellr-wishlist-updated', handleWishlistUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener('gosellr-wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authIsLoading, isAuthenticated]);

  return (
    <WishlistContext.Provider value={{ ids, isLoading, isInitialized }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
