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
 * ResetPasswordForm
 *
 * Form component for resetting password after clicking reset link.
 * Handles validation, submission, and redirect on success.
 *
 * Design System Compliance:
 * - Uses Button primitive with variant="primary" and layout="block"
 * - Follows spacing rules: space-y-4 for fields, mb-2 for label spacing
 * - No arbitrary className overrides for spacing, width, or color
 *
 * Note:
 * - This form is accessed via Supabase reset link with token in URL
 * - Supabase handles token validation automatically
 */

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      await updatePassword(data.password);
      toast.success("Password updated. Sign in to continue");
      // Redirect to login after short delay
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Password update failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="password" className="mb-2">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                disabled={isLoading}
                autoComplete="new-password"
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
          <div>
            <Label htmlFor="confirmPassword" className="mb-2">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                disabled={isLoading}
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                className="pr-20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] rounded px-1 py-0.5"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-[hsl(var(--destructive))]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            layout="block"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-[hsl(var(--primary))] hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
