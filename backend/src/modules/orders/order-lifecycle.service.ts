import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order, OrderDocument } from "./schemas/order.schema";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  hasAnyGrantedRole,
  hasAdminGrant,
} from "../../common/auth/request-user.roles";
import { ORDER_STATUSES } from "./order.constants";

// Next statuses allowed from each order.status (enforced with admin/rider-specific paths below).
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "ready_for_delivery", "cancelled"],
  confirmed: ["ready_for_delivery", "cancelled"],
  ready_for_delivery: ["picked", "cancelled"],
  picked: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded", "partially_refunded"],
  cancelled: ["refunded", "partially_refunded"],
  refunded: [],
  partially_refunded: ["refunded"],
};

const RIDER_ALLOWED_STATUSES = [
  "picked",
  "out_for_delivery",
  "delivered",
] as const;

const CANCELLABLE_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_for_delivery",
] as const;

@Injectable()
export class OrderLifecycleService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Update order status (and optionally assignedRiderId).
   * Admin/super-admin: can update any order (status, assignedRiderId); transition guard applied.
   * Rider: can update only orders assigned to them; restricted to picked → out_for_delivery → delivered.
   */
  async updateOrderStatus(
    orderId: string,
    body: { status?: string; assignedRiderId?: string | null },
    user: { id: string; role: string },
  ): Promise<OrderDocument> {
    const existingOrder = await this.orderModel.findById(orderId).exec();
    if (!existingOrder) throw ApiException.notFound("Order not found");

    const isAdmin = hasAdminGrant(user);
    const isRider = hasAnyGrantedRole(user, ["rider"]);
    const currentStatus = (existingOrder as { status: string }).status;
    const currentAssigned = (
      existingOrder as { assignedRiderId?: Types.ObjectId }
    ).assignedRiderId;
    const assignedIdStr = currentAssigned?.toString?.();

    if (isAdmin) {
      const updates: Partial<Order> = {};
      if (body.status !== undefined) {
        if (
          !ORDER_STATUSES.includes(
            body.status as (typeof ORDER_STATUSES)[number],
          )
        ) {
          throw ApiException.badRequest(
            `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`,
          );
        }
        const allowed = ALLOWED_TRANSITIONS[currentStatus];
        if (allowed !== undefined && !allowed.includes(body.status)) {
          throw ApiException.badRequest(
            `Cannot transition order from '${currentStatus}' to '${body.status}'. ` +
              `Allowed next states: ${allowed.length ? allowed.join(", ") : "none (terminal status)"}`,
          );
        }
        updates.status = body.status;
      }
      if (body.assignedRiderId !== undefined) {
        updates.assignedRiderId = body.assignedRiderId
          ? new Types.ObjectId(body.assignedRiderId)
          : undefined;
      }
      if (Object.keys(updates).length === 0)
        throw ApiException.badRequest("Provide status and/or assignedRiderId.");
      const updated = await this.orderModel
        .findByIdAndUpdate(orderId, { $set: updates }, { new: true })
        .populate("customer", "firstName lastName email")
        .populate("items.product")
        .exec();
      if (!updated) throw ApiException.notFound("Order not found");
      return updated as OrderDocument;
    }

    if (isRider) {
      if (assignedIdStr !== user.id) {
        throw ApiException.forbidden(
          "You can only update orders assigned to you.",
        );
      }
      if (body.assignedRiderId !== undefined) {
        throw ApiException.forbidden("Riders cannot change assignedRiderId.");
      }
      if (body.status === undefined) {
        throw ApiException.badRequest("Provide status.");
      }
      if (
        !RIDER_ALLOWED_STATUSES.includes(
          body.status as (typeof RIDER_ALLOWED_STATUSES)[number],
        )
      ) {
        throw ApiException.forbidden(
          `Riders can only set: ${RIDER_ALLOWED_STATUSES.join(", ")}.`,
        );
      }
      const allowed = ALLOWED_TRANSITIONS[currentStatus];
      if (allowed !== undefined && !allowed.includes(body.status)) {
        throw ApiException.badRequest(
          `Cannot transition order from '${currentStatus}' to '${body.status}'. ` +
            `Allowed next states: ${allowed.length ? allowed.join(", ") : "none (terminal status)"}`,
        );
      }
      const updated = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          { $set: { status: body.status } },
          { new: true },
        )
        .populate("customer", "firstName lastName email")
        .populate("items.product")
        .exec();
      if (!updated) throw ApiException.notFound("Order not found");
      return updated as OrderDocument;
    }

    throw ApiException.forbidden(
      "Only admin or the assigned rider can update order status.",
    );
  }

  /**
   * Cancel an order on behalf of a customer or seller.
   * Allowed only while the order has not yet been picked by a rider.
   */
  async cancelOrder(
    orderId: string,
    cancelledBy: "customer" | "seller",
    userId: string,
    reason?: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw ApiException.notFound("Order not found");

    const status = (order as { status: string }).status;
    if (
      !CANCELLABLE_STATUSES.includes(
        status as (typeof CANCELLABLE_STATUSES)[number],
      )
    ) {
      throw ApiException.badRequest(
        `Order cannot be cancelled once a rider has picked it up. Current status: '${status}'.`,
      );
    }

    if (cancelledBy === "customer") {
      const customerId = (
        order as { customer: Types.ObjectId }
      ).customer.toString();
      if (customerId !== userId) {
        throw ApiException.forbidden("You can only cancel your own orders.");
      }
    } else {
      const items = (order as { items: { seller: Types.ObjectId }[] }).items;
      const owned = items.some((item) => item.seller.toString() === userId);
      if (!owned) {
        throw ApiException.forbidden(
          "You can only cancel orders that contain your products.",
        );
      }
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: "cancelled",
            cancelledBy,
            cancellationReason: reason?.trim() ?? "",
          },
        },
        { new: true },
      )
      .populate("customer", "firstName lastName email")
      .populate("items.product")
      .exec();
    if (!updated) throw ApiException.notFound("Order not found");
    return updated as OrderDocument;
  }
}
