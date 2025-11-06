"use client";
import React, { useState, useEffect, useRef } from "react";

import { useDebounceCallback } from "usehooks-ts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChevronLeftIcon,
  PencilIcon,
  StoreIcon,
  LinkIcon,
  SparklesIcon,
  Loader2Icon,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateStore } from "@/hooks/onboarding/use-store-mutations";
import { useStoreNameAvailability } from "@/hooks/onboarding/use-store-availability";
import { useSlugGeneration } from "@/hooks/onboarding/use-slug-generation";
import { useSlugAvailability } from "@/hooks/onboarding/use-slug-availability";
import { useSession } from "next-auth/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const formSchema = z.object({
  name: z
    .string()
    .min(4, {
      message: "Store name must be at least 4 characters.",
    })
    .trim(),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters." })
    .max(50, { message: "Slug must be less than 50 characters." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must be lowercase with hyphens only.",
    })
    .trim(), // NEW
  description: z
    .string()
    .max(1000, {
      message: "Description must be less than 1000 characters.",
    })
    .trim(),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  {
    id: "Start",
    name: "Welcome",
    fields: [],
  },
  {
    id: "Step 1",
    name: "Store Name",
    fields: ["name"],
  },
  {
    id: "Step 2",
    name: "Description",
    fields: ["description"],
  },
  {
    id: "Step 3",
    name: "Store Slug",
    fields: ["slug"],
  }, // NEW
];

