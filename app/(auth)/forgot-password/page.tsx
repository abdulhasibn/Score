import { ForgotPasswordForm } from "@/src/auth/ui/ForgotPasswordForm";

/**
 * Forgot Password Page
 *
 * Thin page wrapper that delegates all form logic to ForgotPasswordForm.
 * Server component - handles layout only, no business logic.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}
