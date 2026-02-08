#!/usr/bin/env node
/**
 * Delete All Auth Users (Local Supabase)
 *
 * Uses the Supabase Admin API to list and delete every user in the target
 * project. Intended for local E2E cleanup (npm run supabase:delete-users).
 *
 * Prerequisites:
 * - Supabase must be running (e.g. npm run supabase:start for local)
 * - .env.e2e must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx dotenv -e .env.e2e -- node scripts/delete-all-auth-users.mjs
 *   npm run supabase:delete-users
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load .env.e2e (e.g. npx dotenv -e .env.e2e -- node scripts/delete-all-auth-users.mjs)"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteAllUsers() {
  let totalDeleted = 0;
  let page = 1;
  const perPage = 100;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("Failed to list users:", error.message);
      process.exit(1);
    }

    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      if (deleteError) {
        console.error(`Failed to delete user ${user.email} (${user.id}):`, deleteError.message);
      } else {
        totalDeleted += 1;
        console.log(`Deleted: ${user.email ?? user.id}`);
      }
    }

    if (users.length < perPage) break;
    page += 1;
  }

  console.log(`\nDone. Deleted ${totalDeleted} user(s).`);
}

deleteAllUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
