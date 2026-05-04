import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order, OrderDocument } from "./schemas/order.schema";
import { Rider, RiderDocument } from "../riders/schemas/rider.schema";
import { ApiException } from "../../common/exceptions/api.exception";
import { SellerOrderInsightsService } from "./seller-order-insights.service";
import { OrderCheckoutService } from "./order-checkout.service";
import { OrderLifecycleService } from "./order-lifecycle.service";
import type {
  CheckoutPaymentInput,
  CheckoutShippingAddress,
} from "./checkout.types";
import { extractObjectIdString } from "./order-ref.util";

export type {
  CheckoutShippingAddress,
  CheckoutPaymentInput,
} from "./checkout.types";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    private sellerOrderInsightsService: SellerOrderInsightsService,
    private orderCheckoutService: OrderCheckoutService,
    private orderLifecycleService: OrderLifecycleService,
  ) {}

  /**
   * Merge Rider profile (address, ID, ID card image, phone) onto populated `assignedRiderId` for seller order views.
   */
  private async attachRiderProfileToOrders(
    orders: Record<string, unknown>[],
  ): Promise<void> {
    const userIds = new Set<string>();
    for (const o of orders) {
      const ar = o.assignedRiderId;
      if (!ar || typeof ar !== "object") continue;
      const uid = extractObjectIdString(
        (ar as { _id?: unknown })._id ?? ar,
      );
      if (uid) userIds.add(uid);
    }
    if (userIds.size === 0) return;
    const oids = [...userIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (oids.length === 0) return;
    const riders = await this.riderModel
      .find({ userId: { $in: oids } })
      .select("userId address idNumber idCardDocumentUrl phone")
      .lean()
      .exec();
    const map = new Map(riders.map((r) => [String(r.userId), r]));
    for (const o of orders) {
      const ar = o.assignedRiderId;
      if (!ar || typeof ar !== "object") continue;
      const uid = extractObjectIdString(
        (ar as { _id?: unknown })._id ?? ar,
      );
      if (!uid) continue;
      const rdoc = map.get(uid);
      if (!rdoc) continue;
      const arObj = ar as Record<string, unknown>;
      arObj.riderAddress = rdoc.address;
      arObj.riderIdNumber = rdoc.idNumber;
      arObj.idCardDocumentUrl = rdoc.idCardDocumentUrl;
      const riderPhone = rdoc.phone != null ? String(rdoc.phone).trim() : "";
      if (riderPhone && (!arObj.phone || String(arObj.phone).trim() === "")) {
        arObj.phone = riderPhone;
      }
    }
  }

  async create(data: Partial<Order>): Promise<OrderDocument> {
    if (!data.orderNumber) {
      const date = new Date();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const todayStart = new Date(y, date.getMonth(), date.getDate());
      const todayEnd = new Date(y, date.getMonth(), date.getDate() + 1);
      const count = await this.orderModel.countDocuments({
        createdAt: { $gte: todayStart, $lt: todayEnd },
      });
      (data as Order).orderNumber =
        `ORD-${y}${m}${d}-${String(count + 1).padStart(4, "0")}`;
    }
    const order = new this.orderModel(data);
    return order.save();
  }

  async findAll(page = 1, limit = 20, customerId?: string) {
    const query: Record<string, unknown> = {};
    if (customerId && Types.ObjectId.isValid(customerId)) {
      query.customer = new Types.ObjectId(customerId);
    }
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate("customer", "firstName lastName email phone")
        .populate("items.product")
        .populate("assignedRiderId", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(query).exec(),
    ]);
    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Orders that include at least one line item sold by this seller (seller user id on items.seller). */
  async findAllForSeller(page = 1, limit = 20, sellerUserId?: string) {
    if (!sellerUserId || !Types.ObjectId.isValid(sellerUserId)) {
      return { orders: [], total: 0, page, limit, pages: 0 };
    }
    const query: Record<string, unknown> = {
      items: { $elemMatch: { seller: new Types.ObjectId(sellerUserId) } },
    };
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate("customer", "firstName lastName email phone")
        .populate({
          path: "items.product",
          select: "title images price sellerId",
          populate: {
            path: "sellerId",
            select:
              "businessName phone areaOfDistribution businessAddress city state zipCode country storePickupAddress",
          },
        })
        .populate("items.seller", "firstName lastName email phone")
        .populate("assignedRiderId", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(query).exec(),
    ]);
    await this.attachRiderProfileToOrders(orders as Record<string, unknown>[]);
    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getCustomersForSeller(sellerUserId?: string) {
    return this.sellerOrderInsightsService.getCustomersForSeller(sellerUserId);
  }

  async getAnalyticsForSeller(sellerUserId?: string, periodRaw?: string) {
    return this.sellerOrderInsightsService.getAnalyticsForSeller(
      sellerUserId,
      periodRaw,
    );
  }

  /** Orders assigned to this rider (delivery in progress / history). */
  async findAllForRider(page = 1, limit = 20, riderUserId?: string) {
    const query: Record<string, unknown> = {};
    if (riderUserId) {
      query.assignedRiderId = new Types.ObjectId(riderUserId);
    }
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate("customer", "firstName lastName email phone")
        .populate({
          path: "items.product",
          select: "title images sellerId",
          populate: {
            path: "sellerId",
            select:
              "businessName phone areaOfDistribution businessAddress city state zipCode country storePickupAddress",
          },
        })
        .populate("items.seller", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(query).exec(),
    ]);
    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<OrderDocument | null> {
    return this.orderModel
      .findById(id)
      .populate("customer")
      .populate("items.product")
      .exec();
  }

  async updateById(
    id: string,
    data: Partial<Order>,
  ): Promise<OrderDocument | null> {
    return this.orderModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async updateOrderStatus(
    orderId: string,
    body: { status?: string; assignedRiderId?: string | null },
    user: { id: string; role: string },
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.updateOrderStatus(orderId, body, user);
  }

  /** Count orders that have at least one item from this seller (items.seller = user id). */
  async countBySellerUserId(userId: string): Promise<number> {
    return this.orderModel
      .countDocuments({ "items.seller": new Types.ObjectId(userId) })
      .exec();
  }

  async cancelOrder(
    orderId: string,
    cancelledBy: "customer" | "seller",
    userId: string,
    reason?: string,
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.cancelOrder(
      orderId,
      cancelledBy,
      userId,
      reason,
    );
  }

  async checkout(
    customerId: string,
    shippingAddress: CheckoutShippingAddress,
    payment?: CheckoutPaymentInput,
  ): Promise<OrderDocument> {
    return this.orderCheckoutService.checkout(
      customerId,
      shippingAddress,
      payment,
    );
  }

  async checkoutBuyNow(
    customerId: string,
    shippingAddress: CheckoutShippingAddress,
    productId: string,
    quantity: number,
    payment?: CheckoutPaymentInput,
    variantLabel?: string,
  ): Promise<OrderDocument> {
    return this.orderCheckoutService.checkoutBuyNow(
      customerId,
      shippingAddress,
      productId,
      quantity,
      payment,
      variantLabel,
    );
  }

  /** Orders visible to riders for pickup: ready_for_delivery and not yet assigned */
  async findAvailableForRider(page = 1, limit = 20) {
    const query: Record<string, unknown> = {
      status: {
        $in: ["pending", "confirmed", "processing", "ready_for_delivery"],
      },
      $or: [{ assignedRiderId: null }, { assignedRiderId: { $exists: false } }],
    };

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate("customer", "firstName lastName email phone")
        .populate({
          path: "items.product",
          select: "title images price sellerId",
          populate: {
            path: "sellerId",
            select:
              "businessName phone areaOfDistribution businessAddress city state zipCode country storePickupAddress",
          },
        })
        .populate("items.seller", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(query).exec(),
    ]);
    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Rider picks order: assign rider and set status to picked (no longer available to others).
   * Uses a single conditional update so two riders cannot both "win" — only the first matching
   * update succeeds; MongoDB applies one write per document atomically.
   */
  async assignRider(
    orderId: string,
    riderUserId: string,
  ): Promise<OrderDocument | null> {
    const riderOid = new Types.ObjectId(riderUserId);
    /** Must match findAvailableForRider + still unassigned (prevents read–modify–write races). */
    const filter = {
      _id: orderId,
      status: {
        $in: ["pending", "confirmed", "processing", "ready_for_delivery"],
      },
      $or: [{ assignedRiderId: null }, { assignedRiderId: { $exists: false } }],
    };

    const updated = await this.orderModel
      .findOneAndUpdate(
        filter,
        [
          {
            $set: {
              assignedRiderId: riderOid,
              status: {
                $cond: {
                  if: { $eq: ["$status", "ready_for_delivery"] },
                  then: "picked",
                  else: "$status",
                },
              },
            },
          },
        ],
        { new: true },
      )
      .populate("customer", "firstName lastName email")
      .populate({
        path: "items.product",
        select: "title images price sellerId",
        populate: {
          path: "sellerId",
          select:
            "businessName phone areaOfDistribution businessAddress city state zipCode country storePickupAddress",
        },
      })
      .populate("items.seller", "firstName lastName email phone")
      .exec();

    if (updated) return updated;

    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) return null;
    const status = (order as { status: string }).status;
    if (
      !["pending", "confirmed", "processing", "ready_for_delivery"].includes(
        status,
      )
    ) {
      throw ApiException.badRequest(
        `Order status is '${status}' and no longer available for new riders to pick up.`,
      );
    }
    if ((order as { assignedRiderId?: unknown }).assignedRiderId) {
      throw ApiException.badRequest("Order is already assigned to a rider.");
    }
    throw ApiException.conflict(
      "Could not pick this order. It may have just been taken; refresh the list.",
    );
  }
}
