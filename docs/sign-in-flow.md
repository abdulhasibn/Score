# Sign-In Flow Implementation

Authoritative internal documentation for the Sign-In flow in the Score? codebase. Use this document to trace behavior, debug redirect issues, and understand session propagation.

---

## 1. Overview

The sign-in flow is triggered from the login page (`/login`). The user submits email and password; the client calls Supabase Auth; on success the client navigates to `/` (dashboard). Auth enforcement is **server-side only**: there is **no middleware**. Protected and public routes are enforced by server components that call `getSession()` and redirect accordingly.

**Successful sign-in** in this app means: (1) Supabase returns a session (user + tokens), (2) the client stores that session (via the Supabase client used for sign-in), (3) the client navigates to `/` with `router.replace("/")`, and (4) the server, when rendering `/`, sees a valid session (via cookies) and renders the dashboard instead of redirecting to `/login`. If the server does not see the session on the request that serves `/`, it redirects to `/login` and a redirect loop can occur.

---

## 2. Client-Side Sign-In Logic

### 2.1 Trigger: SignInForm

Sign-in is triggered in `src/auth/ui/SignInForm.tsx`. The form submits to `onSubmit`, which calls `signIn(data.email, data.password)` from `useAuth()`, then on success shows a toast and calls `router.replace("/")`.

```tsx
// src/auth/ui/SignInForm.tsx (excerpt)

const onSubmit = async (data: SignInFormData) => {
  setIsLoading(true);
  try {
    await signIn(data.email, data.password);
    toast.success("Signed in successfully");
    router.replace("/");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Sign in failed";
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
```

Navigation is **always** `router.replace("/")` on success. There is no full page reload and no server-side redirect from the sign-in action itself.

### 2.2 Hook: useAuth

`useAuth()` (in `src/auth/ui/useAuth.ts`) delegates `signIn` to `authService.signIn`. The hook does not perform auth logic; it only forwards arguments and returns the promise.

```ts
// src/auth/ui/useAuth.ts (excerpt)

const signIn = async (email: string, password: string) => {
  return await authService.signIn(email, password);
};
```

### 2.3 Application Layer: AuthService

`AuthService` (in `src/auth/application/AuthService.ts`) delegates to the repository and wraps errors with a generic message. It does not touch storage or navigation.

```ts
// src/auth/application/AuthService.ts (excerpt)

async signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser; session: AuthSession }> {
  try {
    return await this.authRepository.signIn(email, password);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Sign in failed: ${errorMessage}`);
  }
}
```

### 2.4 Infrastructure: SupabaseAuthRepository

The actual Supabase call is in `src/auth/infrastructure/SupabaseAuthRepository.ts`. It uses **`supabaseClient`** from `src/lib/supabaseClient.ts` (see Section 4). No server client or cookies are used here.

```ts
// src/auth/infrastructure/SupabaseAuthRepository.ts (excerpt)

async signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser; session: AuthSession }> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const authError = new Error(error.message) as Error & { code?: string };
    const supabaseError = error as { code?: string; status?: number; message: string };
    if (supabaseError.code) {
      authError.code = supabaseError.code;
    } else {
      const message = supabaseError.message.toLowerCase();
      if (message.includes("email_not_confirmed") || message.includes("email not confirmed")) {
        authError.code = "email_not_confirmed";
      } else if (message.includes("invalid login") || message.includes("invalid_credentials")) {
        authError.code = "invalid_login_credentials";
      }
    }
    throw authError;
  }

  if (!data.user || !data.session) {
    throw new Error("Sign in succeeded but user or session is missing");
  }

  return {
    user: this.mapSupabaseUserToAuthUser(data.user),
    session: this.mapSupabaseSessionToAuthSession(data.session),
  };
}
```

Success and failure are handled as follows:

- **Success**: Repository returns `{ user, session }`; the promise resolves; SignInForm runs `toast.success(...)` and `router.replace("/")`.
- **Failure**: Repository throws an `Error` with optional `.code` (`email_not_confirmed`, `invalid_login_credentials`, etc.); AuthService wraps it; SignInForm catches, shows `toast.error(...)`, and does **not** navigate.

---

## 3. Supabase Response Handling

### 3.1 API Call

The client uses `supabaseClient.auth.signInWithPassword({ email, password })`. Under the hood this performs a request to Supabase Auth (e.g. `POST .../auth/v1/token?grant_type=password`). The exact URL and shape are defined by the Supabase client library.

### 3.2 Response Shape Relied Upon

The repository assumes a successful response with this structure (from `data`):

- `data.user`: object with at least `id`, `email`, `created_at`, `updated_at`
- `data.session`: object with at least `access_token`, `refresh_token`, `expires_at`, and `user` (same shape as above)

The repository maps these to domain types `AuthUser` and `AuthSession`. It does **not** read or set cookies or headers; persistence is entirely the responsibility of the Supabase client that performed the call (see Section 4).

### 3.3 What Is Not Relied Upon

- Response headers or Set-Cookie from the sign-in request are not read or interpreted by application code. Cookie handling is done inside the Supabase client libraries.
- The app does not manually parse JWTs or refresh tokens; it uses the client’s `getSession()` / `getUser()` and (on the server) the SSR client’s cookie-based session.

---

## 4. Session & Cookie Persistence

### 4.1 Two Supabase Clients

The codebase uses **two different** Supabase clients for auth-related behavior:

| Purpose                                                                                  | File                         | Creation                                      | Storage                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in, sign-out, getSession/getUser in **browser** (AuthRepository, AuthStateObserver) | `src/lib/supabaseClient.ts`  | `createClient()` from `@supabase/supabase-js` | Default browser storage for `@supabase/supabase-js` (typically **localStorage**). No custom `storage` or cookie options are passed. |
| Session check on **server** (getSession, signOut action)                                 | `src/lib/supabase/server.ts` | `createServerClient()` from `@supabase/ssr`   | **Cookies** via Next.js `cookies()`: `getAll()` and `setAll()` are implemented using the request’s cookie store.                    |

```ts
// src/lib/supabaseClient.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const supabaseClient = createSupabaseClient(
  supabaseUrl,
  supabaseAnonKey
);
```

```ts
// src/lib/supabase/server.ts (excerpt)

