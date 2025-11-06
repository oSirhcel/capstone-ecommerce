import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      image: string; // base64 data URL
      fileName?: string;
    };

    const { image, fileName = "ai-generated.png" } = body;

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Convert base64 to buffer
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Determine mime type from base64 data URL or default to png
    let mimeType = "image/png";
    if (image.startsWith("data:")) {
      const mimeMatch = /data:([^;]+);/.exec(image);
      if (mimeMatch?.[1]) {
        mimeType = mimeMatch[1];
      }
    }

    // Create a File from the buffer
    const file = new File([imageBuffer], fileName, { type: mimeType });

    // Upload using UTApi
    const response = await utapi.uploadFiles(file);

    if (response.error) {
      console.error("Upload failed:", response.error);
      throw new Error(response.error.message);
    }

    return NextResponse.json({
      success: true,
      url: response.data.ufsUrl,
      key: response.data.key,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
