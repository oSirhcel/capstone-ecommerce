import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { categories, products } from "@/server/db/schema";
import { asc, eq, sql } from "drizzle-orm";

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categoriesData = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        image: categories.image,
        count: sql<number>`COUNT(${products.id})`.mapWith(Number).as("count"),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    return NextResponse.json({
      categories: categoriesData,
      total: categoriesData.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
