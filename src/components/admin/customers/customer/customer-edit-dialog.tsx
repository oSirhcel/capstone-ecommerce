"use client";

import { useState, useEffect } from "react";
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
  const [editForm, setEditForm] = useState<CustomerEditFormData>({
    firstName: customer.name.split(" ")[0] || "",
    lastName: customer.name.split(" ").slice(1).join(" ") || "",
    phone: customer.phone,
    location: customer.location,
    tags: customer.tags.join(", "),
    notes: customer.notes,
    status: customer.status,
  });

  // Reset form when customer changes or dialog opens
  useEffect(() => {
    if (open) {
      setEditForm({
        firstName: customer.name.split(" ")[0] || "",
        lastName: customer.name.split(" ").slice(1).join(" ") || "",
        phone: customer.phone,
        location: customer.location,
        tags: customer.tags.join(", "),
        notes: customer.notes,
        status: customer.status,
      });
    }
  }, [customer, open]);

  const handleSave = () => {
    if (onSave) {
      onSave(editForm);
    }
    // TODO: Implement API call to save changes
    console.log("Saving changes:", editForm);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Customer Information</DialogTitle>
          <DialogDescription>
            Update customer details. Note: Email and password can only be
            changed by the customer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Read-only Email */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email (read-only)
            </Label>
            <Input
              id="email"
              value={customer.email}
              disabled
              className="bg-muted"
            />
            <p className="text-muted-foreground text-xs">
              Email addresses can only be changed by the customer for security
              reasons.
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Phone */}
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="status">Account Status</Label>
            <Select
              value={editForm.status}
              onValueChange={(value) =>
                setEditForm({ ...editForm, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={editForm.tags}
              onChange={(e) =>
                setEditForm({ ...editForm, tags: e.target.value })
              }
              placeholder="VIP, Repeat Customer"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea
              id="notes"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              rows={3}
              placeholder="Add internal notes about this customer..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
