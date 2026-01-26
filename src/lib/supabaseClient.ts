import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  );
}

export const supabaseClient = createSupabaseClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * VERIFICATION INSTRUCTIONS (NON-DESTRUCTIVE)
 *
 * To verify Supabase connectivity, use the following in a Node.js script or browser console:
 *
 * 1. Client Initialization Check:
 *    import { supabaseClient } from '@/lib/supabaseClient';
 *    console.log('Client initialized:', !!supabaseClient);
 *
 * 2. Auth Module Verification (read-only):
 *    const { data: { session }, error } = await supabaseClient.auth.getSession();
 *    console.log('Auth module reachable:', !error);
 *    console.log('Current session:', session ? 'exists' : 'none (expected)');
 *
 * 3. Health Check (read-only):
 *    const { data, error } = await supabaseClient.auth.getUser();
 *    console.log('Auth health check:', error ? error.message : 'OK');
 *
 * NOTE: These operations are read-only and will NOT:
 * - Create users
 * - Modify data
 * - Trigger side effects
 * - Access protected resources
 */
