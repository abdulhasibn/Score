# Architecture Documentation

## Philosophy

This application follows a **modular monolith** architecture, designed for:
- Web-first MVP development
- Future backend extraction (when needed)
- Mobile app support (via API layer)
- Zero infrastructure cost during development

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server components
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling

### State & Data
- **TanStack Query** - Server state management and data fetching
- **Zod** - Schema validation and type inference

### Backend (Future)
- **Supabase** - PostgreSQL database, authentication, real-time subscriptions

## Project Structure

```
/app              # Next.js App Router pages and layouts
  /(auth)         # Authentication routes (login, signup, etc.)
  /(dashboard)    # Protected dashboard routes

/src
  /domain         # Business logic and domain models
  /api            # Next.js API routes (when implemented)
  /lib            # Adapters and utilities (Supabase client, auth helpers, env)
  /realtime       # Real-time channel subscriptions for live scoring
  /hooks          # Custom React hooks
  /types          # Shared TypeScript types and interfaces
  /utils          # Pure utility functions

/db
  schema.sql      # Database schema definitions
  policies.sql    # Row-level security policies

/docs
  PRD.md          # Product requirements
  ARCHITECTURE.md # This file
```

## Design Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
2. **Type Safety**: Leverage TypeScript and Zod for end-to-end type safety
3. **Scalability**: Structure supports growth from MVP to production SaaS
4. **Maintainability**: Modular, testable, and well-documented code
5. **Performance**: Optimize for fast load times and efficient data fetching

## Multi-Tenancy Model

- Organizations are the primary tenant boundary
- Players exist as global entities but are associated with organizations
- All data access is scoped by organization membership
- Row-level security enforces tenant isolation

## Data Flow

1. **UI Layer** (`/app`) - React components and pages
2. **State Layer** (`/src/hooks`) - TanStack Query hooks for server state
3. **Domain Layer** (`/src/domain`) - Business logic and validation
4. **Data Layer** (`/src/lib`) - Supabase client and data access
5. **Database** (Supabase) - PostgreSQL with RLS policies

## Supabase Client Architecture

The application uses two Supabase clients to support both client-side and server-side operations:

### Browser Client (`src/lib/supabaseClient.ts`)

- **Usage**: Client-side operations in React components, domain services, and infrastructure repositories
- **Implementation**: `createClient` from `@supabase/supabase-js`
- **Purpose**: Browser-based authentication, API calls from client components
- **Examples**:
  - `SupabaseAuthRepository` (infrastructure layer)
  - Client-side data fetching in components
  - Real-time subscriptions

### Server Client (`src/lib/supabase/server.ts`)

- **Usage**: Server-side operations in Next.js Server Components and Server Actions
- **Implementation**: `createServerClient` from `@supabase/ssr`
- **Purpose**: Server-side session management, cookie handling, SSR support
- **Examples**:
  - `getSession()` helper for Server Components
  - `signOut()` Server Action
  - API routes (when implemented)

### When to Use Which Client

| Context | Client to Use | Rationale |
|---------|--------------|-----------|
| React Client Components (`"use client"`) | Browser Client | Runs in browser, needs direct client instance |
| Infrastructure Repositories | Browser Client | Domain layer is client-agnostic, uses browser client via repositories |
| Server Components | Server Client | Runs on server, needs cookie-based session management |
| Server Actions | Server Client | Runs on server, needs secure cookie handling |
| API Routes (future) | Server Client | Server-side endpoints require SSR client |

### Design Rationale

- **Separation of Concerns**: Browser client for client-side ops, server client for SSR/actions
- **Security**: Server client handles secure cookie-based sessions without exposing credentials
- **Next.js Compatibility**: Server client integrates seamlessly with App Router SSR patterns
- **Domain Independence**: Domain/infrastructure layers use browser client, remaining agnostic to server context

### Client Consistency (Single Source of Truth)

The codebase uses **exactly two** Supabase client entry points. Do not add or use other Supabase client modules for app code:

| Entry point | File | Package | Used by |
|-------------|------|---------|---------|
| **Browser** | `src/lib/supabaseClient.ts` | `@supabase/supabase-js` | `SupabaseAuthRepository`, `SupabaseAuthStateObserver`, and any client-side Supabase access |
| **Server** | `src/lib/supabase/server.ts` | `@supabase/ssr` | `get-session.ts`, `actions.ts`, and any server-side Supabase access |

- **Client components / repositories**: Import `supabaseClient` from `src/lib/supabaseClient.ts` only.
- **Server components / Server Actions**: Call `createClient()` from `src/lib/supabase/server.ts` only.
- **E2E / scripts**: May create their own admin client via `createClient(url, serviceRoleKey)` from `@supabase/supabase-js` for test or tooling use; this is not part of the app runtime.

## Future Considerations

- API routes will be added in `/src/api` when needed
- Backend extraction will maintain the same API surface
- Mobile apps will consume the same API layer
- Real-time features will use Supabase Realtime subscriptions
