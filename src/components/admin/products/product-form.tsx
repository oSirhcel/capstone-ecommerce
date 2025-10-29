"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Save, PlusIcon, CloudOff } from "lucide-react";
import Image from "next/image";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/products/use-product-mutations";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import { useSession } from "next-auth/react";
import { ProductShotModal } from "./product-shot-modal";
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useAIFormFields } from "@/contexts/ai-form-fields-context";
import { FormIntegrationService } from "@/lib/ai/form-integration-service";
import { cn } from "@/lib/utils";

const productFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(100, "Product name must be less than 100 characters"),
    sku: z
      .string()
      .max(50, "SKU must be less than 8 characters")
      .optional()
      .or(z.literal("")), // Allow empty string for drafts
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .or(z.literal("")), // Allow empty for drafts
    price: z.number().min(0, "Price must be 0 or greater").optional(),
    compareAtPrice: z
      .number()
      .min(0, "Compare at price must be 0 or greater")
      .optional(),
    costPerItem: z
      .number()
      .min(0, "Cost per item must be 0 or greater")
      .optional(),
    category: z.string().optional(),
    tags: z.string().optional(),
    trackQuantity: z.boolean().default(true),
    quantity: z.number().min(0, "Quantity must be 0 or greater").default(0),
    allowBackorders: z.boolean().default(false),
    weight: z.number().min(0, "Weight must be 0 or greater").optional(),
    dimensions: z
      .object({
        length: z.number().min(0, "Length must be 0 or greater").optional(),
        width: z.number().min(0, "Width must be 0 or greater").optional(),
        height: z.number().min(0, "Height must be 0 or greater").optional(),
      })
      .optional(),
    seoTitle: z
      .string()
      .max(60, "SEO title must be less than 60 characters")
      .optional(),
    seoDescription: z
      .string()
      .max(200, "SEO description must be less than 200 characters")
      .optional(),
    slug: z.string().optional(),
    status: z.enum(["active", "draft", "archived"]).default("draft"),
    featured: z.boolean().default(false),
    images: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // SKU is required when status is "active"
      if (data.status === "active" && (!data.sku || data.sku === "")) {
        return false;
      }
      return true;
    },
    {
      message: "SKU is required for active products",
      path: ["sku"],
    },
  )
  .refine(
    (data) => {
      // Description is required when status is "active"
      if (
        data.status === "active" &&
        (!data.description || data.description.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Description is required for active products",
      path: ["description"],
    },
  )
  .refine(
    (data) => {
      // Price is required when status is "active"
      if (
        data.status === "active" &&
        (data.price === undefined || data.price === null || data.price <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Price is required and must be greater than 0 for active products",
      path: ["price"],
    },
  );

type ProductFormValues = z.input<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormValues>;
  isEditing?: boolean;
  productId?: number;
}

export function ProductForm({
  initialData,
  isEditing = false,
  productId,
}: ProductFormProps) {
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const router = useRouter();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // Use new separated contexts
  const { pendingDraft, clearPendingDraft } = useAIProductDraft();
  const {
    aiFilledFields,
    markFieldsAsFilled,
    clearFilledFields,
    pendingFieldUpdates,
    setPendingFieldUpdates,
    updateFormData,
  } = useAIFormFields();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: 0,
      compareAtPrice: 0,
      costPerItem: 0,
      category: "",
      tags: "",
      trackQuantity: true,
      quantity: 0,
      allowBackorders: false,
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
      },
      seoTitle: "",
      seoDescription: "",
      slug: "",
      status: "draft",
      featured: false,
      images: [],
      ...initialData,
    },
  });

  const { isDirty } = form.formState;

  // Sync form data to context so AI can access current form state
  useEffect(() => {
    if (!isEditing) {
      const formValues = form.getValues();
      updateFormData(formValues as Record<string, unknown>);
    }
  }, [form, isEditing, updateFormData]);

  // Apply pending draft using batch update - Much cleaner!
  useEffect(() => {
    if (pendingDraft && !isEditing) {
      const affectedFields = FormIntegrationService.applyDraftToForm(
        form,
        pendingDraft,
      );
      markFieldsAsFilled(affectedFields);
      clearPendingDraft();
    }
  }, [pendingDraft, clearPendingDraft, form, isEditing, markFieldsAsFilled]);

  // Apply pending field updates using batch update
  useEffect(() => {
    if (pendingFieldUpdates && !isEditing) {
      const affectedFields = FormIntegrationService.applyFieldUpdates(
        form,
        pendingFieldUpdates,
      );
      markFieldsAsFilled(affectedFields);
      setPendingFieldUpdates(null);
    }
  }, [
    pendingFieldUpdates,
    form,
    isEditing,
    markFieldsAsFilled,
    setPendingFieldUpdates,
  ]);

  const onSubmit = async (data: ProductFormValues) => {
    const productData = {
      name: data.name,
      sku: data.sku,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      costPerItem: data.costPerItem,
      stock: data.quantity,
      trackQuantity: data.trackQuantity,
      allowBackorders: data.allowBackorders,
      weight: data.weight,
      dimensions: data.dimensions,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      slug: data.slug,
      status: data.status,
      featured: data.featured,
      tags: data.tags,
      storeId,
      categoryId: data.category ? parseInt(data.category) : undefined,
      // Always use the images state as the source of truth
      images: images,
    };

    if (isEditing && productId) {
      // Update existing product
      updateProductMutation.mutate(
        { id: productId, updates: productData },
        {
          onSuccess: () => {
            // Reset form dirty state with the current images
            form.reset({ ...data, images });
            clearFilledFields();
          },
        },
      );
    } else {
      // Create new product
      createProductMutation.mutate(productData, {
        onSuccess: (res) => {
          if (res.data) {
            clearFilledFields();
            router.replace(`/admin/products/${res.data.product.id}/edit`);
          }
        },
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    form.setValue("images", newImages, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            {isDirty && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <CloudOff className="h-4 w-4" />
                Unsaved changes
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            form="product-form"
            type="submit"
            disabled={
              createProductMutation.isPending || updateProductMutation.isPending
            }
          >
            {createProductMutation.isPending ||
            updateProductMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update Product" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form
          id="product-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto space-y-6 lg:max-w-4xl"
        >
          <Tabs defaultValue="information" className="space-y-6">
            <TabsList className="w-full">
              <TabsTrigger value="information"> Info</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="information" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Basic details about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product name"
                              {...field}
                              className={cn(
                                aiFilledFields.has("name") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                            />
                          </FormControl>
                          <div className="h-5" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            SKU {form.watch("status") === "active" && "*"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter SKU (optional for drafts)"
                              {...field}
                              className={cn(
                                aiFilledFields.has("sku") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                            />
                          </FormControl>
                          <FormDescription>
                            Stock Keeping Unit - unique identifier. Required
                            when publishing product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Description {form.watch("status") === "active" && "*"}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed product description (optional for drafts)"
                            className={cn(
                              "min-h-[120px]",
                              aiFilledFields.has("description") &&
                                "bg-purple-50 ring-2 ring-purple-500",
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length ?? 0}/1000 characters. Required
                          when publishing product.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Media</CardTitle>
                    <ProductShotModal
                      onImagesGenerated={(generatedImages) => {
                        const newImages = [...images, ...generatedImages];
                        setImages(newImages);
                        form.setValue("images", newImages, {
                          shouldDirty: true,
                        });
                      }}
                      productName={form.watch("name")}
                      productDescription={form.watch("description")}
                    />
                  </div>
                </CardHeader>
                <CardContent className="w-full">
                  {images.length === 0 && (
                    <div className="bg-muted/30 hover:bg-muted/50 border-muted-foreground flex h-64 w-full items-center justify-center rounded-lg border border-dashed transition">
                      <UploadButton
                        className="ut-button:bg-primary ut-button:text-primary-foreground ut-allowed-content:hidden"
                        content={{
                          button: "Upload images",
                        }}
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          const newImages = [
                            ...images,
                            ...res.map((r) => r.ufsUrl),
                          ];
                          setImages(newImages);
                          form.setValue("images", newImages, {
                            shouldDirty: true,
                          });
                        }}
                      />
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex-shrink-0">
                        <div className="group relative">
                          <Image
                            src={images[0] || "/placeholder.svg"}
                            alt="Main product image"
                            width={300}
                            height={300}
                            className="h-48 w-48 rounded-lg border object-cover sm:h-64 sm:w-64 md:h-72 md:w-72 lg:h-80 lg:w-80"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeImage(0)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="grid grid-cols-3 gap-1">
                          {images.slice(1).map((image, idx) => (
                            <div
                              key={image}
                              className="group relative aspect-square"
                            >
                              <Image
                                src={image || "/placeholder.svg"}
                                alt={`Product image ${idx + 2}`}
                                width={80}
                                height={80}
                                className="h-full min-h-[60px] w-full min-w-[60px] rounded-lg border object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => removeImage(idx + 1)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}

                          <UploadButton
                            className="ut-button:size-full ut-button:aspect-square ut-allowed-content:hidden ut-button:bg-muted/50 ut-button:hover:bg-muted/70 ut-button:text-muted-foreground ut-button:border-dashed ut-button:border-2 ut-button:border-muted-foreground/30 rounded-lg"
                            content={{
                              button: (
                                <PlusIcon className="text-muted-foreground h-6 w-6" />
                              ),
                            }}
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                              const newImages = [
                                ...images,
                                ...res.map((r) => r.ufsUrl),
                              ];
                              setImages(newImages);
                              form.setValue("images", newImages, {
                                shouldDirty: true,
                              });
                              console.log(
                                "Uploaded images:",
                                res.map((r) => r.ufsUrl),
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>Set your product pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Price {form.watch("status") === "active" && "*"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00 (optional for drafts)"
                              {...field}
                              className={cn(
                                aiFilledFields.has("price") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Required when publishing product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compareAtPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className={cn(
                                aiFilledFields.has("compareAtPrice") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Show customers the original price
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costPerItem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost per Item</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className={cn(
                                aiFilledFields.has("costPerItem") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Your cost for this item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                  <CardDescription>
                    Categorize and tag your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  aiFilledFields.has("category") &&
                                    "bg-purple-50 ring-2 ring-purple-500",
                                )}
                              >
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="electronics">
                                Electronics
                              </SelectItem>
                              <SelectItem value="clothing">Clothing</SelectItem>
                              <SelectItem value="home-living">
                                Home & Living
                              </SelectItem>
                              <SelectItem value="books">Books</SelectItem>
                              <SelectItem value="sports">
                                Sports & Outdoors
                              </SelectItem>
                              <SelectItem value="beauty">
                                Beauty & Personal Care
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter tags separated by commas"
                              {...field}
                              className={cn(
                                aiFilledFields.has("tags") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                            />
                          </FormControl>
                          <FormDescription>
                            Help customers find your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Featured Product
                            </FormLabel>
                            <FormDescription>
                              Show this product in featured sections
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Tracking</CardTitle>
                  <CardDescription>
                    Manage your product inventory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="trackQuantity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Track Quantity
                          </FormLabel>
                          <FormDescription>
                            Enable inventory tracking for this product
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("trackQuantity") && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                className={cn(
                                  aiFilledFields.has("quantity") &&
                                    "bg-purple-50 ring-2 ring-purple-500",
                                )}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowBackorders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Allow Backorders
                              </FormLabel>
                              <FormDescription>
                                Allow customers to order when out of stock
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping</CardTitle>
                  <CardDescription>
                    Physical properties for shipping calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className={cn(
                              aiFilledFields.has("weight") &&
                                "bg-purple-50 ring-2 ring-purple-500",
                            )}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="dimensions.length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className={cn(
                                aiFilledFields.has("dimensions.length") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensions.width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className={cn(
                                aiFilledFields.has("dimensions.width") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensions.height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className={cn(
                                aiFilledFields.has("dimensions.height") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Optimization</CardTitle>
                  <CardDescription>
                    Optimize your product for search engines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter SEO title"
                            {...field}
                            className={cn(
                              aiFilledFields.has("seoTitle") &&
                                "bg-purple-50 ring-2 ring-purple-500",
                            )}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length ?? 0}/60 characters - This will
                          appear in search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter SEO description"
                            className={cn(
                              "min-h-[100px]",
                              aiFilledFields.has("seoDescription") &&
                                "bg-purple-50 ring-2 ring-purple-500",
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length ?? 0}/200 characters - This will
                          appear in search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="product-url-slug" {...field} />
                        </FormControl>
                        <FormDescription>
                          The URL path for this product (auto-generated from
                          name if left empty)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
