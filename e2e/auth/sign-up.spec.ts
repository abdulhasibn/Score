import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Sign-Up E2E Tests
 *
 * Tests both unconfirmed and auto-confirmed signup flows.
 *
 * Prerequisites:
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.e2e for Option B test
 * - E2E Supabase project must allow signups
 */

/**
 * Helper: Generate unique test email
 */
function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test-${timestamp}@example.com`;
}

/**
 * Helper: Auto-confirm user via Supabase Admin API
 */
async function confirmUserEmail(email: string): Promise<void> {
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

  // Get user by email
  const { data: users, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const user = users.users.find((u) => u.email === email);

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  // Update user to mark email as confirmed
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    throw new Error(`Failed to confirm user: ${updateError.message}`);
  }
}

test.describe("Sign Up - Option A: Unconfirmed User Flow", () => {
  test("should show confirmation toast and prevent sign-in until email confirmed", async ({
    page,
  }) => {
    // Arrange - Generate unique credentials
    const email = generateTestEmail();
    const password = "TestPassword123!";

    // Act - Navigate to signup page
    await page.goto("/signup");

    // Wait for page to load
    await expect(page).toHaveURL("/signup");

    // Assert - Signup form is visible
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible({
      timeout: 10000,
    });

    // Fill signup form
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);

    // Submit form
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Assert - Success toast appears (toasts auto-dismiss after 4s, so check quickly)
    await expect(
      page.getByText(
        "Account created. Please check your email to confirm your registration."
      )
    ).toBeVisible({ timeout: 3000 });

    // Act - Attempt to sign in with unconfirmed account
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Assert - Error toast appears (toasts auto-dismiss after 4s, so check quickly)
    await expect(
      page.getByText("Sign in failed: Email not confirmed")
    ).toBeVisible({ timeout: 3000 });

    // Assert - Still on login page (not authenticated)
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Sign Up - Option B: Auto-Confirmed User Flow", () => {
  test("should allow sign-in after auto-confirmation via admin API", async ({
    page,
  }) => {
    // Skip test if service role key is not set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip();
      return;
    }

    // Arrange - Generate unique credentials
    const email = generateTestEmail();
    const password = "TestPassword123!";

    // Act - Navigate to signup page
    await page.goto("/signup");

    // Wait for page to load
    await expect(page).toHaveURL("/signup");
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible({
      timeout: 10000,
    });

    // Fill signup form
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);

    // Submit form
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Wait for signup to complete (toasts auto-dismiss after 4s, so check quickly)
    await expect(
      page.getByText(
        "Account created. Please check your email to confirm your registration."
      )
    ).toBeVisible({ timeout: 3000 });

    // Act - Auto-confirm user via Admin API
    await confirmUserEmail(email);

    // Wait a moment for the confirmation to propagate
    await page.waitForTimeout(2000);

    // Act - Sign in with confirmed account
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Assert - Successfully signed in and redirected to home page
    await expect(page).toHaveURL("/", { timeout: 10000 });

    // Assert - Authenticated state visible
    await expect(page.getByRole("heading", { name: "Score" })).toBeVisible();
    await expect(page.getByText(`Signed in as: ${email}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  });
});
