import { createClient } from "@/src/lib/supabase/server";
import type { AuthSession } from "@/src/auth/domain/AuthSession";
import type { AuthUser } from "@/src/auth/domain/AuthUser";

/**
 * getSession
 *
 * Server-side utility to get the current authentication session.
 * Uses Supabase server client to read cookies and validate session.
 *
 * Returns null if no session exists.
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  if (!data.session) {
    return null;
  }

  const session = data.session;
  const user = session.user;

  if (!user.email) {
    return null;
  }

  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000)
    : new Date(Date.now() + 3600 * 1000);

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    createdAt: user.created_at ? new Date(user.created_at) : new Date(),
    updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
  };

  const authSession: AuthSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt,
    user: authUser,
  };

  return authSession;
}
