"use client";
import { useForm } from "react-hook-form";
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

interface CustomerEditDialogProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    tags: string[];
    notes: string;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CustomerEditFormData) => void;
}

export interface CustomerEditFormData {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  tags: string;
  notes: string;
  status: string;
}

export function CustomerEditDialog({
  customer,
  open,
  onOpenChange,
  onSave,
}: CustomerEditDialogProps) {
  function deriveFormFromCustomer(
    c: CustomerEditDialogProps["customer"],
  ): CustomerEditFormData {
    return {
      firstName: c.name.split(" ")[0] || "",
      lastName: c.name.split(" ").slice(1).join(" ") || "",
      phone: c.phone,
      location: c.location,
      tags: c.tags.join(", "),
      notes: c.notes,
      status: c.status,
    };
  }

  const form = useForm<CustomerEditFormData>({
    defaultValues: deriveFormFromCustomer(customer),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) form.reset(deriveFormFromCustomer(customer));
    onOpenChange(nextOpen);
  }

  const onSubmit = form.handleSubmit((data) => {
    if (onSave) onSave(data);
    console.log("Saving changes:", data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Customer Information</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4 py-4">
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

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} id="location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="notes"
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
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
