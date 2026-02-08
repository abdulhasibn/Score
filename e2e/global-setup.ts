import { createClient } from "@supabase/supabase-js";

type ErrorWithOptionalCode = Error & {
  code?: string;
};

function hasErrorCode(error: unknown, expectedCode: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as ErrorWithOptionalCode).code === expectedCode
  );
}

/**
 * Global E2E Test Setup
 *
 * Runs once before all Playwright tests to prepare the test environment.
 *
 * Purpose:
 * - Creates the default test user needed by sign-in.spec.ts and sign-out.spec.ts
 * - Uses credentials from E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars
 * - Auto-confirms the user so they can sign in immediately
 *
 * Prerequisites:
 * - Local Supabase must be running (npm run supabase:start)
 * - .env.e2e must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Note:
 * - This setup runs once per test session
 * - Individual tests may create their own temporary users as needed
 */
async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ Global setup failed: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    throw new Error("Supabase credentials not configured in .env.e2e");
  }

  if (!testEmail || !testPassword) {
    console.error(
      "❌ Global setup failed: Missing E2E_TEST_EMAIL or E2E_TEST_PASSWORD"
    );
    throw new Error("Test credentials not configured in .env.e2e");
  }

  console.log("\n🔧 Running E2E global setup...");
  console.log(`📧 Creating test user: ${testEmail}`);

  // Create Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if user already exists
    const { data: users, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Failed to list users:", listError.message);
      throw listError;
    }

    const existingUser = users?.users?.find((u) => u.email === testEmail);

    if (existingUser) {
      console.log(`✅ Test user already exists: ${testEmail}`);
      return;
    }

    // Create test user with auto-confirmed email
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm for immediate sign-in capability
    });

    if (error) {
      if (error.code === "email_exists") {
        console.log(`✅ Test user already exists: ${testEmail}`);
        return;
      }

      console.error("❌ Failed to create test user:", error.message);
      throw error;
    }

    console.log(`✅ Test user created successfully: ${testEmail}`);
    console.log(`   User ID: ${user.user?.id}`);
  } catch (error) {
    if (hasErrorCode(error, "email_exists")) {
      console.log(`✅ Test user already exists: ${testEmail}`);
      return;
    }

    console.error("❌ Global setup failed:", error);
    throw error;
  }

  console.log("✅ E2E global setup complete\n");
}

export default globalSetup;
