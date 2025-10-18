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

interface SignUpContentProps {
  onSuccessRedirect?: string;
  onToggleSignIn?: () => void;
}

interface SignUpValues {
  username: string;
  password: string;
  confirmPassword: string;
}

export function SignUpContent({
  onSuccessRedirect = "/",
  onToggleSignIn,
}: SignUpContentProps) {
  const SignUpSchema = z
    .object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z
        .string()
        .min(6, "Confirm password must be at least 6 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const signupMutation = useMutation<{ ok: boolean }, Error, SignUpValues>({
    mutationFn: async (values: SignUpValues) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          userType: "customer",
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data?.error ?? "Registration failed");
      return { ok: true };
    },
    onSuccess: async (_data, variables) => {
      // Auto sign-in with the provided credentials using Auth.js v5 client API
      await signIn("credentials", {
        redirect: true,
        username: variables.username,
        password: variables.password,
        callbackUrl: onSuccessRedirect,
      });
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      await signIn("google", { callbackUrl: onSuccessRedirect });
    },
  });

  const isLoading = signupMutation.isPending || googleMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Create Account</h2>
        <p className="text-muted-foreground text-sm">
          Sign up for a new account to get started
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            signupMutation.mutate(values),
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
                    autoComplete="new-password"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {signupMutation.isError && (
            <div className="text-center text-sm text-red-500">
              {signupMutation.error?.message || "Registration failed"}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {signupMutation.isPending
              ? "Creating account..."
              : "Create Account"}
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
        <span className="text-gray-600">Already have an account? </span>
        {onToggleSignIn ? (
          <button
            type="button"
            onClick={onToggleSignIn}
            className="text-blue-600 hover:text-blue-500"
          >
            Sign in
          </button>
        ) : (
          <a href="/auth/signin" className="text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        )}
      </div>
    </div>
  );
}
