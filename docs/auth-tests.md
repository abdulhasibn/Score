# Authentication Tests

## Test Strategy Overview

The authentication system uses unit, component, and application-layer tests to validate UI behavior, control flow, and cross-layer error contracts. Supabase is mocked at the boundary, ensuring tests are fast, deterministic, and isolated from external dependencies.

### Why Unit + Component + Application Tests

- **Speed**: Tests run in milliseconds without network calls
- **Determinism**: No flaky tests from network timeouts or Supabase availability
- **Isolation**: Each test is independent and side-effect free
- **Focus**: Tests validate application logic, not Supabase internals

### Why Supabase is Mocked

- Supabase is an external dependency with its own test coverage
- Testing Supabase internals would be integration testing, not unit testing
- Mocking allows testing error scenarios that are difficult to reproduce with real Supabase
- Tests validate that the application correctly handles Supabase responses

### E2E Coverage Note

- E2E auth flows are covered in `e2e/auth/`
- This document focuses on Vitest-based suites (unit/component/application/infrastructure)
- End-to-end setup details are documented in `e2e/README.md`

## Tooling

### Test Runner

- **Vitest**: Fast Vite-based test runner
- **Environment**: jsdom (DOM simulation for React components)
- **Globals**: Enabled for cleaner test syntax

### Testing Libraries

- **@testing-library/react**: Component rendering and queries
- **@testing-library/user-event**: Realistic user interaction simulation
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

### Mocking Approach

- **vi.mock**: Vitest's module mocking system
- Mocks are defined before imports to ensure proper hoisting
- Mocks are reset between tests using `beforeEach` and `vi.clearAllMocks()`

### Test Structure

- UI/component tests: `src/auth/ui/__tests__/`
- Application-layer tests: `src/auth/application/__tests__/`
- Infrastructure contract tests: `src/auth/infrastructure/__tests__/`
- Tests use descriptive `describe` and `it` blocks
- Helper functions (`getValidFormData`, `fillForm`) reduce duplication

## Sign-Up Tests

### Test Cases

**New user - confirmation required**
- **Flow**: `signUp` succeeds
- **Expected**: Success toast shown, `signIn` not called, no redirect
- **Status**: Written and validated

**Existing confirmed user**
- **Flow**: `signUp` throws `user_already_exists`, `signIn` succeeds
- **Expected**: Info toast shown, redirect to `/`
- **Status**: Written and validated

**Existing unconfirmed user**
- **Flow**: `signUp` throws `user_already_exists`, `signIn` throws `email_not_confirmed`
- **Expected**: Error toast shown, redirect to `/login`
- **Status**: Written and validated

**Existing user - wrong password**
- **Flow**: `signUp` throws `user_already_exists`, `signIn` throws `invalid_login_credentials`
- **Expected**: Incorrect password toast shown, redirect to `/login`
- **Status**: Written and validated

**Validation failure - invalid email**
- **Flow**: Form submitted with invalid email format
- **Expected**: `signUp` and `signIn` not called, error toast shown
- **Status**: Written and validated

**Validation failure - passwords do not match**
- **Flow**: Form submitted with mismatched passwords
- **Expected**: `signUp` and `signIn` not called, error toast shown
- **Status**: Written and validated

**Validation failure - weak password**
- **Flow**: Form submitted with password that doesn't meet requirements
- **Expected**: `signUp` and `signIn` not called, error toast shown
- **Status**: Written and validated

**signUp failure**
- **Flow**: `signUp` throws error
- **Expected**: Error toast shown, `signIn` not called, no redirect
- **Status**: Written and validated

### Mocking

- `useAuth`: Only `signUp` and `signIn` methods mocked
- `useRouter`: Only `replace` method mocked
- `sonner`: `toast.success`, `toast.error`, `toast.info` mocked

### Assertions

