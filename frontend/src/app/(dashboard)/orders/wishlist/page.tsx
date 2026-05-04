import { redirect } from "next/navigation";

export default function WishlistPage() {
  redirect("/orders?section=wishlist");
}
