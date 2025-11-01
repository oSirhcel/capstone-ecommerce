"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ShippingMethod } from "@/hooks/admin/settings/use-shipping-methods";
import {
  useDeleteShippingMethodMutation,
  useShippingMethodsQuery,
} from "@/hooks/admin/settings/use-shipping-methods";
import { ShippingMethodForm } from "./shipping-method-form";
import { Loader2, Trash2Icon } from "lucide-react";

export function ShippingMethodList() {
  const { data: methods = [] } = useShippingMethodsQuery();
  const deleteMutation = useDeleteShippingMethodMutation();
  const [editing, setEditing] = useState<ShippingMethod | null>(null);

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Shipping Methods</CardTitle>
          <CardDescription>
            Manage your store&apos;s shipping options
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Method</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Shipping Method</DialogTitle>
            </DialogHeader>
            <ShippingMethodForm
              onSuccess={() =>
                (document.activeElement as HTMLElement | null)?.blur()
              }
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {methods.length === 0 ? (
          <div className="text-muted-foreground">
            No shipping methods yet. Click &quot;Add Method&quot; to create one.
          </div>
        ) : (
          <ul className="space-y-4">
            {methods.map((m) => (
              <li key={m.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {m.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {m.description ?? ""}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>${(m.basePrice / 100).toFixed(2)} AUD</div>
                    <div className="text-muted-foreground">
                      {m.estimatedDays} day(s)
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-end gap-2">
                  <Dialog
                    open={!!editing && editing.id === m.id}
                    onOpenChange={(open) => !open && setEditing(null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setEditing(m)}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Shipping Method</DialogTitle>
                      </DialogHeader>
                      <ShippingMethodForm
                        initial={{
                          id: m.id,
                          name: m.name,
                          description: m.description ?? undefined,
                          basePrice: m.basePrice,
                          estimatedDays: m.estimatedDays,
                          isActive: m.isActive,
                        }}
                        onSuccess={() => setEditing(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    onClick={() => deleteMutation.mutate(m.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trash2Icon className="h-4 w-4" /> Delete
                      </div>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
