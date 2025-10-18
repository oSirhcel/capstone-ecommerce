"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { FcGoogle } from "react-icons/fc";

interface SignInContentProps {
  onSuccessRedirect?: string;
  successMessage?: string | null;
  onToggleSignUp?: () => void;
}

interface SignInValues {
  username: string;
  password: string;
}

export function SignInContent({
  onSuccessRedirect = "/",
  successMessage,
  onToggleSignUp,
}: SignInContentProps) {
  const SignInSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { username: "", password: "" },
  });

  const credentialsMutation = useMutation<{ ok: boolean }, Error, SignInValues>(
    {
      mutationFn: async (values: SignInValues) => {
        const result = await signIn("credentials", {
          redirect: false,
          username: values.username,
          password: values.password,
        });

        if (!result || result.error || !result.ok) {
          throw new Error("Invalid credentials");
        }

        return { ok: true };
      },
      onSuccess: () => {
        window.location.href = onSuccessRedirect;
      },
    },
  );

  const googleMutation = useMutation({
    mutationFn: async () => {
      await signIn("google", { callbackUrl: onSuccessRedirect });
    },
  });

  const isLoading = credentialsMutation.isPending || googleMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Sign In</h2>
        <p className="text-muted-foreground text-sm">
          Welcome back! Please sign in to your account
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            credentialsMutation.mutate(values),
          )}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 text-center text-sm text-green-600">
              {successMessage}
            </div>
          )}

          {credentialsMutation.isError && (
            <div className="text-center text-sm text-red-500">
              {credentialsMutation.error?.message || "Sign in failed"}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {credentialsMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <Button
        onClick={() => googleMutation.mutate()}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>

      <div className="text-center text-sm">
        <span className="text-gray-600">Don&apos;t have an account? </span>
        {onToggleSignUp ? (
          <button
            type="button"
            onClick={onToggleSignUp}
            className="text-blue-600 hover:text-blue-500"
          >
            Sign up
          </button>
        ) : (
          <a href="/auth/signup" className="text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        )}
      </div>
    </div>
  );
}
