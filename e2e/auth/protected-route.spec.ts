import { test, expect } from '@playwright/test';

/**
 * Protected Route Enforcement Test
 * 
 * Proves: Unauthenticated users are redirected to login when accessing protected routes.
 * Validates: Route protection middleware and redirect behavior.
 */
test.describe('Protected Route Enforcement', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Arrange - Start with no session (fresh browser context)

    // Act - Navigate to protected route
    await page.goto('/');

    // Assert - Redirected to login page
    await expect(page).toHaveURL('/login');

    // Assert - Login form is visible (assert on inputs to avoid strict-mode ambiguity)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });
});
