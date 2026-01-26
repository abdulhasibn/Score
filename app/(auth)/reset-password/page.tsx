import { ResetPasswordForm } from "@/src/auth/ui/ResetPasswordForm";

/**
 * Reset Password Page
 *
 * Thin page wrapper that delegates all form logic to ResetPasswordForm.
 * Server component - handles layout only, no business logic.
 *
 * Note:
 * - This page is accessed via Supabase reset link with token in URL hash
 * - Supabase automatically handles token validation when updatePassword is called
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm />
    </div>
  );
}
