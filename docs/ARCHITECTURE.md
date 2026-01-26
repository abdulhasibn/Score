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

## Future Considerations

- API routes will be added in `/src/api` when needed
- Backend extraction will maintain the same API surface
- Mobile apps will consume the same API layer
- Real-time features will use Supabase Realtime subscriptions
