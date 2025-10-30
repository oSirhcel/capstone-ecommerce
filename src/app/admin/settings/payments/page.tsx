import { PaymentProviderCard } from "@/components/admin/settings/payment-provider-card";

export default function AdminPaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Setup</h1>
          <p className="text-muted-foreground">
            Connect and manage payment providers
          </p>
        </div>
      </div>

      <PaymentProviderCard />
    </div>
  );
}
