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
import { X, Save, PlusIcon, CloudOff, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/products/use-product-mutations";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import { useSession } from "next-auth/react";
import { ProductShotModal } from "./product-shot-modal";
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useAIFormFields } from "@/contexts/ai-form-fields-context";
import { FormIntegrationService } from "@/lib/ai/form-integration-service";
import { cn } from "@/lib/utils";
import { TagInput } from "@/components/ui/tag-input";
import { useTagsQuery } from "@/hooks/tags/use-tags-query";
import { useCreateTag } from "@/hooks/tags/use-tag-mutations";
import { MoneyInput } from "@/components/ui/money-input";
import { QuantityInput } from "@/components/ui/quantity-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { categoryNameToSlug } from "@/lib/utils/category-slug";

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
    tags: z.array(z.string()).optional().default([]),
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
    status: z.enum(["Active", "Draft", "Archived"]).default("Draft"),
    featured: z.boolean().default(false),
    images: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // SKU is required when status is "active"
      if (data.status === "Active" && (!data.sku || data.sku === "")) {
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
        data.status === "Active" &&
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
        data.status === "Active" &&
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
  )
  .refine(
    (data) => {
      if (
        data.status === "Active" &&
        (!data.category || data.category === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Category is required for active products",
      path: ["category"],
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
  const deleteProductMutation = useDeleteProduct();

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

  // Fetch all tags for conversion
  const { data: allTags = [] } = useTagsQuery();
  const createTagMutation = useCreateTag();

  // Fetch categories for mapping slug to ID
  const { data: categoriesData } = useQuery<{
    categories: Array<{ id: number; name: string }>;
  }>({
    queryKey: ["categories"],
    queryFn: async (): Promise<{
      categories: Array<{ id: number; name: string }>;
    }> => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as Promise<{
        categories: Array<{ id: number; name: string }>;
      }>;
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      sku: initialData?.sku ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? 0,
      compareAtPrice: initialData?.compareAtPrice ?? 0,
      costPerItem: initialData?.costPerItem ?? 0,
      category: initialData?.category ?? undefined,
      tags: initialData?.tags ?? [],
      trackQuantity: initialData?.trackQuantity ?? true,
      quantity: initialData?.quantity ?? 0,
      allowBackorders: false,
      weight: initialData?.weight ?? 0,
      dimensions: {
        length: initialData?.dimensions?.length ?? 0,
        width: initialData?.dimensions?.width ?? 0,
        height: initialData?.dimensions?.height ?? 0,
      },
      seoTitle: initialData?.seoTitle ?? "",
      seoDescription: initialData?.seoDescription ?? "",
      slug: initialData?.slug ?? "",
      status: "Draft",
      featured: false,
      images: [],
      ...(initialData && {
        ...initialData,
        // Ensure tags is always an array after spread
        tags: Array.isArray(initialData.tags)
          ? initialData.tags
          : typeof initialData.tags === "string"
            ? (initialData.tags as string)
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
            : [],
      }),
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
    // Create tags that don't exist and convert tag names to tag IDs
    const tagIds = await Promise.all(
      (data.tags ?? []).map(async (tagName: string) => {
        // Check if tag already exists
        const existingTag = allTags.find((t) => t?.name === tagName);
        if (existingTag) {
          return existingTag.id;
        }

        // Create new tag
        try {
          const result = await createTagMutation.mutateAsync(tagName);
          if (result?.data) {
            console.log("Created tag:", result.data);
            return result.data.id;
          }
          return 0;
        } catch (error) {
          console.error(`Failed to create tag "${tagName}":`, error);
          return 0;
        }
      }),
    );

    // Filter out any failed tag creations (0 values)
    const validTagIds = tagIds.filter((id: number) => id > 0);

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
      tagIds: validTagIds,
      storeId,
      categoryId:
        data.category && categoriesData?.categories
          ? categoriesData.categories.find(
              (cat) => categoryNameToSlug(cat.name) === data.category,
            )?.id
          : undefined,
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

  const handleDelete = () => {
    if (!productId) return;
    deleteProductMutation.mutate(productId, {
      onSuccess: () => {
        router.push("/admin/products");
      },
    });
  };

  const productName = form.watch("name") ?? initialData?.name ?? "this product";

  return (
    <div className="space-y-6">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            {isDirty ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <CloudOff className="h-4 w-4" />
                Unsaved changes
              </p>
            ) : (
              <div className="h-5" />
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
          className="mx-auto space-y-6 lg:max-w-6xl"
        >
          <Tabs defaultValue="information" className="space-y-6">
            <TabsList className="w-full">
              <TabsTrigger value="information"> Info</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent
              value="information"
              className="grid grid-cols-1 gap-6 md:grid-cols-6"
            >
              <div className="col-span-4 space-y-6">
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
                              SKU {form.watch("status") === "Active" && "*"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter SKU"
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
                            Description{" "}
                            {form.watch("status") === "Active" && "*"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter detailed product description"
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
                              Price {form.watch("status") === "Active" && "*"}
                            </FormLabel>
                            <FormControl>
                              <MoneyInput
                                value={
                                  field.value != null ? field.value * 100 : null
                                }
                                className={cn(
                                  aiFilledFields.has("price") &&
                                    "bg-purple-50 ring-2 ring-purple-500",
                                )}
                                onChange={(cents) => {
                                  field.onChange(
                                    cents == null ? null : cents / 100,
                                  );
                                }}
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
                              <MoneyInput
                                value={
                                  field.value != null ? field.value * 100 : null
                                }
                                className={cn(
                                  aiFilledFields.has("compareAtPrice") &&
                                    "bg-purple-50 ring-2 ring-purple-500",
                                )}
                                onChange={(cents) => {
                                  field.onChange(
                                    cents == null ? null : cents / 100,
                                  );
                                }}
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
                              <MoneyInput
                                value={
                                  field.value != null ? field.value * 100 : null
                                }
                                onChange={(cents) =>
                                  field.onChange(
                                    cents == null ? null : cents / 100,
                                  )
                                }
                                className={cn(
                                  aiFilledFields.has("costPerItem") &&
                                    "bg-purple-50 ring-2 ring-purple-500",
                                )}
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
              </div>

              <div className="col-span-2 space-y-6">
                <Card>
                  <CardContent>
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
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Organisation</CardTitle>
                    <CardDescription>
                      Categorise and tag your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Category {form.watch("status") === "Active" && "*"}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
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
                            <TagInput
                              tags={
                                Array.isArray(field.value) ? field.value : []
                              }
                              onTagsChange={(tags) => field.onChange(tags)}
                              placeholder="Add a tag and press Enter"
                            />
                          </FormControl>
                          <FormDescription className="hidden">
                            Help customers find your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
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
                  </CardContent>
                </Card>
                {isEditing && productId && (
                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="text-destructive">
                        Danger Zone
                      </CardTitle>
                      <CardDescription className="text-destructive">
                        Delete this product and all of its contents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <Trash2 className="size-5" />
                              Delete Product
                            </AlertDialogTitle>
                            <div className="bg-destructive/10 text-destructive inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                              Permanent Action
                            </div>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{productName}
                              &quot; and all of its contents. This action cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              disabled={deleteProductMutation.isPending}
                              className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                              {deleteProductMutation.isPending
                                ? "Deleting..."
                                : "Delete Product"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                )}
              </div>
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
                              <QuantityInput
                                step={1}
                                min={0}
                                decimalPlaces={0}
                                placeholder="0"
                                {...field}
                                className={cn(
                                  aiFilledFields.has("quantity") &&
                                    "bg-purple-50 ring-2 ring-purple-500",
                                )}
                                onChange={field.onChange}
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
                          <QuantityInput
                            step={0.5}
                            min={0}
                            decimalPlaces={2}
                            placeholder="0.00"
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            className={cn(
                              aiFilledFields.has("weight") &&
                                "bg-purple-50 ring-2 ring-purple-500",
                            )}
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
                            <QuantityInput
                              step={0.5}
                              min={0}
                              decimalPlaces={2}
                              placeholder="0.00"
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              className={cn(
                                aiFilledFields.has("dimensions.length") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
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
                            <QuantityInput
                              step={0.5}
                              min={0}
                              decimalPlaces={2}
                              placeholder="0.00"
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              className={cn(
                                aiFilledFields.has("dimensions.width") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
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
                            <QuantityInput
                              step={1}
                              min={0}
                              decimalPlaces={2}
                              placeholder="0.00"
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              className={cn(
                                aiFilledFields.has("dimensions.height") &&
                                  "bg-purple-50 ring-2 ring-purple-500",
                              )}
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
