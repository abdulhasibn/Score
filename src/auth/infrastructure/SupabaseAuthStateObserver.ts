import { supabaseClient } from "../../lib/supabaseClient";
import type { AuthStateObserver } from "../application/AuthStateObserver";
import type { AuthState } from "../application/AuthStateObserver";
import type { AuthUser } from "../domain/AuthUser";
import type { AuthSession } from "../domain/AuthSession";

/**
 * Supabase session type (internal use only)
 */
type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
  };
} | null;

/**
 * SupabaseAuthStateObserver
 *
 * Infrastructure implementation of AuthStateObserver using Supabase.
 * Subscribes to Supabase auth state changes and maps them to domain types.
 *
 * All Supabase-specific logic is isolated within this class.
 */
export class SupabaseAuthStateObserver implements AuthStateObserver {
  private state: AuthState = {
    user: null,
    session: null,
    status: "loading",
  };

  private listeners: Set<(state: AuthState) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  getSnapshot(): AuthState {
    return { ...this.state };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }

  private initialize(): void {
    const { data } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        await this.handleAuthStateChange(event, session);
      }
    );

    this.unsubscribe = () => {
      data.subscription.unsubscribe();
    };
  }

  private async handleAuthStateChange(
    event: string,
    supabaseSession: SupabaseSession
  ): Promise<void> {
    if (supabaseSession) {
      const user = this.mapSupabaseUserToAuthUser(supabaseSession.user);
      const session = this.mapSupabaseSessionToAuthSession(supabaseSession);

      this.updateState({
        user,
        session,
        status: "authenticated",
      });
    } else {
      this.updateState({
        user: null,
        session: null,
        status: "unauthenticated",
      });
    }
  }

  private updateState(newState: AuthState): void {
    this.state = newState;
    this.listeners.forEach((listener) => listener(this.getSnapshot()));
  }

  private mapSupabaseUserToAuthUser(
    supabaseUser: {
      id: string;
      email?: string;
      created_at?: string;
      updated_at?: string;
    }
  ): AuthUser {
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

  private mapSupabaseSessionToAuthSession(
    supabaseSession: NonNullable<SupabaseSession>
  ): AuthSession {
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
