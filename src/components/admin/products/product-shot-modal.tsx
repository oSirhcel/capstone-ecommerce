"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Wand2, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useGenerateProductShot } from "@/hooks/products/use-product-mutations";
import type { UseMutationResult } from "@tanstack/react-query";

interface GenerateProductShotData {
  image: string;
  productName: string;
  description: string;
}

interface GenerateProductShotResponse {
  success: boolean;
  images?: string[];
  text?: string;
  usage?: unknown;
  error?: string;
}

interface ProductShotModalProps {
  onImagesGenerated?: (images: string[]) => void;
  productName?: string;
  productDescription?: string;
  productImages?: string[];
}

export function ProductShotModal({
  onImagesGenerated,
  productName = "",
  productDescription = "",
  productImages = [],
}: ProductShotModalProps) {
  const [open, setOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [imageSource, setImageSource] = useState<"upload" | "existing">(
    "upload",
  );

  // Filter out placeholder images
  const validProductImages = productImages.filter(
    (img) => img !== "/placeholder.svg",
  );

  const generateProductShotMutation: UseMutationResult<
    GenerateProductShotResponse,
    Error,
    GenerateProductShotData
  > = useGenerateProductShot();

  // Form state - sync with props when dialog opens or props change
  const [formData, setFormData] = useState({
    productName: productName,
    description: productDescription,
  });

  const prevOpenRef = useRef(open);

  // Sync formData with props when dialog opens (preserves manual edits while dialog is open)
  useEffect(() => {
    // Only sync when dialog transitions from closed to open
    if (open && !prevOpenRef.current) {
      setFormData({
        productName: productName || "",
        description: productDescription || "",
      });
    }
    prevOpenRef.current = open;
  }, [open, productName, productDescription]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setImageSource("upload");
      };
      reader.onerror = () => {
        toast.error("Error reading file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectExistingImage = async (imageUrl: string) => {
    try {
      // Fetch the image and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setImageSource("existing");
      };
      reader.onerror = () => {
        toast.error("Error reading image");
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading existing image:", error);
      toast.error("Failed to load image");
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    const payload: GenerateProductShotData = {
      image: uploadedImage,
      productName: formData.productName,
      description: formData.description,
    };

    generateProductShotMutation.mutate(payload, {
      onSuccess: (data: GenerateProductShotResponse) => {
        if (data.success && data.images && data.images.length > 0) {
          setGeneratedImage(data.images[0]);
          setShowPreview(true);
        }
      },
    });
  };

  const handleKeepImage = () => {
    if (generatedImage) {
      onImagesGenerated?.([generatedImage]);
      setOpen(false);
      resetForm();
    }
  };

  const handleRejectImage = () => {
    setGeneratedImage(null);
    setShowPreview(false);
  };

  const resetForm = () => {
    setFormData({
      productName: productName,
      description: productDescription,
    });
    setUploadedImage(null);
    setGeneratedImage(null);
    setShowPreview(false);
    setImageSource("upload");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <SparklesIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="text-accent h-5 w-5" />
            Generate AI Product Shot
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Upload */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5" />
                Product Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validProductImages.length > 0 && !uploadedImage && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Choose from product images
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {validProductImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectExistingImage(imgUrl)}
                          className="group border-muted hover:border-primary relative aspect-square overflow-hidden rounded-lg border-2 transition-all"
                        >
                          <Image
                            src={imgUrl}
                            alt={`Product image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                        </button>
                      ))}
                    </div>
                    <div className="relative flex items-center gap-2 py-2">
                      <div className="flex-1 border-t" />
                      <span className="text-muted-foreground text-xs">OR</span>
                      <div className="flex-1 border-t" />
                    </div>
                  </div>
                )}
                <div className="border-muted-foreground/25 hover:border-muted-foreground/50 flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-6 lg:p-8">
                  {uploadedImage ? (
                    <div className="w-full space-y-4">
                      <div className="relative mx-auto max-w-xs">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Selected product"
                          width={200}
                          height={200}
                          className="mx-auto aspect-square max-h-48 w-full rounded-lg object-contain"
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedImage(null);
                            setImageSource("upload");
                          }}
                          className="w-full sm:w-auto"
                        >
                          {imageSource === "existing"
                            ? "Choose Different Image"
                            : "Remove Image"}
                        </Button>
                        {imageSource === "existing" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadedImage(null);
                              setImageSource("upload");
                            }}
                            className="w-full sm:w-auto"
                          >
                            Upload New Image
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <Upload className="text-muted-foreground mx-auto h-12 w-12" />
                      <div>
                        <p className="text-sm font-medium">
                          Upload your product image
                        </p>
                        <p className="text-muted-foreground text-xs">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                      <div className="mx-auto w-full max-w-xs">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="text-muted-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-sm font-medium">
                  Product Name
                </Label>
                <input
                  id="productName"
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      productName: e.target.value,
                    }))
                  }
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter product description"
                />
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">AI Product Shot Settings</p>
                <p className="text-blue-700">
                  Images will be generated with a lifestyle setting, realistic
                  background, product in use or natural environment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        {showPreview && generatedImage && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <SparklesIcon className="h-5 w-5" />
                Generated Image Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative mx-auto max-w-md">
                  <Image
                    src={generatedImage}
                    alt="Generated product shot"
                    width={400}
                    height={400}
                    className="mx-auto aspect-square w-full rounded-lg object-contain"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button
                    onClick={handleRejectImage}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Generate Another
                  </Button>
                  <Button
                    onClick={handleKeepImage}
                    className="w-full gap-2 sm:w-auto"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Keep This Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        {!showPreview && (
          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!uploadedImage || generateProductShotMutation.isPending}
              className="w-full gap-2 sm:w-auto"
              size="lg"
            >
              {generateProductShotMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Generate Product Shot
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