- Intent-based toast assertions using regex patterns (not exact strings)
- Function call verification (`toHaveBeenCalledWith`, `not.toHaveBeenCalled`)
- Redirect verification (`toHaveBeenCalledWith("/")`, `not.toHaveBeenCalled`)

## Sign-In Tests

### Test Cases

**Successful sign-in**
- **Flow**: `signIn` resolves with user and session
- **Expected**: Success toast shown, redirect to `/`
- **Status**: Written and validated

**Invalid credentials**
- **Flow**: `signIn` throws with `code: "invalid_login_credentials"`
- **Expected**: Error toast shown, no redirect
- **Status**: Written and validated

**Email not confirmed**
- **Flow**: `signIn` throws with `code: "email_not_confirmed"`
- **Expected**: Error toast shown, no redirect
- **Status**: Written and validated

**Unexpected error**
- **Flow**: `signIn` throws generic error
- **Expected**: Error toast shown, no redirect
- **Status**: Written and validated

**Validation failure - invalid email**
- **Flow**: Form submitted with invalid email format
- **Expected**: `signIn` not called
- **Status**: Written and validated

**Validation failure - empty password**
- **Flow**: Form submitted with empty password
- **Expected**: `signIn` not called
- **Status**: Written and validated

### Mocking

- `useAuth`: Only `signIn` method mocked
- `useRouter`: Only `replace` method mocked
- `sonner`: `toast.success`, `toast.error` mocked

### Assertions

- Intent-based toast assertions using regex patterns
- Function call verification
- Redirect verification

## Forgot Password Tests

### Test Cases

**Valid email - success**
- **Flow**: `requestPasswordReset` resolves
- **Expected**: Success toast shown
- **Status**: Written and validated

**Valid email - requestPasswordReset throws**
- **Flow**: `requestPasswordReset` throws error
- **Expected**: Success toast still shown (enumeration protection)
- **Status**: Written and validated

**Invalid email**
- **Flow**: Form submitted with invalid email format
- **Expected**: `requestPasswordReset` not called
- **Status**: Written and validated

**Empty email**
- **Flow**: Form submitted with empty email
- **Expected**: `requestPasswordReset` not called
- **Status**: Written and validated

### Mocking

