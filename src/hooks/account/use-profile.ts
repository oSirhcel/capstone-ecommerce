import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  type ProfileData,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from "@/lib/api/profile";
import { toast } from "sonner";

export function useProfileQuery() {
  return useQuery<ProfileData, Error>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => updateProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) => changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (data: DeleteAccountInput) => deleteAccount(data),
    onSuccess: async () => {
      // Sign out the user and redirect to home
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/" });
      toast.success("Your account has been permanently deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
}

