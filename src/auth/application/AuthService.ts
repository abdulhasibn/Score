import type { AuthRepository } from "../domain/AuthRepository";
import type { AuthUser } from "../domain/AuthUser";
import type { AuthSession } from "../domain/AuthSession";

/**
 * AuthService
 *
 * Application-layer service that orchestrates authentication use-cases.
 * Delegates to AuthRepository (infrastructure) via dependency inversion.
 *
 * This service provides a clean application API for UI components and hooks
 * without exposing infrastructure details.
 */
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Retrieves the currently authenticated user.
   * Returns null if no user is authenticated.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      return await this.authRepository.getCurrentUser();
    } catch (error) {
      throw new Error(
        `Failed to retrieve current user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieves the current authentication session.
   * Returns null if no active session exists.
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      return await this.authRepository.getSession();
    } catch (error) {
      throw new Error(
        `Failed to retrieve session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Signs in a user with email and password.
   * Returns the authenticated user and session on success.
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser; session: AuthSession }> {
    try {
      return await this.authRepository.signIn(email, password);
    } catch (error) {
      // Wrap repository errors with application context
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Sign in failed: ${errorMessage}`);
    }
  }

  /**
   * Signs up a new user with email and password.
   * Returns the newly created user.
   * Session handling is done by signIn, not signUp.
   */
  async signUp(
    email: string,
    password: string
  ): Promise<{ user: AuthUser }> {
    try {
      return await this.authRepository.signUp(email, password);
    } catch (error) {
      // If error already has a descriptive message, rethrow it as-is
      // Otherwise, wrap it with context
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error(
        `Sign up failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Signs out the current user.
   * Clears the current session.
   */
  async signOut(): Promise<void> {
    try {
      await this.authRepository.signOut();
    } catch (error) {
      throw new Error(
        `Sign out failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Requests a password reset email.
   * Always succeeds to prevent email enumeration.
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.authRepository.requestPasswordReset(email);
    } catch {
      // Always succeed - don't reveal if email exists
      // Error is logged in repository but not thrown
    }
  }

  /**
   * Updates the password for the current authenticated user.
   * Requires a valid reset token/session from the reset link.
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      await this.authRepository.updatePassword(newPassword);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to update password: ${errorMessage}`);
    }
  }
}