export async function createClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component cookie setting
        }
      },
    },
  });
}
```

### 4.2 Where Session Is Stored After signInWithPassword

- **Sign-in** is performed with `supabaseClient` (supabase-js). That client’s default behavior in the browser is to persist the session in **localStorage** (no cookie adapter is configured).
- The **server** never uses `supabaseClient`. It only uses `createClient()` from `server.ts`, which reads and writes **cookies** via the Next.js `cookies()` API.

So: the client that sets the session after sign-in uses localStorage; the server that checks the session uses cookies. For the server to see the session on the next request, the session must be present in the **request cookies** when the server runs. That only happens if some part of the stack (e.g. Supabase SSR or a cookie sync) writes the session into cookies. The vanilla `@supabase/supabase-js` client used here does not, by default, set cookies.

### 4.3 When Cookies Are Available to the Server

- Cookies are available when the server handles a request that includes a `Cookie` header.
- For a client-side navigation to `/` (e.g. after `router.replace("/")`), Next.js issues a request for the RSC payload (and any full navigations). That request will include cookies that the browser has stored for the origin.
- If the session was only written to localStorage by `supabaseClient`, and never written to cookies, the server’s `getSession()` will not see a session, because it only reads cookies.

---

## 5. Middleware Authentication Logic

**There is no middleware in this project.** A search for `middleware.ts` / `middleware.js` returns no files.

Auth is **not** enforced in middleware. It is enforced only in:

- **Protected route** (`app/page.tsx`): Server component calls `getSession()`. If `!session`, it calls `redirect("/login")`.
- **Login route** (`app/(auth)/login/page.tsx`): Server component calls `getSession()`. If `session`, it calls `redirect("/")`.

No shared middleware runs before these components. Every protected or public page that needs auth runs its own server-side `getSession()` and redirect logic.

---

## 6. Navigation & Middleware Interaction

### 6.1 What Happens After Sign-In

1. User submits the form on `/login`.
2. `signInWithPassword` runs in the browser via `supabaseClient`. Supabase returns a session; the **supabase-js** client persists it (default: localStorage).
3. SignInForm runs `router.replace("/")`. This is a **client-side navigation**.
4. Next.js requests the new route (e.g. RSC payload for `/`). The browser sends the **Cookie** header for this origin. No middleware runs.
5. The server renders the component tree for `/`. `app/page.tsx` (DashboardPage) runs as a server component and calls `getSession()`.
6. `getSession()` uses `createClient()` from `src/lib/supabase/server.ts`, which uses `cookies()` and thus only sees **cookies**.
7. If the session is present in cookies, `getSession()` returns it and the dashboard is rendered. If not, `getSession()` returns `null` and the server calls `redirect("/login")`.

### 6.2 Client-Side vs Full Page Request

- **Client-side navigation** (e.g. `router.replace("/")`): The browser keeps the same page context and sends one or more requests (e.g. RSC) with the current cookies. There is no full HTML reload unless the response triggers one (e.g. redirect to another origin).
- **Full page load** (e.g. user types `/` in the address bar or refreshes): The browser sends a single request with the current cookies. Same server logic: `getSession()` runs, reads cookies, redirects if no session.

In both cases, the server’s view of “authenticated” depends **only** on what is in the request cookies when `getSession()` runs. It does not read localStorage or any other client-only store.

### 6.3 Why `/login` → `/` → `/login` Loops Can Happen

- Sign-in stores the session in the **supabase-js** client’s default storage (localStorage).
- Navigation to `/` triggers a server render. The server uses the **SSR** client, which reads **cookies**.
- If the session was never written to cookies (e.g. because the client that performed sign-in only writes to localStorage), the server sees no session, redirects to `/login`.
- The user ends up on `/login` again. If they are already on the login page and something triggers another navigation to `/`, the same cycle repeats: server sees no session → redirect to `/login`. That is the loop.

So the loop is tied to **session not being available in cookies** when the server handles the request for `/`, while the client may already have a session in localStorage.

---

## 7. Invariants & Assumptions

### 7.1 What Must Be True After Sign-In (for dashboard to load)

- Supabase has returned a valid session (user + tokens).
- That session is stored somewhere the **browser** can send it to the **server** on the next request to this origin. In the current server implementation, that means the session must be present in **cookies** when the server runs `getSession()` for `/`.

### 7.2 What the Server Assumes

- Session is available via the **cookie store** passed to `createServerClient` (Next.js `cookies()`).
- No middleware is relied upon; each page that needs auth calls `getSession()` itself and redirects if needed.

### 7.3 What Can Be Asserted in E2E Tests

- After submitting valid credentials on `/login`, the client will call `router.replace("/")` and the browser will issue a request to `/`.
- Whether the user stays on `/` or is sent back to `/login` depends on whether the **server** sees a session in cookies when it renders `/`. E2E tests that only drive the client cannot directly observe cookie vs localStorage; they can only observe the final URL and visible route (e.g. dashboard vs login form). To avoid redirect loops in tests, the test environment must be set up so that the session is available in cookies when the server handles the request to `/` (e.g. by using a client that writes cookies, or by configuring the same storage/cookie behavior as in production).

---

## 8. Common Failure Modes

### 8.1 Session Exists in Client but Server Redirects to `/login`

- **Cause**: The client that performed sign-in (`supabaseClient` from supabaseClient.ts) persists the session in localStorage by default. The server only reads cookies. So the server never sees the session.
- **Symptom**: After a successful sign-in, the user is redirected to `/` and then immediately (or after a brief flash) back to `/login`.

### 8.2 Cookies Not Visible to the Server

- **Cause**: Cookies are request-scoped. The server’s `createClient()` reads `cookies()` for the **current** request. If the session was never set in cookies for this origin (e.g. wrong domain, SameSite, or client never writing cookies), `getAll()` returns no session cookies and `getSession()` returns null.
- **Symptom**: Same as 8.1: server always treats the user as unauthenticated.

### 8.3 Timing / Redirect Loops

- **Cause**: Same as 8.1: client has session in localStorage, server has no session in cookies. Every navigation to `/` triggers a server render, `getSession()` sees null, redirect to `/login`. If the app or test then navigates again to `/`, the loop continues.
- **Mitigation**: Ensure the client that performs sign-in writes the session into cookies that the server can read (e.g. by using a Supabase client configured for cookie-based auth, or an SSR-compatible flow), so that the first request to `/` after sign-in already includes the session in the Cookie header.

---

## Reference: Key Files

| Concern                               | File                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| Sign-in form and navigation           | `src/auth/ui/SignInForm.tsx`                           |
| Auth hook                             | `src/auth/ui/useAuth.ts`                               |
| Application sign-in                   | `src/auth/application/AuthService.ts`                  |
| Supabase sign-in call                 | `src/auth/infrastructure/SupabaseAuthRepository.ts`    |
| Client Supabase (sign-in, state)      | `src/lib/supabaseClient.ts`                            |
| Server Supabase (getSession, cookies) | `src/lib/supabase/server.ts`                           |
| Server session helper                 | `src/lib/auth/get-session.ts`                          |
| Protected route                       | `app/page.tsx`                                         |
| Login route (redirect if session)     | `app/(auth)/login/page.tsx`                            |
| Server sign-out action                | `src/lib/auth/actions.ts`                              |
| Auth state observer (client)          | `src/auth/infrastructure/SupabaseAuthStateObserver.ts` |

Middleware: **none** (no `middleware.ts` or `middleware.js` in the project).
