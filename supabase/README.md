# Supabase Local Development

This directory contains the configuration for running Supabase locally for development and E2E testing.

## Prerequisites

1. **Docker Desktop** - Required to run Supabase services
   - Download: https://www.docker.com/products/docker-desktop

2. **Supabase CLI** - Install via:

   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Windows (with Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # Linux
   brew install supabase/tap/supabase
   ```

## Quick Start

1. **Start Supabase services** (first time will download Docker images):

   ```bash
   npm run supabase:start
   ```

2. **Check status**:

   ```bash
   npm run supabase:status
   ```

   This will show you:
   - API URL (usually http://localhost:54321)
   - DB URL (usually postgresql://postgres:postgres@localhost:54322/postgres)
   - Studio URL (usually http://localhost:54323)
   - Mailpit URL (usually http://localhost:54324)
   - anon key and service_role key

3. **Update `.env.e2e`** to point to local Supabase:

   **Option A: Backup and switch** (recommended)

   ```bash
   # Backup your hosted config
   cp .env.e2e .env.e2e.hosted

   # Update .env.e2e with local values
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-status>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-status>
   INBUCKET_API_URL=http://localhost:54324/api/v1
   ```

   **Option B: Comment/uncomment** (simpler)

   ```bash
   # Keep both configs in .env.e2e, comment out the one not in use
   # Hosted Supabase (production E2E)
   # NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...

   # Local Supabase (for email flow testing)
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   ```

4. **Stop services** when done:
   ```bash
   npm run supabase:stop
   ```

## Services & Ports

When running locally, Supabase provides:

- **API Server**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio (Admin UI)**: http://localhost:54323
- **Mailpit (Email Testing)**: http://localhost:54324
  - Web interface to view test emails
  - REST API at http://localhost:54324/api/v1
- **Realtime**: ws://localhost:54321/realtime/v1

## Mailpit Email Testing

Mailpit captures all emails sent by Supabase Auth (password resets, confirmations, etc.).

### View Emails

- Open http://localhost:54324 in your browser
- All emails are listed by recipient
- Click to view email content

### API Access (for E2E tests)

```bash
# List recent emails (tests filter by recipient address)
GET http://localhost:54324/api/v1/messages

# Get specific email
GET http://localhost:54324/api/v1/message/<message-id>
```

## E2E Testing Flow

1. Start Supabase local: `npm run supabase:start`
2. Start app in E2E mode: `npm run dev:e2e` (separate terminal)
3. Run E2E tests: `npm run test:e2e`
4. Tests automatically:
   - Create a default test user via global setup
   - Test all auth flows (sign-up, sign-in, sign-out, password reset)
   - Capture emails in Mailpit for verification
   - Query Mailpit API for email content
   - Complete full flows including email confirmation links

## Troubleshooting

### Services won't start

- Ensure Docker Desktop is running
- Check if ports 54321-54326 are available
- Try `npm run supabase:stop` then start again

### Can't connect to database

- Check `npm run supabase:status` shows all services as healthy
- Verify .env.e2e has correct localhost URLs

### Emails not appearing in Mailpit

- Check http://localhost:54324 is accessible
- Verify Supabase Auth is using local SMTP (automatic when running locally)

## Reset Database

To reset the local database to a clean state:

```bash
npm run supabase:reset
```

This is useful when testing migrations or starting fresh.
