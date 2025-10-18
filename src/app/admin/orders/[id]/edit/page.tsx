"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSelectionForm } from "@/components/admin/orders/customer-selection-form";
import { ProductSelectionForm } from "@/components/admin/orders/product-selection-form";
import { OrderSummaryForm } from "@/components/admin/orders/order-summary-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useOrderMutations } from "@/hooks/admin/orders/use-order-mutations";
import { useOrderQuery } from "@/hooks/admin/orders/use-order-query";
import { formatOrderNumber } from "@/lib/utils/order-number";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const orderEditFormSchema = z.object({
  customer: z
    .object({
      id: z.string().min(1, "Customer is required"),
      name: z.string(),
      email: z.string(),
      phone: z.string().optional(),
    })
    .nullable()
    .refine((val) => val !== null, { message: "Customer is required" }),
  orderItems: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().min(1),
        image: z.string(),
        sku: z.string(),
      }),
    )
    .min(1, "At least one product is required"),
  selectedAddressId: z.number().nullable(),
  shippingAddress: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    company: z.string().optional(),
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postcode: z.string().min(1, "Postcode is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().optional(),
  }),
});

export type OrderEditFormValues = z.infer<typeof orderEditFormSchema>;

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";

  const { data: order, isLoading } = useOrderQuery({
    id: Number(orderId),
    storeId,
  });

  const { updateDetails } = useOrderMutations(storeId);

  const defaultValues = useMemo<OrderEditFormValues>(() => {
    if (!order) {
      return {
        customer: null,
        orderItems: [],
        selectedAddressId: null,
        shippingAddress: {
          firstName: "",
          lastName: "",
          company: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          postcode: "",
          country: "AU",
          phone: "",
        },
      };
    }

    const shippingAddress = order.addresses.find((a) => a.type === "shipping");

    return {
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: "",
      },
      orderItems: order.items.map((item) => ({
        id: String(item.productId),
        name: item.productName ?? `Product #${item.productId}`,
        price: item.priceAtTime / 100,
        quantity: item.quantity,
        image: "/placeholder.svg",
        sku: "",
      })),
      selectedAddressId: null,
      shippingAddress: {
        firstName: shippingAddress?.firstName ?? "",
        lastName: shippingAddress?.lastName ?? "",
        company: "",
        address1: shippingAddress?.addressLine1 ?? "",
        address2: shippingAddress?.addressLine2 ?? "",
        city: shippingAddress?.city ?? "",
        state: shippingAddress?.state ?? "",
        postcode: shippingAddress?.postcode ?? "",
        country: shippingAddress?.country ?? "AU",
        phone: "",
      },
    };
  }, [order]);

  const form = useForm<OrderEditFormValues>({
    resolver: zodResolver(orderEditFormSchema),
    defaultValues,
    values: defaultValues, // Reset form when order data changes
  });

  const { watch, handleSubmit: createHandleSubmit } = form;

  // Calculations
  const orderItems = watch("orderItems");
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.1; // 10% GST for Australia
  const total = subtotal + shipping + tax;

  const onSubmit = async (data: OrderEditFormValues) => {
    try {
      const payload = {
        items: data.orderItems.map((i) => ({
          productId: Number(i.id),
          quantity: i.quantity,
          priceAtTime: Math.round(i.price * 100),
        })),
        shippingAddress: {
          firstName: data.shippingAddress.firstName,
          lastName: data.shippingAddress.lastName,
          addressLine1: data.shippingAddress.address1,
          addressLine2: data.shippingAddress.address2 ?? undefined,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          postcode: data.shippingAddress.postcode,
          country: data.shippingAddress.country,
        },
      };

      await updateDetails.mutateAsync({ id: Number(orderId), data: payload });

      toast.success("Order Updated Successfully", {
        description: `Order ${formatOrderNumber(orderId)} has been updated.`,
      });
      router.push(`/admin/orders/${orderId}`);
    } catch (error) {
      toast.error("Error Updating Order", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const onError = () => {
    const errors = form.formState.errors;
    if (errors.customer) {
      toast.error("Customer Required", {
        description: errors.customer.message ?? "Customer is required.",
      });
    } else if (errors.orderItems) {
      toast.error("Products Required", {
        description:
          errors.orderItems.message ?? "Please add at least one product.",
      });
    } else if (errors.shippingAddress) {
      toast.error("Shipping Address Incomplete", {
        description: "Please fill in all required address fields.",
      });
    } else {
      toast.error("Validation Error", {
        description: "Please check all required fields.",
      });
    }
  };

  const handleCancel = () => {
    router.push(`/admin/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="mx-4 space-y-6 xl:mx-64">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-4 space-y-6 xl:mx-64">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </div>
    );
  }

  // Check if order can be edited
  if (["Shipped", "Completed"].includes(order.status)) {
    toast.error("Cannot Edit Order", {
      description: "This order has been shipped or completed.",
    });
    router.push(`/admin/orders/${orderId}`);
    return (
      <div className="mx-4 space-y-6 xl:mx-64">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="mx-4 space-y-6 xl:mx-64">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Link
                href={`/admin/orders/${orderId}`}
                className="hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to order
              </Link>
            </div>
            <h1 className="text-3xl font-bold">
              Edit Order {formatOrderNumber(orderId)}
            </h1>
            <p className="text-muted-foreground">
              Update order items and shipping address
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateDetails.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={createHandleSubmit(onSubmit, onError)}
              disabled={updateDetails.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateDetails.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main Content - Left Column */}
          <div className="space-y-6">
            {/* Product Selection */}
            <ProductSelectionForm storeId={storeId} />

            {/* Order Summary */}
            <OrderSummaryForm />
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Customer Selection & Shipping (Read-only customer) */}
            <CustomerSelectionForm storeId={storeId} readOnly={true} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
