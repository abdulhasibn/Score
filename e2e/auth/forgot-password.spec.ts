import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { waitForResetEmail, clearMailbox } from "../utils/inbucket";

/**
 * Forgot Password E2E Test
 *
 * Tests the password reset request flow.
 *
 * Security Note:
 * - The form always shows success message to prevent email enumeration
 * - This test validates the UI behavior, not actual email delivery
 *
 * Prerequisites (for full flow test):
 * - Supabase Local must be running (npm run supabase:start)
 * - Inbucket must be available at http://localhost:54324
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.e2e
 */

/**
 * Helper: Generate unique test email
 */
function generateTestEmail(): string {
  const timestamp = Date.now();
  return `forgot-test-${timestamp}@example.com`;
}

/**
 * Helper: Create test user via Admin API
 */
async function createTestUser(email: string, password: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set"
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

test.describe("Forgot Password", () => {
  test("should show success message after requesting reset link", async ({
    page,
  }) => {
    // Arrange - Use a test email
    const email = "test@example.com";

    // Act - Navigate to forgot password page
    await page.goto("/forgot-password");

    // Assert - Page loaded and form is visible
    await expect(page).toHaveURL("/forgot-password");
    await expect(
      page.getByRole("button", { name: "Send Reset Link" })
    ).toBeVisible({ timeout: 3000 });

    // Act - Fill and submit form
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    // Assert - Success toast appears (generic message for security)
    await expect(
      page.getByText("Reset link sent if account exists")
    ).toBeVisible({ timeout: 3000 });
  });

  test("should validate email format", async ({ page }) => {
    // Act - Navigate to forgot password page
    await page.goto("/forgot-password");

    // Act - Submit invalid email
    await page.getByLabel("Email").fill("invalid-email");
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    // Assert - Validation error appears
    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible({ timeout: 3000 });
  });

  test("should have link to sign in page", async ({ page }) => {
    // Act - Navigate to forgot password page
    await page.goto("/forgot-password");

    // Assert - Sign in link is present
    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/login");
  });

  test("should send reset email with valid link (Mailpit)", async ({
    page,
  }) => {
    // Skip if not running against local Supabase + Inbucket
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip();
      return;
    }

    // Arrange - Create test user
    const email = generateTestEmail();
    const password = "TestPassword123!";
    await createTestUser(email, password);

    // Clear mailbox before test
    await clearMailbox(email);

    // Act - Navigate to forgot password and submit
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    // Assert - Success toast appears
    await expect(
      page.getByText("Reset link sent if account exists")
    ).toBeVisible({ timeout: 3000 });

    // Assert - Email arrives in Inbucket with reset link
    const resetLink = await waitForResetEmail(email, 15000);

    // Verify reset link contains expected parameters
    expect(resetLink).toContain("type=recovery");
    // Supabase local emits a verify URL which then redirects to the app reset page
    expect(resetLink).toContain("token=");
  });
});
