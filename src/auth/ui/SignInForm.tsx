"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * SignInForm
 *
 * Reusable form component for user authentication.
 * Handles all form logic, state, submission, and navigation.
 *
 * Design System Compliance:
 * - Uses Button primitive with variant="primary" and layout="block"
 * - Follows spacing rules: space-y-4 for fields, mb-2 for label spacing
 * - No arbitrary className overrides for spacing, width, or color
 */

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      await signIn(data.email, data.password);
      toast.success("Signed in successfully");
      router.replace("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-[hsl(var(--destructive))]">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password" className="mb-2">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                disabled={isLoading}
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
                className="pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] rounded px-1 py-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-[hsl(var(--destructive))]">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            layout="block"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          <Link
            href="/forgot-password"
            className="text-[hsl(var(--primary))] hover:underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[hsl(var(--primary))] hover:underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
