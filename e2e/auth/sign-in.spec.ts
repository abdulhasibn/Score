import { test, expect } from "@playwright/test";

/**
 * Sign-In Happy Path Test
 *
 * Proves: Authenticated users can sign in and are redirected to the home page.
 * Validates: Form submission, authentication flow, session persistence, and navigation.
 */
test.describe("Sign In", () => {
  test("should sign in successfully and redirect to home page", async ({
    page,
  }) => {
    // Arrange
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    // Act
    await page.goto("/login");

    // Fill form using role + accessible name (avoids strict-mode ambiguity with password toggle)
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(password);

    // Submit form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Assert - URL redirects to home page
    await expect(page).toHaveURL("/");

    // Assert - Home page heading is visible (authenticated state)
    await expect(page.getByRole("heading", { name: "Score" })).toBeVisible();

    // Assert - User email is displayed (confirms session)
    await expect(page.getByText(`Signed in as: ${email}`)).toBeVisible();

    // Assert - Sign Out button is visible
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();

    // Assert - Session persists after page reload
    await page.reload();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Score" })).toBeVisible();
    await expect(page.getByText(`Signed in as: ${email}`)).toBeVisible();
  });
});
