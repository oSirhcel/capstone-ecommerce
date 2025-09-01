"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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

export default function SignInPage() {
  const searchParams = useSearchParams();

  const successMessage = searchParams.get("message");

  const SignInSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  type SignInValues = z.infer<typeof SignInSchema>;

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
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
        window.location.href = "/";
      },
    },
  );

  const googleMutation = useMutation({
    mutationFn: async () => {
      // This will redirect on success
      await signIn("google", { callbackUrl: "/" });
    },
  });

  const isLoading = credentialsMutation.isPending || googleMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Back Button */}
          <div className="absolute top-4 left-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Welcome back! Please sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username and Password Form */}
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth */}
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
            <Link
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
