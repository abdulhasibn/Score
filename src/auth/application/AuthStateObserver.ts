import type { AuthUser } from "../domain/AuthUser";
import type { AuthSession } from "../domain/AuthSession";

/**
 * Authentication state status
 */
export type AuthStatus = "authenticated" | "unauthenticated" | "loading";

/**
 * Authentication state
 */
export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  status: AuthStatus;
}

/**
 * Listener function for auth state changes
 */
export type AuthStateListener = (state: AuthState) => void;

/**
 * AuthStateObserver
 *
 * Provider-agnostic interface for observing authentication state changes.
 * Implementations are responsible for subscribing to their specific auth provider
 * and mapping provider-specific types to domain types.
 *
 * This abstraction enables the Open/Closed Principle:
 * - Open for extension: New providers can implement this interface
 * - Closed for modification: Consumers depend on this stable contract
 */
export interface AuthStateObserver {
  /**
   * Gets the current authentication state snapshot (read-only)
   */
  getSnapshot(): AuthState;

  /**
   * Subscribes to authentication state changes
   * @param listener Function called whenever auth state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: AuthStateListener): () => void;

  /**
   * Disposes the observer and cleans up all subscriptions
   */
  dispose(): void;
}
