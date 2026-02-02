import { test, expect } from '@playwright/test';

/**
 * Sign-Out Test
 * 
 * Proves: Authenticated users can sign out and are redirected to login.
 * Validates: Session termination and post-logout redirect behavior.
 */
test.describe('Sign Out', () => {
  test('should sign out successfully and redirect to login', async ({ page }) => {
    // Arrange
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    // Sign in first
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Act - Sign out
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Assert - Redirected to login page
    await expect(page).toHaveURL('/login');

    // Assert - Login form is visible
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Assert - Session is terminated (cannot access protected route)
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});
