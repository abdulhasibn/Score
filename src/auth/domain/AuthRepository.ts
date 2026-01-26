import type { AuthUser } from "./AuthUser";
import type { AuthSession } from "./AuthSession";

/**
 * AuthRepository Interface
 *
 * Defines the contract for authentication operations.
 * This is a pure domain interface with no infrastructure dependencies.
 * Implementations will be provided by the infrastructure layer.
 */
export interface AuthRepository {
  /**
   * Retrieves the currently authenticated user.
   * Returns null if no user is authenticated.
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Retrieves the current authentication session.
   * Returns null if no active session exists.
   */
  getSession(): Promise<AuthSession | null>;

  /**
   * Signs in a user with email and password.
   * Returns the authenticated user and session on success.
   * Throws an error on failure.
   */
  signIn(email: string, password: string): Promise<{
    user: AuthUser;
    session: AuthSession;
  }>;

  /**
   * Signs up a new user with email and password.
   * Returns the newly created user.
   * Throws an error only on actual Supabase errors.
   * Session handling is done by signIn, not signUp.
   */
  signUp(email: string, password: string): Promise<{
    user: AuthUser;
  }>;

  /**
   * Signs out the current user.
   * Clears the current session.
   */
  signOut(): Promise<void>;

  /**
   * Requests a password reset email for the given email address.
   * Always succeeds (does not reveal whether email exists).
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Updates the password for the current authenticated user.
   * Requires a valid reset token/session.
   */
  updatePassword(newPassword: string): Promise<void>;
}
