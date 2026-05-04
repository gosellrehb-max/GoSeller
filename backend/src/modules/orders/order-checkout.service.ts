import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Order,
  OrderDocument,
  OrderItem,
  ShippingAddress,
} from "./schemas/order.schema";
import { CartService } from "../cart/cart.service";
import { ProductsService } from "../products/products.service";
import { effectiveUnitPrice } from "../products/product-pricing.util";
import { SellerService } from "../seller/seller.service";
import { ApiException } from "../../common/exceptions/api.exception";
import type {
  CheckoutPaymentInput,
  CheckoutShippingAddress,
} from "./checkout.types";
import { extractObjectIdString, extractProductSellerId } from "./order-ref.util";

@Injectable()
export class OrderCheckoutService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
    private productsService: ProductsService,
    private sellerService: SellerService,
  ) {}

  /** Map checkout payment choice to stored payment block. */
  private buildPaymentForOrder(
    totalAmount: number,
    payment?: CheckoutPaymentInput,
  ) {
    const currency = "USD";
    if (!payment?.method) {
      return {
        method: "dummy" as const,
        status: "completed" as const,
        amount: totalAmount,
        currency,
      };
    }
    switch (payment.method) {
      case "cod":
        return {
          method: "cash_on_delivery" as const,
          status: "pending" as const,
          amount: totalAmount,
          currency,
        };
      case "card":
        return {
          method: "credit_card" as const,
          status: "completed" as const,
          amount: totalAmount,
          currency,
          transactionId: payment.reference ?? `CARD-${Date.now()}`,
        };
      case "jazzcash":
        return {
          method: "jazzcash" as const,
          status: "completed" as const,
          amount: totalAmount,
          currency,
          transactionId: payment.reference ?? `JC-${Date.now()}`,
        };
      case "easypaisa":
        return {
          method: "easypaisa" as const,
          status: "completed" as const,
          amount: totalAmount,
          currency,
          transactionId: payment.reference ?? `EP-${Date.now()}`,
        };
      default:
        return {
          method: "dummy" as const,
          status: "completed" as const,
          amount: totalAmount,
          currency,
        };
    }
  }

  /**
   * Deduct stock for each line (atomic per product). Rolls back prior lines if any line fails.
   */
  private async deductStockForLineItems(
    orderItems: OrderItem[],
  ): Promise<void> {
    const applied: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const line of orderItems) {
        const raw = (line as { product: Types.ObjectId | string }).product;
        const productId =
          raw instanceof Types.ObjectId ? raw.toString() : String(raw);
        const quantity = Number((line as { quantity: number }).quantity);
        const ok = await this.productsService.decrementStockIfAvailable(
          productId,
          quantity,
        );
        if (!ok) {
          throw ApiException.badRequest(
            `Insufficient stock for one or more products (product ${productId}). Refresh and try again.`,
          );
        }
        applied.push({ productId, quantity });
      }
    } catch (e) {
      for (const a of applied.reverse()) {
        await this.productsService.incrementStock(a.productId, a.quantity);
      }
      throw e;
    }
  }

  /** Restore stock if order persistence fails after deduction. */
  private async restoreStockForLineItems(
    orderItems: OrderItem[],
  ): Promise<void> {
    for (const line of orderItems) {
      const raw = (line as { product: Types.ObjectId | string }).product;
      const productId =
        raw instanceof Types.ObjectId ? raw.toString() : String(raw);
      const quantity = Number((line as { quantity: number }).quantity);
      await this.productsService.incrementStock(productId, quantity);
    }
  }

  /** Persist order; does not touch cart. Deducts product stock atomically before save. */
  private async createOrderFromLineItems(
    customerId: string,
    shippingAddress: CheckoutShippingAddress,
    orderItems: OrderItem[],
    subtotal: number,
    payment?: CheckoutPaymentInput,
  ): Promise<OrderDocument> {
    if (orderItems.length === 0)
      throw ApiException.badRequest("No valid items.");

    await this.deductStockForLineItems(orderItems);

    const shippingCost = 0;
    const tax = 0;
    const discount = 0;
    const totalAmount = subtotal + shippingCost + tax - discount;

    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const todayStart = new Date(y, date.getMonth(), date.getDate());
    const todayEnd = new Date(y, date.getMonth(), date.getDate() + 1);
    const count = await this.orderModel
      .countDocuments({
        createdAt: { $gte: todayStart, $lt: todayEnd },
      })
      .exec();
    const orderNumber = `ORD-${y}${m}${d}-${String(count + 1).padStart(4, "0")}`;

    const order = new this.orderModel({
      orderNumber,
      customer: new Types.ObjectId(customerId),
      items: orderItems,
      status: "ready_for_delivery",
      totalAmount,
      subtotal,
      tax,
      shippingCost,
      discount,
      shippingAddress: shippingAddress as ShippingAddress,
      payment: this.buildPaymentForOrder(totalAmount, payment),
    });

    let saved: OrderDocument;
    try {
      saved = await order.save();
    } catch (e) {
      await this.restoreStockForLineItems(orderItems);
      throw e;
    }

    const orderId = (saved as { _id: { toString(): string } })._id.toString();
    const populatedOrder = await this.orderModel
      .findById(orderId)
      .populate("customer")
      .populate("items.product")
      .exec();
    return populatedOrder ?? saved;
  }

  /**
   * Checkout: create order from current cart, dummy payment, then clear cart.
   * Orders are created with status `ready_for_delivery` (payment is treated as complete for Phase-1)
   * so that riders can immediately pick them up without an admin confirmation step.
   */
  async checkout(
    customerId: string,
    shippingAddress: CheckoutShippingAddress,
    payment?: CheckoutPaymentInput,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw ApiException.badRequest("Invalid customer account.");
    }

    const cart = await this.cartService.findByUserId(customerId);
    if (!cart || !cart.items?.length) {
      throw ApiException.badRequest(
        "Cart is empty. Add products before checkout.",
      );
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const productRef = (
        item as {
          product:
            | Types.ObjectId
            | { _id: Types.ObjectId; sellerId?: Types.ObjectId };
        }
      ).product;
      const productId = extractObjectIdString(productRef);
      if (!productId) continue;
      const product = await this.productsService.findById(productId);
      if (!product)
        throw ApiException.badRequest(`Product not found: ${productId}`);

      const sellerId = extractProductSellerId(product);
      if (!sellerId) {
        const title = (product as { title?: string }).title ?? productId;
        throw ApiException.badRequest(
          `Product "${title}"'s seller is no longer available.`,
        );
      }

      const seller = await this.sellerService.findById(sellerId);
      if (!seller)
        throw ApiException.badRequest(
          `Seller not found for product: ${productId}`,
        );

      const sellerUserObjId = extractObjectIdString(
        (seller as { userId: unknown }).userId,
      );
      if (!sellerUserObjId)
        throw ApiException.badRequest(
          `Seller user not found for product: ${productId}`,
        );

      const quantity = (item as { quantity: number }).quantity;
      const stock = (product as { stock?: number }).stock ?? 0;
      if (quantity > stock) {
        const title = (product as { title?: string }).title ?? "Product";
        throw ApiException.badRequest(
          `Not enough stock for "${title}". Only ${stock} unit(s) available.`,
        );
      }
      const unit = effectiveUnitPrice(product as any);
      const totalPrice = unit * quantity;
      subtotal += totalPrice;

      const variantLabel = String(
        (item as { variantLabel?: string }).variantLabel ?? "",
      ).trim();
      orderItems.push({
        product: new Types.ObjectId(productId),
        quantity,
        price: unit,
        totalPrice,
        seller: new Types.ObjectId(sellerUserObjId),
        status: "pending",
        ...(variantLabel ? { variantLabel } : {}),
      } as OrderItem);
    }

    if (orderItems.length === 0)
      throw ApiException.badRequest("No valid items in cart.");

    const saved = await this.createOrderFromLineItems(
      customerId,
      shippingAddress,
      orderItems,
      subtotal,
      payment,
    );
    await this.cartService.clear(customerId);
    return saved;
  }

  /**
   * Buy now: place order for a single product + quantity without using the cart.
   */
  async checkoutBuyNow(
    customerId: string,
    shippingAddress: CheckoutShippingAddress,
    productId: string,
    quantity: number,
    payment?: CheckoutPaymentInput,
    variantLabel?: string,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw ApiException.badRequest("Invalid customer account.");
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw ApiException.badRequest("Invalid product id.");
    }

    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      throw ApiException.badRequest("Quantity must be at least 1.");
    }

    const product = await this.productsService.findById(productId);
    if (!product) throw ApiException.badRequest("Product not found.");

    const stock = (product as { stock?: number }).stock ?? 0;
    if (qty > stock) {
      throw ApiException.badRequest(
        `Only ${stock} item(s) available in stock.`,
      );
    }

    const sellerId = extractProductSellerId(product);
    if (!sellerId) {
      throw ApiException.badRequest(
        "This product's seller is no longer available.",
      );
    }

    const seller = await this.sellerService.findById(sellerId);
    if (!seller)
      throw ApiException.badRequest("Seller not found for this product.");

    const sellerUserObjId = extractObjectIdString(
      (seller as { userId: unknown }).userId,
    );
    if (!sellerUserObjId)
      throw ApiException.badRequest("Seller user not found for this product.");

    const unitPrice = effectiveUnitPrice(product as any);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw ApiException.badRequest("Invalid product price.");
    }

    const totalPrice = unitPrice * qty;
    const subtotal = totalPrice;

    const vl = typeof variantLabel === "string" ? variantLabel.trim() : "";

    const orderItems: OrderItem[] = [
      {
        product: new Types.ObjectId(productId),
        quantity: qty,
        price: unitPrice,
        totalPrice,
        seller: new Types.ObjectId(sellerUserObjId),
        status: "pending",
        ...(vl ? { variantLabel: vl } : {}),
      } as OrderItem,
    ];

    return this.createOrderFromLineItems(
      customerId,
      shippingAddress,
      orderItems,
      subtotal,
      payment,
    );
  }
}
