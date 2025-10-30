import { ShippingMethodList } from "@/components/admin/settings/shipping-method-list";

export default function AdminShippingSettingsPage() {
  return (
    <div className="mx-4 space-y-6 xl:mx-64">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Settings</h1>
          <p className="text-muted-foreground">
            Create and manage shipping methods
          </p>
        </div>
      </div>

      <ShippingMethodList />
    </div>
  );
}
