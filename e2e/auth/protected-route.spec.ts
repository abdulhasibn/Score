import { test, expect } from "@playwright/test";

/**
 * Unauthenticated Home Page Test
 *
 * Proves: Unauthenticated users can access the home page and see a Sign In button.
 * Validates: Home page displays correctly for unauthenticated users with clear CTA.
 */
test.describe("Unauthenticated Home Page", () => {
  test("should show Sign In button for unauthenticated users", async ({
    page,
  }) => {
    // Arrange - Start with no session (fresh browser context)

    // Act - Navigate to home page
    await page.goto("/");

    // Assert - URL remains on home page (no redirect)
    await expect(page).toHaveURL("/");

    // Assert - Home page heading is visible
    await expect(page.getByRole("heading", { name: "Score" })).toBeVisible();

    // Assert - Sign In button is visible
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    // Assert - Clicking Sign In button navigates to login page
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL("/login");
  });
});
