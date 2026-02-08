# Authentication Flow

## Overview

The authentication system provides email/password authentication using Supabase Auth as the provider. The system supports four primary flows:

- **Sign Up**: New user registration with email confirmation
- **Sign In**: User authentication with existing credentials
- **Forgot Password**: Password reset request via email
- **Reset Password**: Password update after clicking reset link

The implementation follows a layered architecture with clear separation between UI, application logic, and infrastructure. All authentication state is managed reactively through an observer pattern.

## Architecture

### Layers

The authentication system is organized into four distinct layers:

1. **UI Layer** (`src/auth/ui/`)
   - React form components (SignUpForm, SignInForm, ForgotPasswordForm, ResetPasswordForm)
   - Handles user input, validation, and visual feedback
   - Delegates all business logic to hooks and services
   - Uses Sonner for toast notifications

2. **Hooks Layer** (`src/auth/ui/useAuth.ts`)
   - Thin React hook that bridges components to the authentication system
   - Subscribes to `AuthStateObserver` for reactive state updates
   - Delegates actions to `AuthService`
   - Returns: `{ user, session, status, signIn, signUp, signOut, requestPasswordReset, updatePassword }`

3. **Application Layer** (`src/auth/application/`)
   - `AuthService`: Orchestrates authentication use-cases
   - `AuthStateObserver`: Provider-agnostic interface for auth state changes
   - Wraps repository errors with application context
   - Implements security rules (e.g., email enumeration prevention)

4. **Infrastructure Layer** (`src/auth/infrastructure/`)
   - `SupabaseAuthRepository`: Implements `AuthRepository` interface using Supabase
   - `SupabaseAuthStateObserver`: Subscribes to Supabase auth state changes
   - Maps Supabase types to domain types
   - Handles all Supabase-specific logic

### Dependency Direction

Dependencies flow inward: UI → Hooks → Application → Infrastructure. The domain layer (`src/auth/domain/`) defines interfaces that infrastructure implements. This follows the Dependency Inversion Principle.

## Sign-Up Flow

### Step-by-Step Process

1. User submits sign-up form with email, password, and confirm password
2. Client-side validation (Zod schema) checks:
   - Email format
   - Password strength (min 8 chars, uppercase, lowercase, number, special char)
   - Password match
3. If validation fails, show inline error messages and abort
4. If validation passes, call `signUp(email, password)`
   - `signUp` creates user identity in Supabase
   - Returns `{ user }` only (no session) for first-time registrations
   - If `signUp` succeeds (first-time user):
     - Show success toast: "Account created. Please check your email to confirm your registration."
     - Do not call `signIn` automatically
     - Do not redirect
   - If `signUp` throws with `code: "user_already_exists"` (existing-email attempt):
     - Show info toast: "User exists, signing you in…"
     - Attempt `signIn(email, password)`
       - On success: Show "Signed in successfully" and redirect to `/`
       - On failure (wrong password): Show "Incorrect password. Please try again." and redirect to `/login`
       - On failure (unconfirmed email): Show "Please confirm your email before signing in." and redirect to `/login`
     - Abort sign-up flow
   - If `signUp` throws other error: Show generic error toast and abort

### Why signIn Runs Only for Existing-Email Signups

- `signUp` remains the source of truth for first-time account creation
- First-time signups should show confirmation guidance without triggering an avoidable auth error
- Duplicate-email signups still use `signIn` as the authentication authority
- This keeps UX clean while preserving the duplicate auto sign-in experience

### Supabase Response Interpretation

- `signUp` may return an obfuscated success response for existing users
- Infrastructure normalizes existing-user outcomes to `code: "user_already_exists"`
  - explicit duplicate error from Supabase
  - obfuscated success where `user.identities` is an empty array
- First-time signups are identified by successful `signUp` responses with non-empty identities (or identities omitted)
- `signIn` returns session only if email is confirmed
- Error codes are extracted from Supabase errors in the repository layer
- UI branches only on structured `error.code`, never on error messages

### Duplicate Email Auto Sign-In

When a user attempts to sign up with an email that already exists:

- Supabase returns error code `user_already_exists` (status 422)
- UI shows: "User exists, signing you in…"
- System automatically attempts sign-in with provided credentials
- On success: User is signed in and redirected to home page
- On failure: Error message displayed and user redirected to `/login`

**See**: `/docs/features/signup-duplicate-email-auto-signin.md` for complete implementation details

### Security Considerations

