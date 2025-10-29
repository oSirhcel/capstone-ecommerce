import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tags } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

// GET /api/tags - Get all tags
export async function GET() {
  try {
    const allTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(tags)
      .orderBy(desc(tags.createdAt));

    return NextResponse.json({ tags: allTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 },
    );
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const { name } = (await request.json()) as { name: string };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    // Generate slug from name
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if tag already exists by slug (case-insensitive)
    const existingTag = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (existingTag.length > 0) {
      return NextResponse.json({
        id: existingTag[0].id,
        name: existingTag[0].name,
        slug: existingTag[0].slug,
      });
    }

    // Create new tag
    const [newTag] = await db
      .insert(tags)
      .values({
        name: trimmedName,
        slug,
      })
      .returning();

    return NextResponse.json(
      {
        id: newTag.id,
        name: newTag.name,
        slug: newTag.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 },
    );
  }
}
