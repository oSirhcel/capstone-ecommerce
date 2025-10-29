import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tags, productTags } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/tags/[id] - Delete a tag if no products use it
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    // Check if tag is in use
    const usageCount = await db
      .select()
      .from(productTags)
      .where(eq(productTags.tagId, tagId))
      .then((results) => results.length);

    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete tag that is still in use" },
        { status: 400 },
      );
    }

    // Delete the tag
    await db.delete(tags).where(eq(tags.id, tagId));

    return NextResponse.json({
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 },
    );
  }
}
