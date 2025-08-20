"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Mail } from "lucide-react";

const accountSettingsSchema = z.object({
  role: z.enum(["customer", "seller", "admin"]),
  status: z.enum(["active", "inactive", "suspended"]),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  marketingEmails: z.boolean(),
  orderNotifications: z.boolean(),
  securityAlerts: z.boolean(),
  twoFactorAuth: z.boolean(),
});

export type AccountSettingsData = z.infer<typeof accountSettingsSchema>;

interface AccountSettingsFormProps {
  data: AccountSettingsData;
  onDataChange: (data: AccountSettingsData) => void;
}

export function AccountSettingsForm({
  data,
  onDataChange,
}: AccountSettingsFormProps) {
  const form = useForm<AccountSettingsData>({
    resolver: zodResolver(accountSettingsSchema),
    values: data,
  });

  const handleFieldChange = (field: keyof AccountSettingsData, value: any) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Configure user role and account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select
                      value={data.role}
                      onValueChange={(value) =>
                        handleFieldChange(
                          "role",
                          value as AccountSettingsData["role"],
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines what actions the user can perform
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Status</FormLabel>
                    <Select
                      value={data.status}
                      onValueChange={(value) =>
                        handleFieldChange(
                          "status",
                          value as AccountSettingsData["status"],
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Active
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Inactive</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="suspended">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Suspended</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Verification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Verification
          </CardTitle>
          <CardDescription>
            Email and phone verification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={data.emailVerified}
                        onCheckedChange={(checked) =>
                          handleFieldChange("emailVerified", !!checked)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Email Verified</FormLabel>
                      <FormDescription>
                        Mark email as verified (skip verification email)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={data.phoneVerified}
                        onCheckedChange={(checked) =>
                          handleFieldChange("phoneVerified", !!checked)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Phone Verified</FormLabel>
                      <FormDescription>
                        Mark phone number as verified
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twoFactorAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={data.twoFactorAuth}
                        onCheckedChange={(checked) =>
                          handleFieldChange("twoFactorAuth", !!checked)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Two-Factor Authentication</FormLabel>
                      <FormDescription>
                        Require 2FA for account security
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>Default notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="marketingEmails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={data.marketingEmails}
                        onCheckedChange={(checked) =>
                          handleFieldChange("marketingEmails", !!checked)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Marketing Emails</FormLabel>
                      <FormDescription>
                        Receive promotional emails and newsletters
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={data.orderNotifications}
                        onCheckedChange={(checked) =>
                          handleFieldChange("orderNotifications", !!checked)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Order Notifications</FormLabel>
                      <FormDescription>
                        Receive updates about order status
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="securityAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={data.securityAlerts}
                        onCheckedChange={(checked) =>
                          handleFieldChange("securityAlerts", !!checked)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Security Alerts</FormLabel>
                      <FormDescription>
                        Receive notifications about account security
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
