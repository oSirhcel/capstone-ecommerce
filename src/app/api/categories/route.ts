import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { asc } from "drizzle-orm";

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categoriesData = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    return NextResponse.json({
      categories: categoriesData,
      total: categoriesData.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
