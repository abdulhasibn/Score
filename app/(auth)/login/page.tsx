import { SignInForm } from "@/src/auth/ui/SignInForm";

/**
 * Login Page
 *
 * Thin page wrapper that delegates all form logic to SignInForm.
 * Server component - handles layout only, no business logic.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignInForm />
    </div>
  );
}
