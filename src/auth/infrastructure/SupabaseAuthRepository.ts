import { supabaseClient } from "../../lib/supabaseClient";
import type { AuthRepository } from "../domain/AuthRepository";
import type { AuthUser } from "../domain/AuthUser";
import type { AuthSession } from "../domain/AuthSession";

/**
 * SupabaseAuthRepository
 *
 * Infrastructure implementation of AuthRepository using Supabase.
 * Maps Supabase auth responses to domain models.
 */
export class SupabaseAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }

    if (!data.user) {
      return null;
    }

    return this.mapSupabaseUserToAuthUser(data.user);
  }

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }

    if (!data.session) {
      return null;
    }

    return this.mapSupabaseSessionToAuthSession(data.session);
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser; session: AuthSession }> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const authError = new Error(error.message) as Error & { code?: string };
      // Harden error code extraction: use error.code if available, otherwise extract from message
      // This parsing happens ONLY in repository layer, UI branches only on error.code
      const supabaseError = error as {
        code?: string;
        status?: number;
        message: string;
      };
      if (supabaseError.code) {
        // Use Supabase-provided code directly
        authError.code = supabaseError.code;
      } else {
        // Fallback: extract known codes from message (repository-only parsing)
        const message = supabaseError.message.toLowerCase();
        if (
          message.includes("email_not_confirmed") ||
          message.includes("email not confirmed")
        ) {
          authError.code = "email_not_confirmed";
        } else if (
          message.includes("invalid login") ||
          message.includes("invalid_credentials")
        ) {
          authError.code = "invalid_login_credentials";
        }
      }
      throw authError;
    }

    if (!data.user || !data.session) {
      throw new Error("Sign in succeeded but user or session is missing");
    }

    return {
      user: this.mapSupabaseUserToAuthUser(data.user),
      session: this.mapSupabaseSessionToAuthSession(data.session),
    };
  }

  async signUp(email: string, password: string): Promise<{ user: AuthUser }> {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      const authError = new Error(error.message) as Error & { code?: string };
      // Extract error code from Supabase error for domain-layer handling
      const supabaseError = error as {
        code?: string;
        status?: number;
        message: string;
      };
      if (supabaseError.code) {
        // Attach Supabase error code to the thrown error
        authError.code = supabaseError.code;
      }
      throw authError;
    }

    if (!data.user) {
      throw new Error("Sign up failed: User was not created");
    }

    // Return user only - ignore session completely
    // signUp = identity creation, signIn = authentication authority
    return {
      user: this.mapSupabaseUserToAuthUser(data.user),
    };
  }

  async signOut(): Promise<void> {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    // Construct redirect URL - works in both client and server contexts
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
          : "/reset-password";

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Always succeed to prevent email enumeration
    // Supabase will silently fail if email doesn't exist, but we don't reveal that
    if (error) {
      // Log error but don't throw - always show success message
      console.error("Password reset request error:", error);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapSupabaseUserToAuthUser(supabaseUser: {
    id: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
  }): AuthUser {
    if (!supabaseUser.email) {
      throw new Error("User email is missing");
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      createdAt: supabaseUser.created_at
        ? new Date(supabaseUser.created_at)
        : new Date(),
      updatedAt: supabaseUser.updated_at
        ? new Date(supabaseUser.updated_at)
        : new Date(),
    };
  }

  private mapSupabaseSessionToAuthSession(supabaseSession: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    user: {
      id: string;
      email?: string;
      created_at?: string;
      updated_at?: string;
    };
  }): AuthSession {
    const expiresAt = supabaseSession.expires_at
      ? new Date(supabaseSession.expires_at * 1000)
      : new Date(Date.now() + 3600 * 1000);

    return {
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt,
      user: this.mapSupabaseUserToAuthUser(supabaseSession.user),
    };
  }
}
