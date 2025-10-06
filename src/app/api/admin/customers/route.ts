import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users, userProfiles, orders, stores } from "@/server/db/schema";
import { eq, desc, asc, or, like, sql, count, and } from "drizzle-orm";
import { customersListQuerySchema } from "@/lib/api/admin/customers";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/customers
 * List all customers with pagination, search, and filtering
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const query = customersListQuerySchema.parse({
      storeId: searchParams.get("storeId"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    });

    // Verify user owns the store
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, query.storeId));

    console.log("Store", store);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    const offset = (query.page - 1) * query.limit;

    // Get customers who have ordered from THIS store
    const customersQuery = db
      .select({
        id: users.id,
        username: users.username,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
        status: userProfiles.status,
        location: userProfiles.location,
        tags: userProfiles.tags,
        joinDate: users.createdAt,
        totalOrders: sql<number>`CAST(COUNT(DISTINCT ${orders.id}) AS INTEGER)`,
        totalSpent: sql<number>`CAST(COALESCE(SUM(${orders.totalAmount}), 0) AS INTEGER)`,
      })
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .innerJoin(
        orders,
        and(eq(users.id, orders.userId), eq(orders.storeId, query.storeId)),
      )
      .where(
        and(
          query.search
            ? or(
                like(userProfiles.firstName, `%${query.search}%`),
                like(userProfiles.lastName, `%${query.search}%`),
                like(userProfiles.email, `%${query.search}%`),
              )
            : undefined,
          query.status ? eq(userProfiles.status, query.status) : undefined,
        ),
      )
      .groupBy(
        users.id,
        users.username,
        userProfiles.firstName,
        userProfiles.lastName,
        userProfiles.email,
        userProfiles.status,
        userProfiles.location,
        userProfiles.tags,
        users.createdAt,
      );

    // Apply sorting
    const sortColumn =
      query.sortBy === "name"
        ? userProfiles.firstName
        : query.sortBy === "totalSpent"
          ? sql`SUM(${orders.totalAmount})`
          : users.createdAt;

    const sortedQuery =
      query.sortOrder === "asc"
        ? customersQuery.orderBy(asc(sortColumn))
        : customersQuery.orderBy(desc(sortColumn));

    // Get paginated results
    const customers = await sortedQuery.limit(query.limit).offset(offset);

    console.log("Customers", customers);

    // Get total count for pagination (only customers who ordered from this store)
    const [{ total }] = await db
      .select({ total: count(sql`DISTINCT ${users.id}`) })
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .innerJoin(
        orders,
        and(eq(users.id, orders.userId), eq(orders.storeId, query.storeId)),
      )
      .where(
        and(
          query.search
            ? or(
                like(userProfiles.firstName, `%${query.search}%`),
                like(userProfiles.lastName, `%${query.search}%`),
                like(userProfiles.email, `%${query.search}%`),
              )
            : undefined,
          query.status ? eq(userProfiles.status, query.status) : undefined,
        ),
      );

    // Format response
    const formattedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
      email: customer.email,
      status: customer.status,
      location: customer.location,
      tags: customer.tags ? (JSON.parse(customer.tags) as string[]) : [],
      joinDate: customer.joinDate.toISOString(),
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
    }));

    return NextResponse.json({
      customers: formattedCustomers,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}
