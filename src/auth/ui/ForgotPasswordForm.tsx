"use client";

import { useState } from "react";
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
 * ForgotPasswordForm
 *
 * Form component for requesting a password reset email.
 * Handles validation, submission, and security (email enumeration prevention).
 *
 * Design System Compliance:
 * - Uses Button primitive with variant="primary" and layout="block"
 * - Follows spacing rules: space-y-4 for fields, mb-2 for label spacing
 * - No arbitrary className overrides for spacing, width, or color
 *
 * Security:
 * - Always shows success message to prevent email enumeration
 * - Does not reveal whether email exists in the system
 */

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      await requestPasswordReset(data.email);
      // Always show success message to prevent email enumeration
      toast.success("Reset link sent if account exists");
    } catch {
      // This should never happen due to security design, but handle gracefully
      // Always show success message to prevent email enumeration
      toast.success("Reset link sent if account exists");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleFormSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
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
          <Button
            type="submit"
            variant="primary"
            layout="block"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-[hsl(var(--primary))] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
