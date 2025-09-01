"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSelectionForm } from "@/components/admin/orders/customer-selection-form";
import { ProductSelectionForm } from "@/components/admin/orders/product-selection-form";
import { OrderSummaryForm } from "@/components/admin/orders/order-summary-form";
import { PaymentForm } from "@/components/admin/orders/payment-form";
import { toast } from "sonner";

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
  phone: string;
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

export default function CreateOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order state
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
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
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: "card",
    status: "pending",
    notes: "",
  });
  const [orderNotes, setOrderNotes] = useState("");

  // Calculations
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleSubmit = async () => {
    // Validation
    if (!customer) {
      toast.error("Customer Required", {
        description: "Please select a customer for this order.",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Products Required", {
        description: "Please add at least one product to the order.",
      });
      return;
    }

    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.address1
    ) {
      toast.error("Shipping Address Required", {
        description: "Please fill in the shipping address details.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer,
        items: orderItems,
        shippingAddress,
        payment: paymentData,
        notes: orderNotes,
        subtotal,
        shipping,
        tax,
        total,
      };

      console.log("Creating order:", orderData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Order Created Successfully", {
        description: `Order has been created and assigned ID ORD-${Date.now()}`,
      });

      router.push("/admin/orders");
    } catch (error) {
      toast.error("Error Creating Order", {
        description: "There was an error creating the order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/orders");
  };

  return (
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
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Selection */}
          <CustomerSelectionForm
            customer={customer}
            onCustomerChange={setCustomer}
            shippingAddress={shippingAddress}
            onShippingAddressChange={setShippingAddress}
          />

          {/* Product Selection */}
          <ProductSelectionForm
            orderItems={orderItems}
            onOrderItemsChange={setOrderItems}
          />

          {/* Payment Information */}
          <PaymentForm
            paymentData={paymentData}
            onPaymentDataChange={setPaymentData}
            orderNotes={orderNotes}
            onOrderNotesChange={setOrderNotes}
          />
        </div>

        {/* Sidebar - Order Summary */}
        <div>
          <OrderSummaryForm
            customer={customer}
            orderItems={orderItems}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </div>
  );
}
