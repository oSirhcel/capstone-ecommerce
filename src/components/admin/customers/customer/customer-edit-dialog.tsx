"use client";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUpdateCustomer } from "@/hooks/admin/customers/use-customer";

const customerEditSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(100),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(100),
  phone: z.string().max(20).optional(),
  tags: z.string().optional(),
  adminNotes: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Suspended"]),
});

type CustomerEditFormValues = z.input<typeof customerEditSchema>;

interface CustomerEditDialogProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    tags: string[];
    notes: string;
    status: string;
  };
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerEditDialog({
  customer,
  storeId,
  open,
  onOpenChange,
}: CustomerEditDialogProps) {
  const updateMutation = useUpdateCustomer(customer.id, storeId);

  function deriveFormFromCustomer(): CustomerEditFormValues {
    return {
      firstName: customer.name.split(" ")[0] || "",
      lastName: customer.name.split(" ").slice(1).join(" ") || "",
      phone: customer.phone || "",
      tags: customer.tags.join(", "),
      adminNotes: customer.notes || "",
      status: customer.status as "Active" | "Inactive" | "Suspended",
    };
  }

  const form = useForm<CustomerEditFormValues>({
    resolver: zodResolver(customerEditSchema),
    defaultValues: deriveFormFromCustomer(),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) form.reset(deriveFormFromCustomer());
    onOpenChange(nextOpen);
  }

  function onSubmit(data: CustomerEditFormValues) {
    updateMutation.mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        adminNotes: data.adminNotes,
        status: data.status,
      },
      {
        onSuccess: () => {
          toast.success("Customer updated successfully");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update customer");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Customer Information</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            {/* Read-only Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                value={customer.email}
                disabled
                className="bg-muted"
              />
              <p className="text-muted-foreground text-xs">
                Email addresses may only be changed by the customer.
              </p>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} id="firstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} id="lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} id="phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location removed; derived from addresses and not editable here */}

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="tags"
                      placeholder="VIP, Repeat Customer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="adminNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="adminNotes"
                      rows={3}
                      placeholder="Add internal notes about this customer..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
