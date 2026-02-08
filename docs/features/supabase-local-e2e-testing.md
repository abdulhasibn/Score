# Supabase Local + Mailpit E2E Testing

## Purpose

Enable full end-to-end testing of authentication flows, including email-based password reset, using local Supabase services with Mailpit email capture. This eliminates the need for external email providers or hosted Supabase during testing.

## User Flow

### Quick Start: Full Reset & Test

For a complete environment reset and test run:

1. Run the all-in-one script:
   ```bash
   npm run setup:test
   ```

This script:
- Stops Supabase Local and Colima
- Starts everything from scratch
- Verifies all endpoints are healthy
- Starts Next.js dev server with E2E config
- Runs UI tests (parallel, non-blocking)
- Runs E2E tests
- Stops all processes and prints summary

### Developer Local Testing (Manual Steps)

1. Developer installs Supabase CLI
2. Runs `npm run supabase:start` to spin up local services
3. Starts app with `npm run dev:e2e` (separate terminal)
4. Runs E2E tests with `npm run test:e2e`
   - Global setup automatically creates test user
   - All tests run against local Supabase
5. Views captured emails at http://localhost:54324 if needed

## Key Decisions

### Why Supabase Local?

- **No external dependencies**: Tests don't rely on hosted Supabase or email providers
- **Speed**: Local services start in ~30s
- **Cost**: Free, no API limits
- **Reliability**: No network issues or rate limiting
- **Extensible**: Easy to integrate with CI/CD in the future

### Why Mailpit?

- **Built-in**: Comes with Supabase Local
- **HTTP API**: Easy to query for emails in tests
- **Web UI**: Developers can inspect emails at http://localhost:54324
- **No config**: Works out of the box

### Email Testing Strategy

Before: Tests skipped the full password reset flow because:

- Hosted Supabase requires real emails
- Admin API `generateLink()` doesn't reliably establish recovery sessions in E2E

After: Tests complete the full flow:

1. Create user via Admin API
2. Request password reset via UI
3. Fetch email from Mailpit API
4. Extract reset link
5. Navigate to link in Playwright
6. Complete password reset
7. Verify sign-in with new password

## Implementation

### File Structure

```
supabase/
  config.toml                       # Local Supabase config (email confirmations enabled)
  README.md                         # Setup guide
e2e/
  global-setup.ts                   # Creates test user before all tests
  utils/inbucket.ts                 # Email fetching helpers
  auth/forgot-password.spec.ts      # Password reset request + email validation
  auth/reset-password.spec.ts       # Full reset flow via email link
  README.md                         # E2E testing guide
.env.e2e                            # E2E config (local Supabase by default)
playwright.config.ts                # Added globalSetup
package.json                        # Added supabase:* scripts
```

### New npm Scripts

- `supabase:start` - Start local Supabase services
- `supabase:stop` - Stop services
- `supabase:status` - Show connection details
- `supabase:reset` - Reset database to clean state

### Global Test Setup

A global setup script (`e2e/global-setup.ts`) runs once before all tests to:

- Create the default test user (from `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD`)
- Auto-confirm the user for immediate sign-in capability
- Ensure consistent test environment across all test runs

### Mailpit Helper API

```typescript
// Wait for email and extract reset link (high-level)
const resetLink = await waitForResetEmail(email, 15000);

// Low-level API
const messageId = await waitForEmail(email, 10000);
const emailBody = await getEmailContent(email, messageId);
const resetLink = extractResetLink(emailBody);
await clearMailbox(email); // Cleanup
```

### E2E Test Updates

#### forgot-password.spec.ts

- Added full flow test that:
  - Creates user via Admin API
  - Submits forgot password form
  - Waits for email in Mailpit
  - Validates reset link format
- Skips if `SUPABASE_SERVICE_ROLE_KEY` not set (hosted environment)

#### reset-password.spec.ts

- Replaced admin-generated links with real email flow
- Tests now:
  1. Request reset via UI
  2. Fetch email from Mailpit
  3. Navigate to reset link
  4. Complete password change
  5. Sign in with new password
- All validation tests (password match, length) use same flow
- Removed workarounds for hash parameter processing

## Known Limitations

### Local-Only Testing

- E2E tests are designed to run against local Supabase only
- Hosted Supabase configuration is archived in `.env.e2e` (commented out)
- All email flows require Mailpit (only available locally)

### Test Data

- Global setup creates one default test user for sign-in/sign-out tests
- Other tests create temporary users dynamically (safe, isolated)
- Database starts fresh on each `supabase start`
- Database can be reset with `npm run supabase:reset`

### Email Timing

- `waitForResetEmail` polls Mailpit every 500ms
- Default timeout: 15 seconds (configurable)
- Adjust if Supabase Auth is slow to send emails

## Testing Best Practices

1. **Always use unique emails**: Use `generateTestEmail()` with timestamps for tests that create users
2. **Clear mailbox before tests**: Call `clearMailbox(email)` to prevent interference
3. **Proper waits**: Prefer `expect().toBeVisible()` over `waitForTimeout`
4. **Toast timing**: Sonner toasts dismiss after 4s, assert within 3s
5. **Email confirmations**: Enabled by default, all signup emails go to Mailpit
6. **Test isolation**: Each test should be independent and not rely on data from other tests

## Configuration Changes

1. `supabase/config.toml` - Email confirmations enabled, Mailpit on port 54324
2. `.env.e2e` - Configured for local Supabase by default
3. `e2e/global-setup.ts` - Automatic test user creation
4. `playwright.config.ts` - Global setup integration

## Documentation Created

1. `supabase/README.md` - Supabase Local setup guide
2. `e2e/README.md` - E2E testing comprehensive guide
3. This document - Feature documentation

## Maintenance Notes

### Updating Supabase CLI

```bash
brew upgrade supabase
```

### Database Migrations

- Migrations go in `supabase/migrations/`
- Apply with `supabase db reset`

### Mailpit Configuration

- Port: 54324 (web UI)
- SMTP: 54325 (if exposed)
- POP3: 54326 (if exposed)
- Configured in `supabase/config.toml`

## Troubleshooting

### Tests fail with connection errors

- Check Supabase is running: `npm run supabase:status`
- Verify `.env.e2e` has localhost URLs
- Ensure Docker Desktop is running

### Emails not captured

- Verify Mailpit at http://localhost:54324
- Check `[inbucket]` enabled in config.toml
- Increase `waitForResetEmail` timeout

### Port conflicts

- Ports 54321-54326 must be available
- Stop Supabase: `npm run supabase:stop`
- Check no other services using these ports

## Performance

### Local Test Execution

- Supabase start: ~30s (first time), ~5s (subsequent)
- Full E2E test suite: ~45-60s
- Individual test: ~5-10s

## Future Enhancements

### CI/CD Integration (When Needed)

The setup is designed to be CI-friendly and can be extended with:

- Supabase CLI installation via GitHub Actions
- Dynamic credential extraction from `supabase status --output json`
- Automated `.env.e2e` generation
- Test user creation via Admin API
- Artifact uploads for test reports

### Other Potential Improvements

- [ ] Add email template validation tests
- [ ] Test email deliverability (SMTP)
- [ ] Parallel test execution with isolated databases
- [ ] Snapshot testing for email content
- [ ] Custom Mailpit filters for specific test scenarios

### Not Planned

- External email provider testing (out of scope)
- Hosted Supabase E2E (use staging environment instead)
- Email click tracking (not needed for auth flows)
