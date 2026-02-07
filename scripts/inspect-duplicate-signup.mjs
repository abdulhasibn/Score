#!/usr/bin/env node
/**
 * Inspect Duplicate Signup Error
 *
 * This script uses Playwright to sign up twice with the same email
 * and captures the exact error response from Supabase.
 */

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("\n🔍 Inspecting duplicate signup error...\n");

  const testEmail = `dup-test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  console.log(`Test email: ${testEmail}`);
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  // Create admin client to inspect error directly
  if (!SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("📝 Step 1: First signup (should succeed)...");

  const firstSignup = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (firstSignup.error) {
    console.error("❌ First signup failed:", firstSignup.error);
    process.exit(1);
  }

  console.log("✅ First signup succeeded");
  console.log("   User ID:", firstSignup.data.user?.id);
  console.log(
    "   Email confirmed:",
    firstSignup.data.user?.email_confirmed_at ? "Yes" : "No"
  );

  // Confirm the email to avoid rate limit issues
  console.log("\n📝 Step 1.5: Confirming first user email...");
  const { error: confirmError } = await supabase.auth.admin.updateUserById(
    firstSignup.data.user?.id || "",
    { email_confirm: true }
  );

  if (confirmError) {
    console.error("❌ Failed to confirm email:", confirmError.message);
  } else {
    console.log("✅ Email confirmed via admin API");
  }

  console.log("\n📝 Step 2: Second signup (same email - should fail)...");

  const secondSignup = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (secondSignup.error) {
    console.log("\n❌ Second signup error (EXPECTED):");
    console.log("   Message:", secondSignup.error.message);
    console.log("   Status:", secondSignup.error.status);
    console.log("   Name:", secondSignup.error.name);
    console.log("   Full error:", JSON.stringify(secondSignup.error, null, 2));
  } else {
    console.log("\n⚠️  Second signup succeeded (UNEXPECTED)");
    console.log("   User ID:", secondSignup.data.user?.id);
    console.log(
      "   This means Supabase allows duplicate signups (check config)"
    );
  }

  console.log("\n🧹 Cleanup: Deleting test user...");
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    firstSignup.data.user?.id || ""
  );

  if (deleteError) {
    console.error("⚠️  Failed to delete test user:", deleteError.message);
  } else {
    console.log("✅ Test user deleted");
  }

  console.log("\n✅ Inspection complete\n");
}

main().catch((error) => {
  console.error("\n❌ Script failed:", error);
  process.exit(1);
});
