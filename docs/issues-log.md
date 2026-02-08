# Issues Log

This file tracks all bugs, blockers, design flaws, and technical debt encountered during development.

## Format

Each entry must include:
- Date
- Feature / Module
- Issue type (Bug | Blocker | Design flaw | Tech debt)
- Description
- Root cause
- Resolution
- Preventive note

---

## 2026-02-03 | UI Theme Conformity | Tech debt

**Issue type:** Tech debt

**Description:** Repository audit found several violations of UI theme contract and architectural principles:
1. Raw Tailwind color literals (`text-gray-600`, `bg-red-600`) used instead of semantic tokens
2. Business logic (password strength calculation) embedded in UI component
3. Inconsistent use of Button component (raw `<button>` element in dashboard)

**Root cause:**
- Initial implementation prioritized speed over strict contract adherence
- Password strength logic was co-located with UI for convenience
- Dashboard page used raw HTML button instead of design system primitive

**Resolution:**
1. Replaced all raw color literals with semantic tokens (`text-muted-foreground`, `bg-destructive`, `text-destructive-foreground`)
2. Extracted password strength calculation to domain layer (`src/auth/domain/passwordStrength.ts`)
3. Updated dashboard to use Button component with variant="destructive"
4. Preserved unused UI components and CSS variables for future use

**Preventive note:**
- Always use semantic color tokens from theme contract (no raw hex or Tailwind literals)
- Business logic must live in domain layer, not UI components (SOLID principle)
- Always use design system primitives (Button, Input, etc.) instead of raw HTML elements
- Maintain strict separation between UI, domain, and infrastructure layers

---

## 2026-02-03 | Supabase Local Password Reset | Bug

**Date:** 2026-02-03

**Feature / Module:** E2E Testing / Password Reset Flow

**Issue type:** Bug

**Description:** Password reset tests were failing because the expected URL parameter format changed between Inbucket and Mailpit. Tests expected `access_token=` but Mailpit uses `token=`.

**Root cause:** Supabase Local switched from Inbucket to Mailpit for email handling, which uses different query parameter names for password reset links.

**Resolution:** Updated test assertions in `e2e/auth/forgot-password.spec.ts` to expect `token=` instead of `access_token=`.

**Preventive note:** When changing email service providers in Supabase Local, verify the format of generated URLs (password reset, email confirmation) matches test expectations.

---

## 2026-02-03 | NODE_ENV Breaking Playwright Screenshots | Bug

**Date:** 2026-02-03

**Feature / Module:** E2E Testing / Styling

**Issue type:** Bug

**Description:** Playwright test screenshots showed completely unstyled pages (no CSS applied), while manual testing showed correct styling. This occurred when `.env.e2e` had `NODE_ENV=test` set.

**Root cause:** Next.js dev server treats `NODE_ENV=test` differently and may not load stylesheets correctly in this mode. The dev server expects either `development` or `production`.

**Resolution:** Removed `NODE_ENV=test` from `.env.e2e`. Next.js dev server defaults to `NODE_ENV=development` when started with `npm run dev:e2e`.

**Preventive note:** Do not set `NODE_ENV` in E2E test configuration. Let Next.js manage it automatically. Document this in E2E README with explicit warning.

---
