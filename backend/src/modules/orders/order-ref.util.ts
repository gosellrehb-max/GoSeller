import { Types } from "mongoose";

/**
 * Normalize ref that may be ObjectId, hex string, or populated subdocument ({ _id }).
 * Prevents CastError when populated fields are passed to findById / new ObjectId().
 */
export function extractObjectIdString(ref: unknown): string | null {
  if (ref == null) return null;
  if (ref instanceof Types.ObjectId) return ref.toString();
  if (typeof ref === "string") {
    return Types.ObjectId.isValid(ref) ? ref : null;
  }
  if (typeof ref === "object" && ref !== null && "_id" in ref) {
    const id = (ref as { _id: unknown })._id;
    if (id == null) return null;
    const s =
      typeof id === "string"
        ? id
        : ((id as Types.ObjectId).toString?.() ?? String(id));
    return Types.ObjectId.isValid(s) ? s : null;
  }
  try {
    const s = (ref as Types.ObjectId).toString?.();
    if (s && Types.ObjectId.isValid(s)) return s;
  } catch {
    /* ignore */
  }
  return null;
}

export function extractProductSellerId(product: unknown): string | null {
  if (!product || typeof product !== "object") return null;
  const record = product as { sellerId?: unknown; seller?: unknown };
  return extractObjectIdString(record.sellerId ?? record.seller);
}
