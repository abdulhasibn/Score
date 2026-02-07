# E2E Testing with Supabase Local + Mailpit

This directory contains end-to-end tests for the Score application using Playwright.

## Overview

E2E tests run against **local Supabase** with Mailpit email testing to enable **full authentication flow testing**, including:

- Sign up with email confirmation
- Sign in and sign out
- Forgot password → email → reset password flow
- Protected route access control

**Important**: E2E tests require local Supabase to be running. They do not work with hosted Supabase.

## Prerequisites

### 1. Docker Desktop

Download and install: https://www.docker.com/products/docker-desktop

### 2. Supabase CLI

Install via Homebrew (macOS/Linux):

```bash
brew install supabase/tap/supabase
```

For other platforms, see: https://supabase.com/docs/guides/cli

### 3. Node.js Dependencies

```bash
npm install
```

## Quick Start

### First Time Setup

0. **Run the setup script** (recommended):

   ```bash
   npm run setup:local
   ```

   If you see unstyled pages in Playwright screenshots, ensure `.env.e2e` does **not** set `NODE_ENV`.

1. **Start Supabase Local** (downloads Docker images on first run):

   ```bash
   npm run supabase:start
   ```

   This will output connection details. Wait for all services to be healthy.

2. **Get Supabase credentials**:

   ```bash
   npm run supabase:status
   ```

   Copy the output values:
   - API URL (usually http://localhost:54321)
   - anon key
   - service_role key

3. **Update `.env.e2e`** to use local Supabase:

   Since you already have `.env.e2e` configured for hosted Supabase, you have two options:

   **Option A: Backup and switch**

   ```bash
   # Backup your hosted config
   cp .env.e2e .env.e2e.hosted

   # Update .env.e2e with local values from step 2
   ```

   **Option B: Dual config (recommended)**

   Keep both configurations in `.env.e2e` and comment out the one not in use:

   ```bash
   # Hosted Supabase E2E (default)
   # NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   # SUPABASE_SERVICE_ROLE_KEY=ey...

   # Local Supabase (for Mailpit email testing)
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-status>
   SUPABASE_SERVICE_ROLE_KEY=<from-supabase-status>
   INBUCKET_API_URL=http://localhost:54324/api/v1
   ```

4. **Create E2E test user**:

   ```bash
   # Use Supabase Studio at http://localhost:54323
   # Or run SQL in the DB:
   # INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, ...)
   ```

   Or use the Admin API (see example in sign-up.spec.ts).

### Running Tests

1. **Start Supabase** (if not already running):

   ```bash
   npm run supabase:start
   ```

2. **Start the app** in E2E mode (separate terminal):

   ```bash
   npm run dev:e2e
   ```

3. **Run E2E tests**:

   ```bash
   # Run all E2E tests
   npm run test:e2e

   # Run with UI mode
   npm run test:e2e:ui

   # Run specific test file
   npm run test:e2e -- e2e/auth/sign-in.spec.ts

   # Debug mode
   npm run test:e2e:debug
   ```

## Test Architecture

### Global Setup

- `global-setup.ts` - Runs once before all tests to create the default test user

### Test Files

- `auth/sign-up.spec.ts` - User registration flows
- `auth/sign-in.spec.ts` - Authentication (uses pre-created test user)
- `auth/sign-out.spec.ts` - Session termination (uses pre-created test user)
- `auth/forgot-password.spec.ts` - Password reset request + email validation
- `auth/reset-password.spec.ts` - Password reset completion via email link
- `auth/protected-route.spec.ts` - Route protection

### Utilities

- `utils/inbucket.ts` - Helpers to fetch and parse emails from Mailpit (file name kept for compatibility)

## Mailpit Email Testing

### What is Mailpit?

Mailpit is the local email testing server included with Supabase Local. It captures all emails sent by Supabase Auth.

### Viewing Emails

- Open http://localhost:54324 in your browser
- All test emails are listed by recipient
- Click to view email content, headers, attachments

### API Usage (in tests)

```typescript
import { waitForResetEmail, clearMailbox } from "../utils/inbucket";

// Clear mailbox before test
await clearMailbox("test@example.com");

// Trigger password reset in UI
await page.goto("/forgot-password");
await page.getByLabel("Email").fill("test@example.com");
await page.getByRole("button", { name: "Send Reset Link" }).click();

// Wait for email and extract reset link
const resetLink = await waitForResetEmail("test@example.com", 15000);

// Navigate to reset link
await page.goto(resetLink);
```

## Environment Variables

All required variables are pre-configured in `.env.e2e`:

- `NEXT_PUBLIC_SUPABASE_URL` - `http://localhost:54321` (local Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Default local anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Default local service role key
- `E2E_BASE_URL` - `http://localhost:3000`
- `INBUCKET_API_URL` - `http://localhost:54324/api/v1` (Mailpit API; env var name kept for compatibility)
- `E2E_TEST_EMAIL` - Test user email (created by global setup)
- `E2E_TEST_PASSWORD` - Test user password

## Troubleshooting

### Tests fail with "Auth session missing"

- Ensure Supabase Local is running
- Check `.env.e2e` has correct localhost URLs
- Verify recovery token processing (2s wait after clicking reset link)

### Mailpit emails not arriving

- Check http://localhost:54324 is accessible
- Verify email was triggered (check Supabase logs)
- Increase `waitForResetEmail` timeout if needed

### Port conflicts

- Check ports 54321-54326 are not in use
- Run `npm run supabase:stop` and restart

### Database state issues

- Reset database: `npm run supabase:reset`
- This clears all data and reapplies migrations

## Best Practices

1. **Unique test data** - Always use `generateTestEmail()` with timestamps
2. **Clear mailbox** - Call `clearMailbox()` before tests that check emails
3. **Proper waits** - Use `expect().toBeVisible()` instead of `waitForTimeout` where possible
4. **Toast timing** - Toasts auto-dismiss after 4s, assert within 3s
5. **Cleanup** - Tests should be independent and not rely on specific database state

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Mailpit Documentation](https://github.com/axllent/mailpit)
