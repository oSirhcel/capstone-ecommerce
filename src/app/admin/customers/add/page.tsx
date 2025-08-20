"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PersonalDetailsForm,
  type PersonalDetailsData,
} from "@/components/admin/customers/add/personal-details-form";
import {
  AddressesForm,
  type AddressData,
} from "@/components/admin/customers/add/addresses-form";
import {
  AccountSettingsForm,
  type AccountSettingsData,
} from "@/components/admin/customers/add/account-settings-form";

import { toast } from "sonner";

export default function AddUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Centralized state management - no useEffect needed!
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    company: "",
    jobTitle: "",
    notes: "",
  });

  const [addresses, setAddresses] = useState<AddressData[]>([]);

  const [accountSettings, setAccountSettings] = useState<AccountSettingsData>({
    role: "customer",
    status: "active",
    emailVerified: false,
    phoneVerified: false,
    marketingEmails: true,
    orderNotifications: true,
    securityAlerts: true,
    twoFactorAuth: false,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Basic validation
    if (
      !personalDetails.firstName ||
      !personalDetails.lastName ||
      !personalDetails.email ||
      !personalDetails.phone
    ) {
      toast.error("Please fill in all required personal details.");
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    try {
      const userData = {
        personalDetails,
        addresses,
        accountSettings,
      };

      console.log("Creating user with data:", userData);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("User created successfully");

      router.push("/admin/users");
    } catch (error) {
      toast.error("Error creating user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/users");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Link
              href="/admin/users"
              className="hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Add New User</h1>
          <p className="text-muted-foreground">
            Create a new user account with personal details and addresses
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
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Details */}
          <PersonalDetailsForm
            data={personalDetails}
            onDataChange={setPersonalDetails}
          />

          {/* Addresses */}
          <AddressesForm
            addresses={addresses}
            onAddressesChange={setAddresses}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AccountSettingsForm
            data={accountSettings}
            onDataChange={setAccountSettings}
          />

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type:</span>
                <span className="capitalize">{accountSettings.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{accountSettings.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Email Verification:
                </span>
                <span>
                  {accountSettings.emailVerified ? "Pre-verified" : "Required"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Addresses:</span>
                <span>{addresses.length} added</span>
              </div>
              <Separator />
              <p className="text-muted-foreground text-xs">
                The user will receive a welcome email with account activation
                instructions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
