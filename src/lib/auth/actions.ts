"use server";

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * signOut
 *
 * Server action to sign out the current user.
 * Clears the session and redirects to login page.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
