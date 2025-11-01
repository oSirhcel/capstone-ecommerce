"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreById } from "@/lib/api/stores";
import { useStoreQueryBySlug } from "@/hooks/stores/use-store-query-by-slug";
import { useStoreMutations } from "@/hooks/stores/use-store-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SlugInput } from "@/components/ui/slug-input";
import { CollapsiblePolicySection } from "@/components/admin/collapsible-policy-section";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  AlertCircle,
  Store,
  Mail,
  Link2,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_SHIPPING_POLICY,
  DEFAULT_RETURN_POLICY,
  DEFAULT_PRIVACY_POLICY,
  DEFAULT_TERMS_OF_SERVICE,
} from "@/lib/default-policies";

const storeSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .max(255, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  shippingPolicy: z.string().optional(),
  returnPolicy: z.string().optional(),
  privacyPolicy: z.string().optional(),
  termsOfService: z.string().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

export default function StoreManagementPage() {
  const { data: session } = useSession();
  const storeId = session?.store?.id;
  const [activePolicyTab, setActivePolicyTab] = useState("shipping");
  const initializedStoreRef = useRef<string | null>(null);

  const {
    data: storeById,
    isLoading: isLoadingById,
    error: errorById,
  } = useQuery({
    queryKey: ["store-by-id", storeId],
    queryFn: () => fetchStoreById(storeId!),
    enabled: !!storeId,
  });

  const {
    data: store,
    isLoading,
    error,
  } = useStoreQueryBySlug(storeById?.slug ?? "");

  const { updateStore, isUpdating } = useStoreMutations();

  // Only initialize form when store data is available
  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: store
      ? {
          name: store.name ?? "",
          description: store.description ?? "",
          contactEmail: store.settings?.contactEmail ?? "",
          slug: store.slug ?? "",
          shippingPolicy: store.settings?.shippingPolicy ?? "",
          returnPolicy: store.settings?.returnPolicy ?? "",
          privacyPolicy: store.settings?.privacyPolicy ?? "",
          termsOfService: store.settings?.termsOfService ?? "",
        }
      : {
          name: "",
          description: "",
          contactEmail: "",
          slug: "",
          shippingPolicy: "",
          returnPolicy: "",
          privacyPolicy: "",
          termsOfService: "",
        },
  });

  useLayoutEffect(() => {
    if (store && initializedStoreRef.current !== store.id) {
      initializedStoreRef.current = store.id;
      form.reset({
        name: store.name ?? "",
        description: store.description ?? "",
        contactEmail: store.settings?.contactEmail ?? "",
        slug: store.slug ?? "",
        shippingPolicy: store.settings?.shippingPolicy ?? "",
        returnPolicy: store.settings?.returnPolicy ?? "",
        privacyPolicy: store.settings?.privacyPolicy ?? "",
        termsOfService: store.settings?.termsOfService ?? "",
      });
    }
  }, [store, form]);

  const onSubmit = async (data: StoreFormData) => {
    try {
      await updateStore({
        slug: store!.slug,
        name: data.name,
        description: data.description,
        newSlug: data.slug !== store!.slug ? data.slug : undefined,
        contactEmail: data.contactEmail,
        shippingPolicy: data.shippingPolicy,
        returnPolicy: data.returnPolicy,
        privacyPolicy: data.privacyPolicy,
        termsOfService: data.termsOfService,
      });
      // Reset the initialized ref so form refreshes with new data after query invalidation
      initializedStoreRef.current = null;
    } catch (error) {
      console.error("Failed to update store:", error);
    }
  };

  if (errorById || error) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Store Management
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Configure your store settings and policies
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-base">
            Failed to load store information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingById || isLoading || !store) {
    return (
      <div className="mx-4 space-y-6 xl:mx-64">
        {/* Real header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Store Management</h1>
            <p className="text-muted-foreground">
              Configure your store settings and policies
            </p>
          </div>
        </div>

        {/* Form with disabled tabs */}
        <div className="space-y-8">
          {/* Tab content skeleton */}
          <div className="mt-6 space-y-6">
            {/* General Information Card */}
            <div className="rounded-lg border-2 shadow-sm">
              <div className="p-6 pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="space-y-6 px-6 pb-6">
                {/* Store Name Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-3 w-80" />
                </div>
                {/* Store Description Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="rounded-lg border-2 shadow-sm">
              <div className="p-6 pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-3 w-72" />
                </div>
              </div>
            </div>

            {/* Store URL Card */}
            <div className="rounded-lg border-2 shadow-sm">
              <div className="p-6 pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="space-y-4 px-6 pb-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-3 w-96" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button Card */}
          <div className="bg-muted/50 rounded-lg border-2">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-12 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 space-y-6 xl:mx-64">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground">
            Configure your store settings and policies
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* General Information Card */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Store className="text-primary h-5 w-5" />
                General Information
              </CardTitle>
              <CardDescription className="text-base">
                Basic details about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Store Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your store name"
                        disabled={isUpdating}
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <FormDescription>
                      This is the public name of your store that customers will
                      see
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Store Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe what makes your store unique..."
                        disabled={isUpdating}
                        rows={5}
                        className="resize-none text-base"
                      />
                    </FormControl>
                    <FormDescription className="flex items-center justify-between">
                      <span>
                        Help customers understand what your store offers
                      </span>
                      <span className="text-xs">
                        {field.value?.length ?? 0}/1000
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Mail className="text-primary h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription className="text-base">
                How customers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Contact Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="contact@yourstore.com"
                          disabled={isUpdating}
                          className="h-12 pl-11 text-base"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Primary email for customer inquiries and support
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Store URL Card */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Link2 className="text-primary h-5 w-5" />
                Store URL
              </CardTitle>
              <CardDescription className="text-base">
                Your unique store web address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Store Slug
                    </FormLabel>
                    <FormControl>
                      <SlugInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="your-store"
                        disabled={isUpdating}
                        storeName={form.getValues("name")}
                      />
                    </FormControl>
                    <FormDescription>
                      Use only lowercase letters, numbers, and hyphens (3-50
                      characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Policies Card */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="text-primary h-5 w-5" />
                Store Policies
              </CardTitle>
              <CardDescription className="text-base">
                Legal policies and terms for your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activePolicyTab}
                onValueChange={setActivePolicyTab}
                className="w-full"
              >
                <TabsList className="grid h-auto w-full grid-cols-4 p-1">
                  <TabsTrigger value="shipping" className="gap-2 py-3">
                    <FileText className="h-4 w-4" />
                    Shipping
                  </TabsTrigger>
                  <TabsTrigger value="return" className="gap-2 py-3">
                    <FileText className="h-4 w-4" />
                    Return
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="gap-2 py-3">
                    <FileText className="h-4 w-4" />
                    Privacy
                  </TabsTrigger>
                  <TabsTrigger value="terms" className="gap-2 py-3">
                    <FileText className="h-4 w-4" />
                    Terms
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="shipping" className="mt-6">
                  <CollapsiblePolicySection
                    title="Shipping Policy"
                    description="Information about shipping methods, costs, and delivery times"
                    isRequired={true}
                    isFilled={!!form.watch("shippingPolicy")}
                  >
                    <div className="space-y-3">
                      {!form.watch("shippingPolicy") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const contactEmail = form.getValues("contactEmail");
                            const defaultPolicy =
                              DEFAULT_SHIPPING_POLICY.replace(
                                "[Your Contact Email]",
                                contactEmail ?? "[Your Contact Email]",
                              );
                            form.setValue("shippingPolicy", defaultPolicy);
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Use Default Template
                        </Button>
                      )}
                      <FormField
                        control={form.control}
                        name="shippingPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter your shipping policy..."
                                disabled={isUpdating}
                                rows={12}
                                className="resize-none text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsiblePolicySection>
                </TabsContent>

                <TabsContent value="return" className="mt-6">
                  <CollapsiblePolicySection
                    title="Return Policy"
                    description="Information about returns, refunds, and exchanges"
                    isRequired={false}
                    isFilled={!!form.watch("returnPolicy")}
                    onAdd={() => setActivePolicyTab("return")}
                  >
                    <div className="space-y-3">
                      {!form.watch("returnPolicy") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const contactEmail = form.getValues("contactEmail");
                            const defaultPolicy = DEFAULT_RETURN_POLICY.replace(
                              "[Your Contact Email]",
                              contactEmail ?? "[Your Contact Email]",
                            );
                            form.setValue("returnPolicy", defaultPolicy);
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Use Default Template
                        </Button>
                      )}
                      <FormField
                        control={form.control}
                        name="returnPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter your return policy..."
                                disabled={isUpdating}
                                rows={12}
                                className="resize-none text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsiblePolicySection>
                </TabsContent>

                <TabsContent value="privacy" className="mt-6">
                  <CollapsiblePolicySection
                    title="Privacy Policy"
                    description="How you collect, use, and protect customer information"
                    isRequired={false}
                    isFilled={!!form.watch("privacyPolicy")}
                    onAdd={() => setActivePolicyTab("privacy")}
                  >
                    <div className="space-y-3">
                      {!form.watch("privacyPolicy") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const contactEmail = form.getValues("contactEmail");
                            const defaultPolicy =
                              DEFAULT_PRIVACY_POLICY.replace(
                                "[Your Contact Email]",
                                contactEmail ?? "[Your Contact Email]",
                              );
                            form.setValue("privacyPolicy", defaultPolicy);
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Use Default Template
                        </Button>
                      )}
                      <FormField
                        control={form.control}
                        name="privacyPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter your privacy policy..."
                                disabled={isUpdating}
                                rows={12}
                                className="resize-none text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsiblePolicySection>
                </TabsContent>

                <TabsContent value="terms" className="mt-6">
                  <CollapsiblePolicySection
                    title="Terms of Service"
                    description="Terms and conditions for using your store"
                    isRequired={false}
                    isFilled={!!form.watch("termsOfService")}
                    onAdd={() => setActivePolicyTab("terms")}
                  >
                    <div className="space-y-3">
                      {!form.watch("termsOfService") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const storeName = form.getValues("name");
                            const contactEmail = form.getValues("contactEmail");
                            const defaultPolicy =
                              DEFAULT_TERMS_OF_SERVICE.replace(
                                "[Store Name]",
                                storeName || "[Store Name]",
                              ).replace(
                                "[Your Contact Email]",
                                contactEmail ?? "[Your Contact Email]",
                              );
                            form.setValue("termsOfService", defaultPolicy);
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Use Default Template
                        </Button>
                      )}
                      <FormField
                        control={form.control}
                        name="termsOfService"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter your terms of service..."
                                disabled={isUpdating}
                                rows={12}
                                className="resize-none text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsiblePolicySection>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">Ready to save your changes?</p>
                  <p className="text-muted-foreground text-sm">
                    All changes will be applied immediately
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  size="lg"
                  className="h-12 min-w-[160px]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
