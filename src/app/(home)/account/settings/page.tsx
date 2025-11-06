"use client";

import ProfileSettings from "@/components/account/profile-settings";
import { ProfileSettingsSkeleton } from "@/components/account/profile-settings";
import PasswordSettings from "@/components/account/password-settings";
import { PasswordSettingsSkeleton } from "@/components/account/password-settings";
import AccountPreferences from "@/components/account/account-preferences";
import { AccountPreferencesSkeleton } from "@/components/account/account-preferences";
import { Card, CardContent } from "@/components/ui/card";
import {
  useProfileQuery,
  useProfileMutations,
} from "@/hooks/account/use-profile";

export default function AccountSettingsPage() {
  const { data: profile, isLoading, error } = useProfileQuery();
  const { updateProfile, changePassword, deleteAccount } =
    useProfileMutations();

  const handleProfileUpdate = async (data: { username: string }) => {
    await updateProfile(data);
  };

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    await changePassword(data);
  };

  const handleDeleteAccount = async (password: string) => {
    await deleteAccount({
      confirmDelete: true,
      password,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          <ProfileSettingsSkeleton />
          <PasswordSettingsSkeleton />
          <AccountPreferencesSkeleton />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              Failed to load profile data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSettings profile={profile} onUpdate={handleProfileUpdate} />

        <PasswordSettings onChangePassword={handlePasswordChange} />

        <AccountPreferences onDeleteAccount={handleDeleteAccount} />
      </div>
    </div>
  );
}
