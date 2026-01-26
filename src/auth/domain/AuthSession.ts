import type { AuthUser } from "./AuthUser";

/**
 * AuthSession Domain Model
 *
 * Represents an active authentication session.
 * This is a pure domain contract with no infrastructure dependencies.
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: AuthUser;
}
