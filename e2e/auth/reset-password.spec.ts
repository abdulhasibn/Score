import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { waitForResetEmail, clearMailbox } from "../utils/inbucket";

/**
 * Reset Password E2E Test
 *
 * Tests the password reset flow using Supabase Local + Inbucket.
 *
 * Prerequisites:
 * - Supabase Local must be running (npm run supabase:start)
 * - Inbucket must be available at http://localhost:54324
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.e2e
 */

/**
 * Helper: Generate unique test email
 */
function generateTestEmail(): string {
  const timestamp = Date.now();
  return `reset-test-${timestamp}@example.com`;
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

test.describe("Reset Password", () => {
  test("should complete full forgot-to-reset flow via Inbucket", async ({
    page,
  }) => {
    // Skip if not running against local Supabase + Inbucket
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip();
      return;
    }

    // Arrange - Create test user
    const email = generateTestEmail();
    const oldPassword = "OldPassword123!";
    const newPassword = "NewPassword456!";
    await createTestUser(email, oldPassword);

    // Clear mailbox before test
    await clearMailbox(email);

    // Act - Request password reset via UI
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    // Assert - Success toast appears
    await expect(
      page.getByText("Reset link sent if account exists")
    ).toBeVisible({ timeout: 3000 });

    // Act - Wait for reset email and extract link
    const resetLink = await waitForResetEmail(email, 15000);

    // Navigate to reset link
    await page.goto(resetLink);

    // Wait for page to process recovery token and form to appear
    await page.waitForTimeout(2000);
    await expect(
      page.getByRole("button", { name: "Update Password" })
    ).toBeVisible({ timeout: 5000 });

    // Fill reset password form
    await page.getByLabel("New Password").fill(newPassword);
    await page.getByLabel("Confirm Password").fill(newPassword);

    // Submit form
    await page.getByRole("button", { name: "Update Password" }).click();

    // Assert - Success toast appears
    await expect(
      page.getByText("Password updated. Sign in to continue")
    ).toBeVisible({ timeout: 3000 });

    // Wait for redirect to login page
    await expect(page).toHaveURL("/login", { timeout: 5000 });

    // Act - Sign in with NEW password
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(newPassword);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Assert - Successfully signed in and redirected to home
    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Score" })).toBeVisible();
    await expect(page.getByText(`Signed in as: ${email}`)).toBeVisible();
  });

  test("should validate password match via Inbucket flow", async ({ page }) => {
    // Skip if not running against local Supabase
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip();
      return;
    }

    // Arrange - Create test user and request reset
    const email = generateTestEmail();
    const password = "OldPassword123!";
    await createTestUser(email, password);
    await clearMailbox(email);

    // Request password reset
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    await expect(
      page.getByText("Reset link sent if account exists")
    ).toBeVisible({ timeout: 3000 });

    // Get reset link from email
    const resetLink = await waitForResetEmail(email, 15000);
    await page.goto(resetLink);
    await page.waitForTimeout(2000);

    // Fill with mismatched passwords
    await page.getByLabel("New Password").fill("NewPassword123!");
    await page.getByLabel("Confirm Password").fill("DifferentPassword123!");

    // Submit form
    await page.getByRole("button", { name: "Update Password" }).click();

    // Assert - Validation error appears
    await expect(page.getByText("Passwords do not match")).toBeVisible({
      timeout: 3000,
    });
  });

  test("should validate minimum password length via Inbucket flow", async ({
    page,
  }) => {
    // Skip if not running against local Supabase
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip();
      return;
    }

    // Arrange - Create test user and request reset
    const email = generateTestEmail();
    const password = "OldPassword123!";
    await createTestUser(email, password);
    await clearMailbox(email);

    // Request password reset
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    await expect(
      page.getByText("Reset link sent if account exists")
    ).toBeVisible({ timeout: 3000 });

    // Get reset link from email
    const resetLink = await waitForResetEmail(email, 15000);
    await page.goto(resetLink);
    await page.waitForTimeout(2000);

    // Fill with short password
    const shortPassword = "Short1!";
    await page.getByLabel("New Password").fill(shortPassword);
    await page.getByLabel("Confirm Password").fill(shortPassword);

    // Submit form
    await page.getByRole("button", { name: "Update Password" }).click();

    // Assert - Validation error appears (use .first() since it appears on both fields)
    await expect(
      page.getByText("Password must be at least 8 characters").first()
    ).toBeVisible({ timeout: 3000 });
  });

  test("should have link to sign in page", async ({ page }) => {
    // This test doesn't need Inbucket - just checks UI presence
    await page.goto("/reset-password");

    // Assert - Sign in link is present
    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/login");
  });
});
