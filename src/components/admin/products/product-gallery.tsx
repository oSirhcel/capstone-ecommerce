"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: Array<{
    id: number;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-lg bg-gray-50">
            <Image
              src={images[currentImage]?.imageUrl || "/placeholder.svg"}
              alt={
                images[currentImage]?.altText ??
                `Product image ${currentImage + 1}`
              }
              fill
              className="object-cover"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 left-2 -translate-y-1/2 transform bg-white/80 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 transform bg-white/80 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImage(index)}
                  className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                    index === currentImage
                      ? "border-primary"
                      : "border-gray-200"
                  }`}
                >
                  <Image
                    src={image.imageUrl ?? "/placeholder.svg"}
                    alt={image.altText ?? `Thumbnail ${index + 1}`}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
