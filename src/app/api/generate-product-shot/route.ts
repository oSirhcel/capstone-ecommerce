import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";

interface GenerateProductShotRequest {
  image: string;
  productName: string;
  description: string;
  preset: string;
  includeHands: boolean;
  size: string;
  variations: number;
  replaceBackground: boolean;
  highDetail: boolean;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check for required environment variable
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateProductShotRequest;
    const {
      image,
      productName,
      description,
      preset,
      includeHands,
      replaceBackground,
      highDetail,
    } = body;

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Convert base64 image to buffer
    const base64Data = image.split(",")[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 },
      );
    }
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Create prompt based on preset and options
    const prompt = createPrompt({
      productName,
      description,
      preset,
      includeHands,
      replaceBackground,
      highDetail,
    });

    const model = google("gemini-2.5-flash-image-preview");

    const result = await generateText({
      model,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "file",
              mediaType: "image/webp",
              data: imageBuffer,
            },
          ],
        },
      ],
    });

    // Process generated images
    const imageFiles = result.files.filter((f) =>
      f.mediaType?.startsWith("image/"),
    );

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "No images were generated" },
        { status: 500 },
      );
    }

    // Convert images to base64 for frontend
    const generatedImages = imageFiles.map((file) => {
      const base64 = Buffer.from(file.uint8Array).toString("base64");
      const mimeType = file.mediaType || "image/png";
      return `data:${mimeType};base64,${base64}`;
    });

    return NextResponse.json({
      success: true,
      images: generatedImages,
      text: result.text,
      usage: result.usage,
    });
  } catch (error) {
    console.error("Error generating product shots:", error);
    return NextResponse.json(
      { error: "Failed to generate product shots" },
      { status: 500 },
    );
  }
}

interface PromptOptions {
  productName: string;
  description: string;
  preset: string;
  includeHands: boolean;
  replaceBackground: boolean;
  highDetail: boolean;
}

function createPrompt({
  productName,
  description,
  preset,
  includeHands,
  replaceBackground,
  highDetail,
}: PromptOptions): string {
  let prompt = `Create a professional product shot for ${productName}`;

  if (description) {
    prompt += ` - ${description}`;
  }

  // Add preset-specific instructions
  switch (preset) {
    case "clean-pack-shot":
      prompt +=
        ". Clean white background, professional product photography style, minimal and elegant";
      break;
    case "lifestyle-home":
      prompt +=
        ". Lifestyle shot in a modern home setting, warm lighting, cozy atmosphere";
      break;
    case "lifestyle-desk":
      prompt +=
        ". Lifestyle shot on a modern desk workspace, professional environment";
      break;
    case "lifestyle-cafe":
      prompt +=
        ". Lifestyle shot in a cafe setting, natural lighting, relaxed atmosphere";
      break;
    case "outdoor-natural":
      prompt +=
        ". Outdoor lifestyle shot with natural lighting and environment";
      break;
    default:
      prompt += ". Professional product photography";
  }

  if (includeHands) {
    prompt += ". Include human hands interacting with the product naturally";
  }

  if (replaceBackground) {
    prompt += ". Replace the background with a clean, professional setting";
  }

  if (highDetail) {
    prompt += ". High detail, sharp focus, professional quality";
  }

  prompt += ". Ensure the product is the main focus and well-lit.";

  return prompt;
}