- `useAuth`: Only `requestPasswordReset` method mocked
- `sonner`: `toast.success`, `toast.error` mocked
- No router mocking (forgot password doesn't redirect)

### Security Validation

- Tests verify that success toast is shown even when `requestPasswordReset` throws
- This validates email enumeration protection behavior

## Reset Password Tests

### Test Cases

**Successful reset**
- **Flow**: `updatePassword` resolves
- **Expected**: Success toast shown, redirect to `/login` after 2 second delay
- **Status**: Written and validated

**Weak password - too short**
- **Flow**: Form submitted with password less than 8 characters
- **Expected**: `updatePassword` not called
- **Status**: Written and validated

**Weak password - passwords do not match**
- **Flow**: Form submitted with mismatched passwords
- **Expected**: `updatePassword` not called
- **Status**: Written and validated

**updatePassword failure**
- **Flow**: `updatePassword` throws error
- **Expected**: Error toast shown, no redirect
- **Status**: Written and validated

### Mocking

- `useAuth`: Only `updatePassword` method mocked
- `useRouter`: Only `replace` method mocked
- `sonner`: `toast.success`, `toast.error` mocked

### Timing

- Tests wait for redirect with 3 second timeout to account for 2 second delay
- Real timers used (not fake timers) for compatibility with user-event

## AuthService Tests

### Scope

Service-level contract tests validate `AuthService` behavior at the `AuthRepository` boundary.

### Test Cases

**Successful sign-in pass-through**
- **Flow**: Repository `signIn` resolves with `{ user, session }`
- **Expected**: Service returns repository payload unchanged
- **Status**: Written and validated

**Message wrapping**
- **Flow**: Repository `signIn` throws uncoded error
- **Expected**: Service throws with `Sign in failed: ...` message prefix
- **Status**: Written and validated

**Error code propagation**
- **Flow**: Repository `signIn` throws coded errors (`email_not_confirmed`, `invalid_login_credentials`)
- **Expected**: Service preserves `error.code` while wrapping message
- **Status**: Written and validated

**Safe wrapping without code**
- **Flow**: Repository `signIn` throws error without `code`
- **Expected**: Service throws wrapped error and `error.code` remains undefined
- **Status**: Written and validated

**signUp success pass-through**
- **Flow**: Repository `signUp` resolves with `{ user }`
- **Expected**: Service returns repository payload unchanged
- **Status**: Written and validated

**signUp coded-error pass-through**
- **Flow**: Repository `signUp` throws coded error (`user_already_exists`)
- **Expected**: Service preserves `error.code` and message
- **Status**: Written and validated

### Mocking

- `AuthRepository`: mocked at interface boundary
- No `useAuth` or UI mocking in service tests

## SupabaseAuthRepository Tests

### Scope

Infrastructure contract tests validate Supabase-specific sign-up normalization in `SupabaseAuthRepository`.

### Test Cases

**First-time signup mapping**
- **Flow**: Supabase `signUp` returns user with non-empty `identities`
- **Expected**: Repository returns mapped domain user
- **Status**: Written and validated

**Obfuscated existing-user response**
- **Flow**: Supabase `signUp` returns success with `user.identities = []`
- **Expected**: Repository throws coded error `user_already_exists`
- **Status**: Written and validated

**Explicit duplicate error**
- **Flow**: Supabase `signUp` returns duplicate-email error
- **Expected**: Repository throws coded error `user_already_exists`
- **Status**: Written and validated

**Duplicate message fallback**
- **Flow**: Supabase `signUp` duplicate message without explicit code
- **Expected**: Repository normalizes to coded error `user_already_exists`
- **Status**: Written and validated

## What Is NOT Tested (By Design)

### Supabase Internal Behavior

- Supabase SDK internals are not tested
- Supabase error message formats are not tested
- Supabase session management is not tested
- These are Supabase's responsibility

### Network Calls

- No actual HTTP requests are made
- No Supabase API calls are executed
- Network errors are not tested (handled by Supabase)

### OAuth Providers

- OAuth flows are not implemented or tested
- Social login is not supported

### E2E Flows

- End-to-end user journeys are not covered in this Vitest suite
- Email delivery is not covered in this Vitest suite
- Token validation in reset links is not covered in this Vitest suite
- These are covered by Playwright tests in `e2e/auth/`

### Integration Boundaries

- UI/component tests mock at the `useAuth` hook boundary
- Application tests mock at the `AuthRepository` boundary
- `AuthService.signIn` wrapping and `error.code` propagation are directly tested
- `SupabaseAuthRepository.signUp` normalization (`identities` + duplicate codes) is directly tested with mocked Supabase responses

## Guarantees Provided by Tests

### Regression Prevention

Tests prevent regressions in:

- Control flow logic (first-time signup vs existing-email auto sign-in)
- Error handling (code extraction, error normalization)
- Security behavior (email enumeration protection)
- Validation rules (password strength, email format)
- User feedback (toast messages, redirects)

### Confidence Level

The test suite provides high confidence that:

- All documented flows work as specified
- Error scenarios are handled correctly
- Security measures are enforced
- User experience is consistent
- Validation rules are applied

### Coverage Scope

- **UI behavior**: Fully covered
- **Control flow**: Fully covered
- **Application contract**: `AuthService.signIn` and `AuthService.signUp` contract behavior covered
- **Error handling**: Fully covered
- **Validation**: Fully covered
- **Security rules**: Fully covered

The test suite does not cover:
- Supabase network behavior (real provider responses)
- Network-level behavior
- End-to-end user journeys
- Email delivery

These are either outside the application's responsibility or require different testing approaches.
