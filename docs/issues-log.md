# Issues Log

## 2026-02-05 — E2E / Supabase Local — Blocker

- **Description**: Local E2E email-based auth tests were implemented assuming Inbucket (`/api/v1/mailbox/...`), but Supabase Local (CLI `v2.75.0`) exposes Mailpit on port `54324`. Password reset emails also contained a verify URL with `token=` rather than a link containing `access_token=`, causing a test assertion to fail.
- **Root cause**: Supabase Local tooling now ships Mailpit as the email capture service and the password recovery email link format differs from the earlier assumption.
- **Resolution**: Updated the email helper (`e2e/utils/inbucket.ts`) to use the Mailpit API (`/api/v1/messages`, `/api/v1/message/{id}`, `DELETE /api/v1/messages`) while keeping exports stable. Updated the forgot-password E2E assertion to validate `token=` + `type=recovery` instead of `access_token=`.
- **Preventive note**: Treat the email capture service as an adapter behind a stable test API and validate link semantics (recovery type + redirect target) rather than a specific token encoding.

## 2026-02-05 — E2E / Next.js Dev Server — Bug

- **Description**: Playwright screenshots showed the app completely unstyled (default browser CSS) even though manual testing looked correct.
- **Root cause**: `.env.e2e` set `NODE_ENV=test`, but E2E runs start the app with `next dev` which expects `NODE_ENV=development`. Forcing `NODE_ENV=test` can break dev-server behavior including CSS delivery.
- **Resolution**: Removed `NODE_ENV` from `.env.e2e` and documented the constraint in `e2e/README.md`.
- **Preventive note**: Avoid setting `NODE_ENV` in `.env.e2e`; keep test configuration scoped to explicit app/test vars.
