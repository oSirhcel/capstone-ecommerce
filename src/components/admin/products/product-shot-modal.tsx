"use client";

import type React from "react";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Upload, Wand2, ChevronDown, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useGenerateProductShot } from "@/hooks/products/use-product-mutations";
import type { UseMutationResult } from "@tanstack/react-query";

interface GenerateProductShotData {
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
}

export function ProductShotModal({
  onImagesGenerated,
  productName = "",
  productDescription = "",
}: ProductShotModalProps) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateProductShotMutation: UseMutationResult<
    GenerateProductShotResponse,
    Error,
    GenerateProductShotData
  > = useGenerateProductShot();

  // Form state
  const [formData, setFormData] = useState({
    productName: productName,
    description: productDescription,
    preset: "",
    includeHands: false,
    size: "1024px",
    variations: 2,
    replaceBackground: false,
    highDetail: false,
  });

  const presets = [
    { value: "clean-pack-shot", label: "Clean pack shot" },
    { value: "lifestyle-home", label: "Lifestyle home" },
    { value: "lifestyle-desk", label: "Lifestyle desk" },
    { value: "lifestyle-cafe", label: "Lifestyle cafe" },
    { value: "outdoor-natural", label: "Outdoor natural" },
  ];

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
      };
      reader.onerror = () => {
        toast.error("Error reading file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !formData.preset) return;

    const payload: GenerateProductShotData = {
      image: uploadedImage,
      productName: formData.productName,
      description: formData.description,
      preset: formData.preset,
      includeHands: formData.includeHands,
      size: formData.size,
      variations: 1,
      replaceBackground: formData.replaceBackground,
      highDetail: formData.highDetail,
    };

    console.log("Product Shot Generator Payload:", payload);

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
      preset: "",
      includeHands: false,
      size: "1024px",
      variations: 2,
      replaceBackground: false,
      highDetail: false,
    });
    setUploadedImage(null);
    setGeneratedImage(null);
    setShowPreview(false);
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
                <div className="border-muted-foreground/25 hover:border-muted-foreground/50 flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-6 lg:p-8">
                  {uploadedImage ? (
                    <div className="w-full space-y-4">
                      <div className="relative mx-auto max-w-xs">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded product"
                          width={200}
                          height={200}
                          className="mx-auto max-h-48 w-full rounded-lg object-contain"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedImage(null)}
                        className="w-full sm:w-auto"
                      >
                        Remove Image
                      </Button>
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

          {/* Shot Settings */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="h-5 w-5" />
                Shot Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="preset" className="text-sm font-medium">
                  Preset Style
                </Label>
                <Select
                  value={formData.preset}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, preset: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a preset style" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="includeHands" className="text-sm font-medium">
                    Include hands
                  </Label>
                  <Switch
                    id="includeHands"
                    checked={formData.includeHands}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        includeHands: checked,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Image Size</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        formData.size === "1024px" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, size: "1024px" }))
                      }
                      className="flex-1 text-xs"
                    >
                      1024px
                    </Button>
                    <Button
                      variant={
                        formData.size === "2048px" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, size: "2048px" }))
                      }
                      className="flex-1 text-xs"
                    >
                      2048px
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hover:bg-muted/50 h-auto w-full justify-between p-2"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                      />
                      Advanced Options
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label
                        htmlFor="replaceBackground"
                        className="text-sm font-medium"
                      >
                        Replace background
                      </Label>
                      <Switch
                        id="replaceBackground"
                        checked={formData.replaceBackground}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            replaceBackground: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label
                        htmlFor="highDetail"
                        className="text-sm font-medium"
                      >
                        High detail
                      </Label>
                      <Switch
                        id="highDetail"
                        checked={formData.highDetail}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            highDetail: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
                    className="mx-auto w-full rounded-lg object-contain"
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
              disabled={
                !uploadedImage ||
                !formData.preset ||
                generateProductShotMutation.isPending
              }
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