- Controlled user enumeration: Sign-up flow reveals email existence only after signup attempt (acceptable UX trade-off)
- Error normalization: Repository layer normalizes Supabase errors to structured codes
- No token handling in UI: All token management delegated to Supabase
- Password validation: Auto sign-in maintains same security as manual sign-in

## Sign-In Flow

### Step-by-Step Process

1. User submits sign-in form with email and password
2. Client-side validation (Zod schema) checks:
   - Email format
   - Password minimum length (8 characters)
3. If validation fails, show inline error messages and abort
4. If validation passes, call `signIn(email, password)`
5. Branch on result:

   **Success**
   - Show success toast: "Signed in successfully"
   - Redirect to `/`

   **Failure**
   - Extract error message from exception
   - Show error toast with message
   - Do not redirect

### Error Handling Strategy

- Repository layer extracts error codes from Supabase responses
- Known codes: `email_not_confirmed`, `invalid_login_credentials`
- Unknown errors are wrapped with descriptive messages
- UI displays error messages via toast notifications
- No inline API error rendering (separation of concerns)

## Forgot Password Flow

### Step-by-Step Process

1. User submits forgot password form with email
2. Client-side validation (Zod schema) checks email format
3. If validation fails, show inline error and abort
4. If validation passes, call `requestPasswordReset(email)`
5. Always show success toast: "Reset link sent if account exists"
   - This happens regardless of whether `requestPasswordReset` succeeds or throws
   - Prevents email enumeration attacks

### Email Enumeration Protection

- `AuthService.requestPasswordReset` always succeeds (never throws)
- `SupabaseAuthRepository.requestPasswordReset` logs errors but does not throw
- UI always shows success message
- Supabase silently fails if email doesn't exist, but this is not revealed to users

### Supabase Behavior

- Supabase sends password reset email if account exists
- Email contains reset link with token
- Reset link redirects to `/reset-password` route
- Token is embedded in URL hash (handled by Supabase)

## Reset Password Flow

### Step-by-Step Process

1. User arrives at `/reset-password` via Supabase reset link
2. Supabase automatically validates token from URL hash
3. User submits reset form with new password and confirm password
4. Client-side validation (Zod schema) checks:
   - Password minimum length (8 characters)
   - Password match
5. If validation fails, show inline error messages and abort
6. If validation passes, call `updatePassword(newPassword)`
7. Branch on result:

   **Success**
   - Show success toast: "Password updated. Sign in to continue"
   - Wait 2 seconds
   - Redirect to `/login`

   **Failure**
   - Show error toast with error message
   - Do not redirect

### Token Handling

- Token validation is delegated entirely to Supabase
- UI never directly handles tokens
- Supabase `updateUser` API validates token automatically
- If token is invalid/expired, Supabase returns error

## UX & Feedback Rules

### Toast-Based Feedback

- All user feedback uses Sonner toast notifications
- Success: Green toast for successful operations
- Error: Red toast for failures
- Info: Blue toast for informational messages

### No Inline API Error Rendering

- Validation errors: Shown inline below form fields
- API errors: Shown via toast notifications only
- Clear separation between client-side validation and server errors

### Validation vs Server Error Separation

- Validation errors are deterministic and shown immediately
- Server errors are shown after API call completes
- Users see validation errors before submission
- Users see server errors after submission attempt

## Security Decisions

### Email Enumeration Prevention

- Forgot password flow always shows success message
- Sign-up flow reveals existing-email state only after explicit signup submission
- Duplicate-email flow uses controlled messaging for UX ("User exists, signing you in…")

### Error Normalization

- Repository layer extracts and normalizes Supabase error codes
- UI layer branches only on structured `error.code`
- Error messages are sanitized before display

### No Token Handling in UI

- All token management delegated to Supabase
- Reset password tokens are in URL hash (Supabase standard)
- UI never reads or validates tokens directly

### Supabase as Source of Truth

- Supabase manages all authentication state
- Session persistence handled by Supabase
- Token refresh handled by Supabase
- Application subscribes to Supabase auth state changes

## Explicit Non-Goals

The authentication system does NOT handle:

- User profiles (name, avatar, preferences)
- Role-based access control (RBAC)
- Organization membership
- Multi-factor authentication (MFA)
- OAuth providers (Google, GitHub, etc.)
- Social login
- Session management beyond Supabase defaults
- Password strength requirements beyond minimum 8 characters
- Account deletion
- Email change
- Username-based authentication

These features are outside the scope of the current authentication implementation.
