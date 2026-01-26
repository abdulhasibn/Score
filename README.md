# Score

A multi-tenant SaaS platform.

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server components and routing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework

### State & Data
- **TanStack Query** - Server state management, caching, and data synchronization
- **Zod** - Schema validation and runtime type checking

### Backend (To Be Configured)
- **Supabase** - PostgreSQL database, authentication, and real-time subscriptions

### Quality Tools
- **ESLint** - Code linting with Next.js and TypeScript rules
- **Prettier** - Code formatting with Tailwind CSS plugin
- **TypeScript** - Strict type checking enabled

## Architecture Philosophy

This project follows a **modular monolith** architecture designed for:

- **Web-first MVP**: Optimized for web application development
- **Future scalability**: Structure supports backend extraction when needed
- **Mobile-ready**: API layer will support future iOS/Android applications
- **Zero infra cost**: Development uses Supabase free tier

### Key Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
2. **Type Safety**: End-to-end type safety with TypeScript and Zod
3. **Modular Design**: Business logic isolated in domain layer for easy extraction
4. **Performance**: Optimized for fast load times and efficient data fetching

## Project Structure

```
/app                    # Next.js App Router
  /(auth)              # Authentication routes (placeholder)
  /(dashboard)         # Protected dashboard routes (placeholder)
  layout.tsx           # Root layout
  page.tsx             # Home page
  globals.css          # Global styles with Tailwind

/src
  /domain              # Business logic and domain models (empty)
  /api                 # Next.js API routes (empty - to be implemented)
  /lib                 # Adapters (Supabase client, auth, env) (empty)
  /realtime            # Real-time channel subscriptions (empty)
  /hooks               # Custom React hooks (empty)
  /types               # Shared TypeScript types (empty)
  /utils               # Pure utility functions (empty)

/db
  schema.sql           # Database schema placeholder
  policies.sql         # Row-level security policies placeholder

/docs
  PRD.md               # Product requirements document
  ARCHITECTURE.md      # Detailed architecture documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. (Future) Configure Supabase credentials in `.env.local`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Check formatting
npm run format:check
```

## Feature Scope

### MVP (To Be Implemented)

- Multi-tenant organization management
- Player management (global entity across organizations)
- Tournament creation and management (if applicable)
- Team formation and management
- Match scheduling and management
- Live match scoring (event-driven architecture)
- Real-time score updates via Supabase Realtime

### Future Features

- Mobile applications (iOS/Android)
- Advanced analytics and statistics
- Cross-tournament player performance tracking (if applicable)
- Tournament brackets and playoff systems (if applicable)
- Media management (photos, videos)
- Public tournament pages
- RESTful API for third-party integrations

## What Is NOT Built Yet

This repository is a **clean foundation** only. The following are intentionally not implemented:

- ❌ Supabase client configuration
- ❌ Authentication flows
- ❌ API routes
- ❌ Database schema
- ❌ Business logic
- ❌ UI components (beyond basic placeholder)
- ❌ State management setup (TanStack Query provider)
- ❌ Environment variable validation
- ❌ Error handling patterns
- ❌ Testing setup

These will be implemented in subsequent phases.

## Multi-Tenancy Model

- **Organizations** are the primary tenant boundary
- **Players** exist as global entities but are associated with organizations
- All data access is scoped by organization membership
- Row-level security (RLS) will enforce tenant isolation at the database level

## Development Guidelines

- Use absolute imports via `@/*` path alias
- Follow TypeScript strict mode
- Maintain separation between domain logic and UI
- Use Zod for all data validation
- Leverage TanStack Query for all server state
- Write self-documenting code with clear naming

## Environment Configuration

See `.env.example` for required environment variables. Currently includes:
- Next.js configuration
- Supabase placeholders (to be configured later)

## Documentation

- [Product Requirements](./docs/PRD.md) - Feature scope and roadmap
- [Architecture](./docs/ARCHITECTURE.md) - Detailed architecture decisions

## License

Private - All rights reserved
