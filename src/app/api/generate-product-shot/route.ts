import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";

interface GenerateProductShotRequest {
  image: string;
  productName: string;
  description: string;
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
    const { image, productName, description } = body;

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

    // Create prompt with fixed AI product shot settings
    const prompt = createPrompt({
      productName,
      description,
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

    // Upload generated images to UploadThing
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const uploadedImageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const mimeType = file.mediaType || "image/png";
        const extension = mimeType.split("/")[1] || "png";
        const fileName = `ai-generated-${Date.now()}.${extension}`;

        // Convert to base64 for upload endpoint
        const base64 = Buffer.from(file.uint8Array).toString("base64");
        const base64DataUrl = `data:${mimeType};base64,${base64}`;

        try {
          // Upload via our upload endpoint
          const uploadResponse = await fetch(`${baseUrl}/api/upload-image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") ?? "",
            },
            body: JSON.stringify({
              image: base64DataUrl,
              fileName,
            }),
          });

          if (!uploadResponse.ok) {
            throw new Error("Upload failed");
          }

          const uploadData = (await uploadResponse.json()) as {
            success: boolean;
            url: string;
          };

          if (!uploadData.success || !uploadData.url) {
            throw new Error("Upload failed");
          }

          return uploadData.url;
        } catch (error) {
          console.error("Error uploading generated image:", error);
          // Fallback to base64 if upload fails
          return base64DataUrl;
        }
      }),
    );

    return NextResponse.json({
      success: true,
      images: uploadedImageUrls,
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
}

function createPrompt({ productName, description }: PromptOptions): string {
  let prompt = `Create a professional product shot for ${productName}`;

  if (description) {
    prompt += ` - ${description}`;
  }

  prompt +=
    ". Lifestyle setting, realistic background, product in use or natural environment. Capture authentic moments, warm lighting, candid composition. High detail, sharp focus, professional quality. Ensure product remains prominent in a relatable scene.";

  return prompt;
}
