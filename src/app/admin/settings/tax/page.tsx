import { TaxSetupForm } from "@/components/admin/settings/tax-setup-form";

export default function AdminTaxSettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Tax Settings
          </h1>
          <p className="text-muted-foreground leading-relaxed text-balance">
            Configure GST and business tax details for your organization
          </p>
        </div>

        <TaxSetupForm />
      </div>
    </div>
  );
}
