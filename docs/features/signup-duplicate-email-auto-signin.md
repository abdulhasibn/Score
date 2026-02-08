# Feature: Signup Duplicate Email Auto Sign-In

**Created**: February 3, 2026  
**Status**: Implemented

---

## Purpose

Provides a seamless user experience when a user attempts to sign up with an email that already exists. Instead of showing an error, the system automatically attempts to sign them in, reducing friction and improving usability.

For first-time registrations, the flow is intentionally different: show account-created confirmation and wait for email verification without auto sign-in.

---

## User Flow

### Scenario 1: User signs up with existing email and correct password

1. User navigates to `/signup`
2. User fills in signup form with an email that already has an account
3. User enters the correct password for that account
4. User submits the form
5. **System Response**:
   - Shows info toast: "User exists, signing you in…"
   - Automatically attempts sign-in with provided credentials
   - On success: Shows "Signed in successfully" toast
   - Redirects to `/` (home page)
   - User is now authenticated

### Scenario 2: User signs up with existing email and wrong password

1. User navigates to `/signup`
2. User fills in signup form with an email that already has an account
3. User enters an incorrect password
4. User submits the form
5. **System Response**:
   - Shows info toast: "User exists, signing you in…"
   - Attempts sign-in with provided credentials
   - Sign-in fails due to incorrect password
   - Shows error toast: "Incorrect password. Please try again."
   - Redirects to `/login` page
   - User can now use "Forgot Password" or try signing in again

### Scenario 3: User signs up with existing email (unconfirmed)

1. User navigates to `/signup`
2. User fills in signup form with an email that has an unconfirmed account
3. User submits the form
4. **System Response**:
   - Shows info toast: "User exists, signing you in…"
   - Attempts sign-in with provided credentials
   - Sign-in fails due to unconfirmed email
   - Shows error toast: "Please confirm your email before signing in."
   - Redirects to `/login` page
   - User needs to confirm their email first

### Previous Behavior

Before this feature:

- Error message: "An account with this email already exists. Please sign in instead."
- User had to manually navigate to sign-in page
- Extra friction in the user journey

---

## Implementation Details

### Architecture

This feature follows SOLID principles with clear separation of concerns across three layers:

#### 1. Infrastructure Layer (`SupabaseAuthRepository.ts`)

**Responsibility**: Normalize existing-user outcomes into a stable coded error

**Implementation**:
- On explicit duplicate-email errors (`user_already_exists` or equivalent message), throw `Error & { code: "user_already_exists" }`.
- On obfuscated duplicate-email success (`200` with `user.identities = []`), also throw `code: "user_already_exists"`.
- Only true first-time signup successes (`identities` present/non-empty) return `{ user }`.

```typescript
if (error) {
  if (isDuplicateSignUpError(error)) {
    throw createAuthError(error.message, "user_already_exists");
  }
  throw createAuthError(error.message, error.code);
}

if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
  throw createAuthError("User already registered", "user_already_exists");
}
```

#### 2. Application Layer (`AuthService.ts`)

**Responsibility**: Preserve error codes through the application boundary

**Implementation**: Preserves coded repository errors and wraps unknown non-Error failures safely.

```typescript
async signUp(email: string, password: string): Promise<{ user: AuthUser }> {
  try {
    return await this.authRepository.signUp(email, password);
  } catch (error) {
    throw wrapSignUpError(error);
  }
}
```

#### 3. UI Layer (`SignUpForm.tsx`)

**Responsibility**: Handle first-time signup confirmation separately from duplicate-email auto sign-in

**Implementation**:
- If `signUp` succeeds: show account-created confirmation and stop.
- If `signUp` throws `user_already_exists`: show "signing you in" and attempt sign-in.

```typescript
try {
  await signUp(data.email, data.password);
  toast.success("Account created. Please check your email to confirm your registration.");
  return;
} catch (signUpErr) {
  const error = signUpErr as Error & { code?: string };
  if (error.code === "user_already_exists") {
    toast.info("User exists, signing you in…");

    try {
      await signIn(data.email, data.password);
      toast.success("Signed in successfully");
      router.replace("/");
    } catch (signInErr) {
      const signInError = signInErr as Error & { code?: string };

      if (signInError.code === "invalid_login_credentials") {
        toast.error("Incorrect password. Please try again.");
        router.replace("/login");
      } else if (signInError.code === "email_not_confirmed") {
        toast.error("Please confirm your email before signing in.");
        router.replace("/login");
      } else {
        toast.error("Unable to sign in. Please try again.");
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }
}
```

### Supabase Error Contract

When a user attempts to sign up with an existing email, Supabase returns:

```json
{
  "__isAuthError": true,
  "name": "AuthApiError",
  "status": 422,
  "code": "user_already_exists",
  "message": "User already registered"
}
```

In some environments, Supabase may instead return an obfuscated success payload:

```json
{
  "user": {
    "email": "existing@example.com",
    "identities": []
  },
  "session": null
}
```

This response is normalized to `code: "user_already_exists"` in the repository layer.

When sign-in fails with wrong password:

