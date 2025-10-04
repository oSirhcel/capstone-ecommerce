"use client";
import React, { useState } from "react";

import { useDebounceCallback } from "usehooks-ts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ChevronLeftIcon, PencilIcon, StoreIcon } from "lucide-react";
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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z
    .string()
    .min(4, {
      message: "Store name must be at least 4 characters.",
    })
    .trim(),
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
];

export const OnboardingForm = () => {
  const { update } = useSession();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const [query, setQuery] = useState("");

  const { data: isHandleAvailable, isLoading: isHandleLoading } =
    useStoreNameAvailability(query);

  const mutation = useCreateStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { name: "", description: "" },
  });

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

  const onSubmit = async (values: FormValues) => {
    mutation.mutate(
      {
        name: values.name,
        description: values.description ?? "",
      },
      {
        onSuccess: (result) => {
          // Ensure session is updated with store id before navigating to admin to avoid redirect loop
          if (result.data) {
            void update({ store: { id: result.data.id } })
              .then(() => {
                router.replace("/admin");
              })
              .catch(() => {
                // Even if update fails, attempt navigation to let middleware evaluate latest token
                router.replace("/admin");
              });
          }
        },
      },
    );
  };

  const debounced = useDebounceCallback(setQuery, 300);

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
                            debounced(e.target.value);
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
                        ) : query.length >= 4 ? (
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

          <div className="p-6 pt-2">
            <div className="mb-2 flex items-center justify-center space-x-2">
              <div
                className={cn(
                  "bg-muted-foreground size-2 rounded-full transition-all",
                  activeIndex === 0 && "bg-primary size-2.5",
                )}
              />
              <div
                className={cn(
                  "bg-muted-foreground size-2 rounded-full transition-all",
                  activeIndex === 1 && "bg-primary size-2.5",
                )}
              />
              <div
                className={cn(
                  "bg-muted-foreground size-2 rounded-full transition-all",
                  activeIndex === 2 && "bg-primary size-2.5",
                )}
              />
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
              <Button type="submit" className="mt-4 w-full">
                Complete
              </Button>
            )}
          </div>
        </Card>
      </form>
    </Form>
  );
};
