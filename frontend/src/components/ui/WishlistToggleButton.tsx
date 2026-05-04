"use client";

import { FiHeart } from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";
import {
  addWishlistId,
  isWishlistId,
  removeWishlistId,
} from "@/utils/wishlist";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { withReturnUrl } from "@/features/auth/utils/returnUrl";

type WishlistToggleButtonProps = {
  productId: string;
  className?: string;
  iconClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  label?: string;
  showLabel?: boolean;
};

export function WishlistToggleButton({
  productId,
  className = "",
  iconClassName = "h-4 w-4",
  activeClassName = "text-red-600",
  inactiveClassName = "text-slate-500",
  label = "Wishlist",
  showLabel = false,
}: WishlistToggleButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const wishlisted = isWishlistId(productId, wishlistIds);

  const handleToggle = () => {
    if (!productId) return;
    if (!isAuthenticated) {
      router.push(withReturnUrl('/login/customer', pathname));
      return;
    }
    if (wishlisted) {
      removeWishlistId(productId);
      return;
    }
    addWishlistId(productId);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? `Remove from wishlist` : `Add to wishlist`}
      className={className}
    >
      <FiHeart
        className={`${iconClassName} ${wishlisted ? `${activeClassName} fill-current` : inactiveClassName}`}
        aria-hidden
      />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
