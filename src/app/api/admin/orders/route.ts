import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  orders,
  users,
  userProfiles,
  stores,
  orderItems,
} from "@/server/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  between,
  inArray,
} from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const storeId = searchParams.get("storeId");
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 100);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const sortBy = (searchParams.get("sortBy") ?? "createdAt") as
      | "createdAt"
      | "totalAmount"
      | "status";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as
      | "asc"
      | "desc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    }

    // Verify the authenticated user owns the store
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    const searchTerm = search?.trim() ? `%${search.trim()}%` : undefined;

    // Common filters (conditionally include undefineds per Drizzle best practice)
    const commonFilters = and(
      eq(orders.storeId, storeId),
      status ? eq(orders.status, status) : undefined,
      dateFrom && dateTo
        ? between(orders.createdAt, new Date(dateFrom), new Date(dateTo))
        : undefined,
    );

    // Subquery for item counts
    const itemsSub = db
      .select({
        orderId: orderItems.orderId,
        itemCount: count(orderItems.id).as("itemCount"),
      })
      .from(orderItems)
      .groupBy(orderItems.orderId)
      .as("itemsSub");

    // Base selection
    let listQuery = db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        itemCount: itemsSub.itemCount,
      })
      .from(orders)
      .leftJoin(itemsSub, eq(itemsSub.orderId, orders.id))
      .where(commonFilters);

    // Conditionally add search joins and predicates
    if (searchTerm) {
      listQuery = db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
          itemCount: itemsSub.itemCount,
        })
        .from(orders)
        .leftJoin(itemsSub, eq(itemsSub.orderId, orders.id))
        .leftJoin(users, eq(users.id, orders.userId))
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(
          and(
            commonFilters,
            or(
              ilike(users.username, searchTerm),
              ilike(userProfiles.firstName, searchTerm),
              ilike(userProfiles.lastName, searchTerm),
              ilike(userProfiles.email, searchTerm),
              ilike(sql<string>`CAST(${orders.id} AS TEXT)`, searchTerm),
            ),
          ),
        );
    }

    const sortColumn =
      sortBy === "totalAmount"
        ? orders.totalAmount
        : sortBy === "status"
          ? orders.status
          : orders.createdAt;

    const rows = await listQuery
      .orderBy(sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    // Customer basics map (name/email)
    const customerMap: Record<string, { name: string; email: string }> = {};
    if (rows.length > 0) {
      const customerIds = Array.from(new Set(rows.map((r) => r.userId)));
      const customers = await db
        .select({
          id: users.id,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          email: userProfiles.email,
          username: users.username,
        })
        .from(users)
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(inArray(users.id, customerIds));
      for (const c of customers) {
        const name =
          `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.username;
        customerMap[c.id] = { name, email: c.email ?? "" };
      }
    }

    const data = rows.map((r) => ({
      id: r.id,
      customer: customerMap[r.userId] ?? { name: "", email: "" },
      amount: r.totalAmount / 100,
      status: r.status,
      date: r.createdAt.toISOString(),
      items: Number(r.itemCount ?? 0),
      paymentStatus: "pending" as const,
    }));

    // Count with identical filters and conditional search joins
    const countQueryBase = db.select({ total: count(orders.id) }).from(orders);
    const totalResult = searchTerm
      ? await countQueryBase
          .leftJoin(users, eq(users.id, orders.userId))
          .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
          .where(
            and(
              commonFilters,
              or(
                ilike(users.username, searchTerm),
                ilike(userProfiles.firstName, searchTerm),
                ilike(userProfiles.lastName, searchTerm),
                ilike(userProfiles.email, searchTerm),
                ilike(sql<string>`CAST(${orders.id} AS TEXT)`, searchTerm),
              ),
            ),
          )
      : await countQueryBase.where(commonFilters);

    const total = Number(totalResult[0]?.total ?? 0);

    return NextResponse.json({
      orders: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Orders GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    type CreateBody = {
      storeId?: string;
      customerId?: string;
      items?: Array<{
        productId: number;
        quantity: number;
        priceAtTime: number;
      }>;
      totalAmount?: number;
    };
    const bodyUnknown = (await request.json()) as unknown;
    const body = bodyUnknown as CreateBody;
    const { storeId, customerId, items, totalAmount } = body;

    if (
      !storeId ||
      !customerId ||
      !items ||
      items.length === 0 ||
      !totalAmount
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify store ownership
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId));
    if (!store || store.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [order] = await db
      .insert(orders)
      .values({
        userId: customerId,
        storeId,
        status: "pending",
        totalAmount,
      })
      .returning();

    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map((i) => ({
          orderId: order.id,
          productId: i.productId,
          quantity: i.quantity,
          priceAtTime: i.priceAtTime,
        })),
      );
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Admin Orders POST error", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
