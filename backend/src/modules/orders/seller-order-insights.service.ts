import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage, Types } from "mongoose";
import { Order, OrderDocument, ShippingAddress } from "./schemas/order.schema";

type SellerAnalyticsPeriod = "daily" | "weekly" | "monthly" | "yearly" | "all";
type SellerAnalyticsGranularity = "day" | "week" | "month" | "year";

@Injectable()
export class SellerOrderInsightsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  /** Per-order sum of line totals for lines sold by this seller (user id). */
  private orderSellerSubtotalStage(sellerOid: Types.ObjectId): PipelineStage {
    return {
      $addFields: {
        sellerSubtotal: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$items",
                  as: "it",
                  cond: { $eq: ["$$it.seller", sellerOid] },
                },
              },
              as: "line",
              in: "$$line.totalPrice",
            },
          },
        },
      },
    };
  }

  private roundMoney(n: number): number {
    return Math.round((n ?? 0) * 100) / 100;
  }

  private resolvePeriod(raw?: string): SellerAnalyticsPeriod {
    const p = (raw ?? "monthly").toLowerCase().trim();
    if (["daily", "weekly", "monthly", "yearly", "all"].includes(p)) {
      return p as SellerAnalyticsPeriod;
    }
    return "monthly";
  }

  private analyticsWindow(period: SellerAnalyticsPeriod): {
    start: Date | null;
    granularity: SellerAnalyticsGranularity;
  } {
    const now = new Date();
    switch (period) {
      case "daily":
        return {
          start: new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() - 13,
              0,
              0,
              0,
              0,
            ),
          ),
          granularity: "day",
        };
      case "weekly":
        return {
          start: new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() - 12 * 7,
              0,
              0,
              0,
              0,
            ),
          ),
          granularity: "week",
        };
      case "monthly": {
        const s = new Date(now);
        s.setUTCMonth(s.getUTCMonth() - 12);
        s.setUTCHours(0, 0, 0, 0);
        return { start: s, granularity: "month" };
      }
      case "yearly": {
        const y = now.getUTCFullYear();
        return {
          start: new Date(Date.UTC(y - 4, 0, 1, 0, 0, 0, 0)),
          granularity: "year",
        };
      }
      case "all":
        return { start: null, granularity: "year" };
      default:
        return this.analyticsWindow("monthly");
    }
  }

  private orderMatch(
    sellerOid: Types.ObjectId,
    start: Date | null,
  ): Record<string, unknown> {
    const m: Record<string, unknown> = { "items.seller": sellerOid };
    if (start) m.createdAt = { $gte: start };
    return m;
  }

  private trendGroupStage(
    granularity: SellerAnalyticsGranularity,
  ): PipelineStage {
    switch (granularity) {
      case "day":
        return {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$sellerSubtotal" },
            orders: { $sum: 1 },
          },
        };
      case "week":
        return {
          $group: {
            _id: {
              wy: { $isoWeekYear: "$createdAt" },
              wk: { $isoWeek: "$createdAt" },
            },
            revenue: { $sum: "$sellerSubtotal" },
            orders: { $sum: 1 },
          },
        };
      case "month":
        return {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
            },
            revenue: { $sum: "$sellerSubtotal" },
            orders: { $sum: 1 },
          },
        };
      case "year":
        return {
          $group: {
            _id: { y: { $year: "$createdAt" } },
            revenue: { $sum: "$sellerSubtotal" },
            orders: { $sum: 1 },
          },
        };
    }
  }

  private trendSortStage(
    granularity: SellerAnalyticsGranularity,
  ): PipelineStage {
    switch (granularity) {
      case "day":
        return { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } };
      case "week":
        return { $sort: { "_id.wy": 1, "_id.wk": 1 } };
      case "month":
        return { $sort: { "_id.y": 1, "_id.m": 1 } };
      case "year":
        return { $sort: { "_id.y": 1 } };
    }
  }

  private mapTrendRows(
    rows: unknown[],
    granularity: SellerAnalyticsGranularity,
  ): { key: string; label: string; revenue: number; orders: number }[] {
    const monthShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    switch (granularity) {
      case "day":
        return (
          rows as {
            _id: { y: number; m: number; d: number };
            revenue: number;
            orders: number;
          }[]
        ).map((r) => ({
          key: `${r._id.y}-${r._id.m}-${r._id.d}`,
          label: `${r._id.d} ${monthShort[r._id.m - 1] ?? ""}`,
          revenue: this.roundMoney(r.revenue ?? 0),
          orders: r.orders ?? 0,
        }));
      case "week":
        return (
          rows as {
            _id: { wy: number; wk: number };
            revenue: number;
            orders: number;
          }[]
        ).map((r) => ({
          key: `${r._id.wy}-W${r._id.wk}`,
          label: `W${r._id.wk} · ${r._id.wy}`,
          revenue: this.roundMoney(r.revenue ?? 0),
          orders: r.orders ?? 0,
        }));
      case "month":
        return (
          rows as {
            _id: { y: number; m: number };
            revenue: number;
            orders: number;
          }[]
        ).map((r) => ({
          key: `${r._id.y}-${r._id.m}`,
          label: `${monthShort[r._id.m - 1] ?? ""} ${r._id.y}`,
          revenue: this.roundMoney(r.revenue ?? 0),
          orders: r.orders ?? 0,
        }));
      case "year":
        return (
          rows as { _id: { y: number }; revenue: number; orders: number }[]
        ).map((r) => ({
          key: String(r._id.y),
          label: String(r._id.y),
          revenue: this.roundMoney(r.revenue ?? 0),
          orders: r.orders ?? 0,
        }));
    }
  }

  /**
   * Unique customers who placed at least one order containing this seller's line items.
   * Totals reflect only that seller's lines (not the full multi-seller order amount).
   */
  async getCustomersForSeller(sellerUserId?: string) {
    if (!sellerUserId || !Types.ObjectId.isValid(sellerUserId)) {
      return { customers: [] as Record<string, unknown>[] };
    }
    const sellerOid = new Types.ObjectId(sellerUserId);
    const pipeline: PipelineStage[] = [
      { $match: { "items.seller": sellerOid } },
      this.orderSellerSubtotalStage(sellerOid),
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$customer",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$sellerSubtotal" },
          lastOrderAt: { $first: "$createdAt" },
          lastShippingAddress: { $first: "$shippingAddress" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $sort: { lastOrderAt: -1 } },
    ];
    const rows = await this.orderModel.aggregate(pipeline).exec();
    type AggRow = {
      _id: Types.ObjectId;
      orderCount: number;
      totalSpent: number;
      lastOrderAt?: Date;
      lastShippingAddress?: ShippingAddress;
      user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
      };
    };
    const customers = (rows as AggRow[]).map((r) => ({
      customerId: r._id.toString(),
      firstName: r.user?.firstName ?? "",
      lastName: r.user?.lastName ?? "",
      email: r.user?.email ?? "",
      phone: r.user?.phone ?? "",
      orderCount: r.orderCount,
      totalSpent: Math.round((r.totalSpent ?? 0) * 100) / 100,
      lastOrderAt: r.lastOrderAt ? r.lastOrderAt.toISOString() : null,
      lastShippingAddress: r.lastShippingAddress ?? null,
    }));
    return { customers };
  }

  /**
   * Seller dashboard: revenue / orders / customers / units from this store’s order lines only.
   * `period` filters summary, top products, and chart buckets: daily | weekly | monthly | yearly | all.
   */
  async getAnalyticsForSeller(sellerUserId?: string, periodRaw?: string) {
    const period = this.resolvePeriod(periodRaw);
    const { start, granularity } = this.analyticsWindow(period);
    const orderMatch = (sellerOid: Types.ObjectId) =>
      this.orderMatch(sellerOid, start);

    const emptyBase = {
      period,
      chart: {
        granularity,
        points: [] as {
          key: string;
          label: string;
          revenue: number;
          orders: number;
        }[],
      },
      summary: {
        totalRevenue: 0,
        orderCount: 0,
        uniqueCustomers: 0,
        unitsSold: 0,
        averageOrderValue: 0,
      },
      topProducts: [] as {
        productId: string;
        title: string;
        units: number;
        revenue: number;
      }[],
    };
    if (!sellerUserId || !Types.ObjectId.isValid(sellerUserId)) {
      return emptyBase;
    }
    const sellerOid = new Types.ObjectId(sellerUserId);

    const summaryPipeline: PipelineStage[] = [
      { $match: orderMatch(sellerOid) },
      this.orderSellerSubtotalStage(sellerOid),
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$sellerSubtotal" },
          orderCount: { $sum: 1 },
          uniqueCustomers: { $addToSet: "$customer" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          orderCount: 1,
          uniqueCustomers: { $size: "$uniqueCustomers" },
        },
      },
    ];

    const unitsPipeline: PipelineStage[] = [
      { $match: orderMatch(sellerOid) },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerOid } },
      { $group: { _id: null, unitsSold: { $sum: "$items.quantity" } } },
    ];

    const trendPipeline: PipelineStage[] = [
      { $match: orderMatch(sellerOid) },
      this.orderSellerSubtotalStage(sellerOid),
      this.trendGroupStage(granularity),
      this.trendSortStage(granularity),
    ];

    const topProductsPipeline: PipelineStage[] = [
      { $match: orderMatch(sellerOid) },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerOid } },
      {
        $group: {
          _id: "$items.product",
          units: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: { $toString: "$_id" },
          title: { $ifNull: ["$p.title", "Product"] },
          units: 1,
          revenue: 1,
        },
      },
    ];

    const [summaryRows, unitsRows, trendRows, topRows] = await Promise.all([
      this.orderModel.aggregate(summaryPipeline).exec(),
      this.orderModel.aggregate(unitsPipeline).exec(),
      this.orderModel.aggregate(trendPipeline).exec(),
      this.orderModel.aggregate(topProductsPipeline).exec(),
    ]);

    const summaryDoc = summaryRows[0] as
      | { totalRevenue?: number; orderCount?: number; uniqueCustomers?: number }
      | undefined;
    const totalRevenue = this.roundMoney(summaryDoc?.totalRevenue ?? 0);
    const orderCount = summaryDoc?.orderCount ?? 0;
    const uniqueCustomers = summaryDoc?.uniqueCustomers ?? 0;
    const unitsSold =
      (unitsRows[0] as { unitsSold?: number } | undefined)?.unitsSold ?? 0;
    const averageOrderValue =
      orderCount > 0 ? this.roundMoney(totalRevenue / orderCount) : 0;

    const points = this.mapTrendRows(trendRows, granularity);

    const topProducts = (
      topRows as {
        productId: string;
        title: string;
        units: number;
        revenue: number;
      }[]
    ).map((r) => ({
      productId: r.productId,
      title: r.title || "Product",
      units: r.units ?? 0,
      revenue: this.roundMoney(r.revenue ?? 0),
    }));

    return {
      period,
      chart: { granularity, points },
      summary: {
        totalRevenue,
        orderCount,
        uniqueCustomers,
        unitsSold,
        averageOrderValue,
      },
      topProducts,
    };
  }
}