export const OnboardingForm = () => {
  const { update } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFallbackRedirect, setShowFallbackRedirect] = useState(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [nameQuery, setNameQuery] = useState("");
  const [slugQuery, setSlugQuery] = useState("");

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const { data: isHandleAvailable, isLoading: isHandleLoading } =
    useStoreNameAvailability(nameQuery);

  const mutation = useCreateStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { name: "", slug: "", description: "" },
  });

  const [generatedSlugs, setGeneratedSlugs] = useState<string[]>([]);
  const [isGeneratingSlugs, setIsGeneratingSlugs] = useState(false);
  const slugMutation = useSlugGeneration();
  const { data: isSlugAvailable, isLoading: isSlugLoading } =
    useSlugAvailability(slugQuery);

  type FormField = keyof FormValues;

  const onNext = async () => {
    const fields = steps[activeIndex]?.fields;
    const output = await form.trigger(fields as FormField[], {
      shouldFocus: true,
    });

    if (!output) return;

    if (activeIndex === steps.length - 1) {
      await onSubmit(form.getValues());
      return;
    }
    setActiveIndex((step) => step + 1);
  };

  const onPrevious = () => {
    setActiveIndex((step) => step - 1);
  };

  const generateSlugs = async () => {
    const storeName = form.getValues("name");
    setIsGeneratingSlugs(true);
    try {
      const slugs = await slugMutation.mutateAsync(storeName);
      setGeneratedSlugs(slugs);
    } catch (error) {
      console.error("Failed to generate slugs:", error);
    } finally {
      setIsGeneratingSlugs(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    mutation.mutate(
      {
        name: values.name,
        description: values.description ?? "",
        slug: values.slug,
      },
      {
        onSuccess: (result) => {
          if (result.data) {
            // Show fallback button after a short delay in case redirect doesn't work
            fallbackTimerRef.current = setTimeout(() => {
              setShowFallbackRedirect(true);
            }, 2000);

            // Wait for session update to complete before navigating
            void update({ store: { id: result.data.id } })
              .then(() => {
                if (fallbackTimerRef.current) {
                  clearTimeout(fallbackTimerRef.current);
                  fallbackTimerRef.current = null;
                }
                // Use window.location for full page reload to ensure middleware reads updated session
                window.location.href = "/admin";
              })
              .catch(() => {
                if (fallbackTimerRef.current) {
                  clearTimeout(fallbackTimerRef.current);
                  fallbackTimerRef.current = null;
                }
                setShowFallbackRedirect(true);
                // Even if update fails, attempt navigation to let middleware evaluate latest token
                window.location.href = "/admin";
              });
          }
        },
      },
    );
  };

  const debouncedName = useDebounceCallback(setNameQuery, 300);
  const debouncedSlug = useDebounceCallback(setSlugQuery, 300);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <Card className="overflow-hidden">
          <div className="p-6 pb-0">
            {activeIndex !== 0 && (
              <Button
                variant="ghost"
                type="button"
                size={"icon"}
                onClick={onPrevious}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="mr-0.5" />
              </Button>
            )}
          </div>

          {activeIndex === 0 && (
            <div>
              <CardHeader className="pt-0 pb-0 text-center">
                <div className="p-2 text-4xl leading-tight">👋</div>
                <CardTitle className="mb-1.5">
                  Welcome to your store setup
                </CardTitle>
                <CardDescription>
                  Let&apos;s create your store in two quick steps.
                </CardDescription>
              </CardHeader>
              <CardContent></CardContent>
            </div>
          )}

          {activeIndex === 1 && (
            <div>
              <CardHeader className="pt-0 text-center">
                <div className="bg-primary/20 mx-auto mt-1.5 flex size-12 items-center justify-center self-center rounded-full">
                  <StoreIcon className="text-primary size-8" />
                </div>
                <CardTitle className="mt-4">Name your store</CardTitle>
                <CardDescription className="mt-1.5">
                  This is the public name customers will see.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Acme Store"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            debouncedName(e.target.value);
                          }}
                          className={cn(
                            form.formState.errors.name && field.value.length > 0
                              ? "focus-visible:ring-rose-500"
                              : "focus-visible:ring-primary peer",
                          )}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {form.formState.errors.name &&
                        field.value.length > 0 ? (
                          <span className="text-rose-500">
                            Store name must be at least 4 characters.
                          </span>
                        ) : nameQuery.length >= 4 ? (
                          isHandleLoading ? (
                            <span>Checking availability…</span>
                          ) : isHandleAvailable ? (
                            <span className="text-green-500">
                              This store name is available.
                            </span>
                          ) : (
                            <span className="text-rose-500">
                              This store name is taken.
                            </span>
                          )
                        ) : (
                          <span>You can change this later.</span>
                        )}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </div>
          )}

          {activeIndex === 2 && (
            <div>
              <CardHeader className="pt-0 text-center">
                <div className="bg-primary/20 mx-auto mt-1.5 flex size-12 items-center justify-center self-center rounded-full">
                  <PencilIcon className="text-primary size-8" />
                </div>
                <CardTitle className="mt-4">Add a short description</CardTitle>
                <CardDescription className="mt-1.5">
                  Tell customers what your store is about (optional).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="We sell premium gadgets and accessories."
                          maxLength={1000}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Briefly describe your store (up to 1000 characters).
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </div>
          )}

          {activeIndex === 3 && (
            <div>
              <CardHeader className="pt-0 text-center">
                <div className="bg-primary/20 mx-auto mt-1.5 flex size-12 items-center justify-center self-center rounded-full">
                  <LinkIcon className="text-primary size-8" />
                </div>
                <CardTitle className="mt-4">Choose your store URL</CardTitle>
                <CardDescription className="mt-1.5">
                  Your store will be accessible at: buyio.com/stores/[your-slug]
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <InputGroup>
                            <InputGroupInput
                              placeholder="my-store"
                              className="!pl-1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                debouncedSlug(e.target.value);
                              }}
                            />
                            <InputGroupAddon>
                              <InputGroupText className="text-muted-foreground">
                                https://buyio.com/stores/
                              </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InputGroupButton
                                    size="icon-sm"
                                    className="text-primary"
                                    onClick={generateSlugs}
                                    disabled={isGeneratingSlugs}
                                    title="Generate AI suggestions"
                                  >
                                    {isGeneratingSlugs ? (
                                      <Loader2Icon className="size-4 animate-spin" />
                                    ) : (
                                      <SparklesIcon className="size-4" />
                                    )}
                                  </InputGroupButton>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Generate AI suggestions for your store URL.
                                </TooltipContent>
                              </Tooltip>
                            </InputGroupAddon>
                          </InputGroup>
                          {generatedSlugs.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-muted-foreground text-xs">
                                Available suggestions:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {generatedSlugs.map((slug) => (
                                  <Button
                                    key={slug}
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => field.onChange(slug)}
                                  >
                                    {slug}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        {form.formState.errors.slug &&
                        field.value.length > 0 ? (
                          <span className="text-rose-500">
                            {form.formState.errors.slug.message}
                          </span>
                        ) : slugQuery.length >= 3 ? (
                          isSlugLoading ? (
                            <span>Checking availability…</span>
                          ) : isSlugAvailable ? (
                            <span className="text-green-500">
                              This slug is available!
                            </span>
                          ) : (
                            <span className="text-rose-500">
                              This slug is taken.
                            </span>
                          )
                        ) : (
                          <span>Choose a unique URL for your store.</span>
                        )}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </div>
          )}

          <div className="p-6 pt-2">
            <div className="mb-2 flex items-center justify-center space-x-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-muted-foreground size-2 rounded-full transition-all",
                    activeIndex === index && "bg-primary size-2.5",
                  )}
                />
              ))}
            </div>
            {activeIndex == 0 && (
              <>
                <Button type="button" onClick={onNext} className="mt-4 w-full">
                  Get Started
                </Button>
              </>
            )}

            {activeIndex == 1 && (
              <Button type="button" onClick={onNext} className="mt-4 w-full">
                Next
              </Button>
            )}
            {activeIndex === 2 && (
              <Button type="button" onClick={onNext} className="mt-4 w-full">
                Next
              </Button>
            )}
            {activeIndex === 3 && (
              <>
                <Button
                  type="submit"
                  className="mt-4 w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Creating store..." : "Complete"}
                </Button>
                {showFallbackRedirect && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      window.location.href = "/admin";
                    }}
                  >
                    Continue to Admin Dashboard
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>
      </form>
    </Form>
  );
};
