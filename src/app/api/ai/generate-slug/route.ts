import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface GenerateSlugRequest {
  storeName: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "Google AI API key not configured" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as GenerateSlugRequest;
  const { storeName } = body;

  if (!storeName || storeName.length < 3) {
    return NextResponse.json(
      { error: "Store name must be at least 3 characters" },
      { status: 400 },
    );
  }

  const model = google("gemini-2.5-flash");

  const prompt = `Generate 5 unique, creative, URL-safe slugs for a store named "${storeName}".
  
Rules:
- Must be lowercase
- Use hyphens instead of spaces
- 3-50 characters
- No special characters except hyphens
- Should be memorable and brand-appropriate
- Variations can be creative (e.g., abbreviations, synonyms, industry terms)

IMPORTANT: Return ONLY a valid JSON array with exactly 5 strings. No markdown, no explanations, no code blocks. Just the array.

Example: ["slug-one", "slug-two", "slug-three", "slug-four", "slug-five"]`;

  const result = await generateText({
    model,
    prompt,
  });

  // Parse AI response with better error handling
  let slugs: string[] = [];

  try {
    // Try to extract JSON from markdown code blocks
    const jsonRegex = /```(?:json)?\s*(\[[\s\S]*?\])\s*```/;
    const jsonMatch = jsonRegex.exec(result.text);
    if (jsonMatch) {
      slugs = JSON.parse(jsonMatch[1]) as string[];
    } else {
      // If no code block, try to find array-like content
      const arrayRegex = /\[[\s\S]*?\]/;
      const arrayMatch = arrayRegex.exec(result.text);
      if (arrayMatch) {
        slugs = JSON.parse(arrayMatch[0]) as string[];
      }
    }
  } catch {
    // If all parsing fails, generate fallback slugs
    const fallbackSlugs = generateFallbackSlugs(storeName);
    slugs = fallbackSlugs;
  }

  // Ensure we have an array of strings
  if (!Array.isArray(slugs) || slugs.length === 0) {
    slugs = generateFallbackSlugs(storeName);
  }

  // Validate and check availability for each slug
  const availableSlugs = [];
  for (const slug of slugs) {
    // Validate format
    if (!/^[a-z0-9-]{3,50}$/.test(slug)) continue;

    // Check availability
    const existing = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      availableSlugs.push(slug);
    }
  }

  if (availableSlugs.length === 0) {
    return NextResponse.json(
      { error: "No available slugs generated" },
      { status: 500 },
    );
  }

  return NextResponse.json({ slugs: availableSlugs });
}

// Fallback slug generation when AI fails
function generateFallbackSlugs(storeName: string): string[] {
  const baseSlug = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const fallbacks = [
    baseSlug,
    `${baseSlug}-store`,
    `${baseSlug}-shop`,
    `${baseSlug}-co`,
    `${baseSlug}-hub`,
  ];

  // Ensure minimum length and uniqueness
  return fallbacks
    .map((slug) => (slug.length < 3 ? `${slug}-store` : slug))
    .filter((slug, index, arr) => arr.indexOf(slug) === index)
    .slice(0, 5);
}
