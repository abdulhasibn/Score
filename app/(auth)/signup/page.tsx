import { SignUpForm } from "@/src/auth/ui/SignUpForm";

/**
 * Sign Up Page
 *
 * Thin page wrapper that delegates all form logic to SignUpForm.
 * Server component - handles layout only, no business logic.
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUpForm />
    </div>
  );
}
