"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSelectionForm } from "@/components/admin/orders/customer-selection-form";
import { ProductSelectionForm } from "@/components/admin/orders/product-selection-form";
import { OrderSummaryForm } from "@/components/admin/orders/order-summary-form";
import { PaymentForm } from "@/components/admin/orders/payment-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useOrderMutations } from "@/hooks/admin/orders/use-order-mutations";
import { formatOrderNumber } from "@/lib/utils/order-number";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
};

export type CustomerData = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
};

export type ShippingAddress = {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
};

export type PaymentData = {
  method: "card" | "cash" | "bank_transfer";
  status: "paid" | "pending" | "failed";
  notes?: string;
};

const orderFormSchema = z.object({
  customer: z
    .object({
      id: z.string().min(1, "Customer is required"),
      name: z.string(),
      email: z.string(),
      phone: z.string().optional(),
    })
    .nullable()
    .refine((val) => val !== null, { message: "Please select a customer" }),
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
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().optional(),
  }),
  paymentData: z.object({
    method: z.enum(["card", "cash", "bank_transfer"]),
    status: z.enum(["paid", "pending", "failed"]),
    notes: z.string().optional(),
  }),
  orderNotes: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function CreateOrderPage() {
  const router = useRouter();
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  const { create } = useOrderMutations(storeId);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
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
        zipCode: "",
        country: "US",
        phone: "",
      },
      paymentData: {
        method: "card",
        status: "pending",
        notes: "",
      },
      orderNotes: "",
    },
  });

  const { watch, handleSubmit: createHandleSubmit } = form;

  // Calculations - still needed for submit handler
  const orderItems = watch("orderItems");
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const onSubmit = async (data: OrderFormValues) => {
    try {
      const payload: {
        storeId: string;
        customerId: string;
        items: Array<{
          productId: number;
          quantity: number;
          priceAtTime: number;
        }>;
        totalAmount: number;
        addressId?: number;
        shippingAddress?: {
          firstName: string;
          lastName: string;
          addressLine1: string;
          addressLine2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        notes?: string;
      } = {
        storeId,
        customerId: data.customer!.id,
        items: data.orderItems.map((i) => ({
          productId: Number(i.id),
          quantity: i.quantity,
          priceAtTime: Math.round(i.price * 100),
        })),
        totalAmount: Math.round(total * 100),
        notes: data.orderNotes ?? undefined,
      };

      // Include either addressId or shippingAddress
      if (data.selectedAddressId) {
        payload.addressId = data.selectedAddressId;
      } else {
        payload.shippingAddress = {
          firstName: data.shippingAddress.firstName,
          lastName: data.shippingAddress.lastName,
          addressLine1: data.shippingAddress.address1,
          addressLine2: data.shippingAddress.address2 ?? undefined,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          postalCode: data.shippingAddress.zipCode,
          country: data.shippingAddress.country,
        };
      }

      const result = await create.mutateAsync(payload);

      toast.success("Order Created Successfully", {
        description: `Order ${formatOrderNumber(result.orderId)} has been created.`,
      });
      router.push(`/admin/orders/${result.orderId}`);
    } catch (error) {
      toast.error("Error Creating Order", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const onError = () => {
    const errors = form.formState.errors;
    if (errors.customer) {
      toast.error("Customer Required", {
        description: errors.customer.message ?? "Please select a customer.",
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
    router.push("/admin/orders");
  };

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Link
                href="/admin/orders"
                className="hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to orders
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Create New Order</h1>
            <p className="text-muted-foreground">
              Manually create an order for a customer
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={create.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={createHandleSubmit(onSubmit, onError)}
              disabled={create.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {create.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer Selection */}
            <CustomerSelectionForm storeId={storeId} />

            {/* Product Selection */}
            <ProductSelectionForm storeId={storeId} />

            {/* Payment Information */}
            <PaymentForm />
          </div>

          {/* Sidebar - Order Summary */}
          <div>
            <OrderSummaryForm />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
