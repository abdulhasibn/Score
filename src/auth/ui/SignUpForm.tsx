"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type FieldErrors } from "react-hook-form";
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
 * SignUpForm
 *
 * Reusable form component for user registration.
 * Handles all form logic, state, submission, and navigation.
 *
 * Design System Compliance:
 * - Uses Button primitive with variant="primary" and layout="block"
 * - Follows spacing rules: space-y-4 for fields, mb-2 for label spacing
 * - No arbitrary className overrides for spacing, width, or color
 */

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must include at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";
  const passwordsMatch =
    passwordValue &&
    confirmPasswordValue &&
    passwordValue === confirmPasswordValue;

  const calculatePasswordStrength = (
    password: string
  ): {
    score: number;
    level: "very-weak" | "weak" | "good" | "strong";
    label: string;
  } => {
    if (!password) {
      return { score: 0, level: "very-weak", label: "Very Weak" };
    }

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    const score =
      (hasMinLength ? 1 : 0) +
      (hasUppercase ? 1 : 0) +
      (hasLowercase ? 1 : 0) +
      (hasNumber ? 1 : 0) +
      (hasSpecialChar ? 1 : 0);

    if (score <= 1) {
      return { score, level: "very-weak", label: "Very Weak" };
    } else if (score === 2) {
      return { score, level: "weak", label: "Weak" };
    } else if (score === 3 || score === 4) {
      return { score, level: "good", label: "Good" };
    } else {
      return { score, level: "strong", label: "Strong" };
    }
  };

  const strength = calculatePasswordStrength(passwordValue);
  const activeBars =
    strength.level === "very-weak"
      ? 1
      : strength.level === "weak"
        ? 2
        : strength.level === "good"
          ? 3
          : 4;

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);

    try {
      // Step 1: Always call signUp first
      await signUp(data.email, data.password);
    } catch (signUpErr) {
      // If signUp throws, check error code for specific handling
      const error = signUpErr as Error & { code?: string };
      const errorCode = error.code;

      if (errorCode === "user_already_exists") {
        // User already exists - attempt to sign them in instead
        toast.info("User exists, signing you in…");

        try {
          await signIn(data.email, data.password);
          // Sign in succeeded - redirect to home
          toast.success("Signed in successfully");
          router.replace("/");
        } catch (signInErr) {
          // Sign in failed - handle based on error code
          const signInError = signInErr as Error & { code?: string };
          const signInErrorCode = signInError.code;

          if (signInErrorCode === "invalid_login_credentials") {
            toast.error("Incorrect password. Please try again.");
            router.replace("/login");
          } else if (signInErrorCode === "email_not_confirmed") {
            toast.error("Please confirm your email before signing in.");
            router.replace("/login");
          } else {
            toast.error("Unable to sign in. Please try again.");
            router.replace("/login");
          }
        } finally {
          setIsLoading(false);
        }
        return;
      } else {
        toast.error("Unable to create account. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    // Step 2: New user created successfully - ask for email confirmation
    toast.success(
      "Account created. Please check your email to confirm your registration."
    );
    setIsLoading(false);
  };

  const onError = (errors: FieldErrors<SignUpFormData>) => {
    // Extract first validation error and show as toast
    const firstError =
      errors.email || errors.password || errors.confirmPassword;

    if (firstError?.message) {
      toast.error(firstError.message);
    } else if (errors.root?.message) {
      toast.error(errors.root.message);
    } else {
      toast.error("Please check your input and try again.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>
          Create a new account with your email and password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleFormSubmit(onSubmit, onError)}
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
                autoComplete="new-password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby="password-rules"
                className="pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
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
            <p
              id="password-rules"
              className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]"
            >
              Must be at least 8 characters with uppercase, lowercase, number,
              and special character.
            </p>
            {passwordValue && (
              <div className="mt-2">
                <div className="mb-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`h-1 flex-1 rounded ${
                        bar <= activeBars
                          ? strength.level === "very-weak" ||
                            strength.level === "weak"
                            ? "bg-[hsl(var(--destructive))]/75"
                            : strength.level === "good"
                              ? "bg-[hsl(var(--warning))]/75"
                              : "bg-[hsl(var(--success))]/75"
                          : "bg-[hsl(var(--border))]"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-sm ${
                    strength.level === "very-weak" || strength.level === "weak"
                      ? "text-[hsl(var(--destructive))]"
                      : strength.level === "good"
                        ? "text-[hsl(var(--warning))]"
                        : "text-[hsl(var(--success))]"
                  }`}
                  aria-live="polite"
                >
                  Password strength: {strength.label}
                </p>
              </div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
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
            {passwordsMatch && !errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-[hsl(var(--success))]">
                Passwords match
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            layout="block"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Already have an account?{" "}
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