```json
{
  "__isAuthError": true,
  "name": "AuthApiError",
  "status": 400,
  "code": "invalid_login_credentials",
  "message": "Invalid login credentials"
}
```

---

## Testing

### E2E Test Coverage

Two dedicated Playwright tests validate this behavior:

**Test Location**: `e2e/auth/sign-up.spec.ts`  
**Test Suite**: "Sign Up - Duplicate Email Auto Sign-In"

#### Test 1: Correct Password Auto Sign-In

1. Create and confirm a user account
2. Attempt to sign up again with same email and correct password
3. **Assertions**:
   - Initial account creation shows:
     - "Account created. Please check your email to confirm your registration."
   - "User exists, signing you in…" toast appears
   - Successfully redirected to `/` (home page)
   - User is authenticated

#### Test 2: Wrong Password Redirect to Login

1. Create and confirm a user account
2. Attempt to sign up again with same email but wrong password
3. **Assertions**:
   - Initial account creation shows:
     - "Account created. Please check your email to confirm your registration."
   - "User exists, signing you in…" toast appears
   - Redirected to `/login` page
   - User can retry with correct password or reset

#### Running the Tests

```bash
# Run only the duplicate email tests
npm run test:e2e -- --grep "Duplicate Email"

# Run all signup tests
npm run test:e2e -- e2e/auth/sign-up.spec.ts
```

---

## Key Decisions

### 1. Auto Sign-In vs Error Message

**Decision**: Automatically attempt sign-in when duplicate email is detected.

**Rationale**:

- Reduces friction: User doesn't need to navigate to sign-in page manually
- Intelligent behavior: If password is correct, just sign them in
- Clear feedback: User understands what's happening via toast messages
- Maintains security: Wrong password still blocks access and redirects to login

### 2. Redirect on Failed Sign-In

**Decision**: Redirect to `/login` page when auto sign-in fails (wrong password or unconfirmed email).

**Rationale**:

- Provides clear next step: User knows to use the login page
- Avoids confusion: Staying on signup page might confuse users
- Enables password reset: Login page has "Forgot Password" link
- Consistent UX: All authentication errors route through login page

### 3. Toast Message Progression

**Decision**: Show "User exists, signing you in…" first, then show success or error.

**Rationale**:

- Transparency: User understands what the system is doing
- Professional feel: Proactive messaging feels intelligent
- Sets expectations: User knows an automatic action is being taken
- Medical-grade UX: Calm, informative, predictable

### 4. Error Code Branch Points

**Decision**: Branch on `error.code`, not `error.message`.

**Rationale**:

- Stability: Error messages can change; codes are more stable
- Maintainability: Structured codes are easier to handle
- Consistency: Follows the same pattern used in sign-in flow
- Layering: Repository extracts codes; UI decides user-facing messages

---

## Edge Cases Handled

### 1. Unconfirmed Email Auto Sign-In Attempt

**Scenario**: User signs up with an email that exists but is unconfirmed.

**Behavior**:

- Auto sign-in attempt fails with `email_not_confirmed` error
- Shows: "Please confirm your email before signing in."
- Redirects to `/login`

**Why**: Maintains email confirmation requirement while still providing helpful guidance.

### 2. Rate Limit on Signup

**Scenario**: User tries to sign up multiple times in quick succession.

**Behavior**:

- Supabase returns rate limit error (not `user_already_exists`)
- Shows generic error: "Unable to create account. Please try again."
- No auto sign-in attempt

**Why**: Rate limits are different from duplicate email; no point attempting sign-in.

### 3. Network/Server Errors During Auto Sign-In

**Scenario**: Auto sign-in attempt hits a network or server error.

**Behavior**:

- Catches any sign-in error
- Shows: "Unable to sign in. Please try again."
- Redirects to `/login`

**Why**: Fail gracefully; user can retry from login page.

---

## Security Considerations

### Email Enumeration

**Impact**: This feature reveals whether an email is registered.

**Mitigation**:

- Acceptable trade-off for better UX
- Only revealed after user submits signup form (not on page load)
- Industry-standard behavior (most apps do this)

**Alternative Considered**: Keep generic error message, but rejected for poor UX.

### Password Validation

**Maintained**: Auto sign-in still validates password via Supabase auth.

**No Security Loss**: Same validation as manual sign-in flow.

---

## Known Limitations

1. **Email Enumeration**: Feature reveals registered emails (acceptable UX trade-off)
2. **Rate Limits**: If Supabase rate-limits signup attempts, auto sign-in won't trigger
3. **Session State**: If user is already signed in, behavior may vary (not currently handled)

---

## Future Enhancements

- Add analytics tracking for duplicate signup attempts
- Consider showing "Forgot Password?" link in error toast for wrong password
- Add session check: if user already signed in, show different message
- Consider auto-redirect to profile page for existing users

---

## Related Documentation

- `/docs/auth-flow.md` - Overall authentication architecture
- `/docs/features/supabase-local-e2e-testing.md` - E2E testing setup
- `/e2e/README.md` - E2E testing guide
