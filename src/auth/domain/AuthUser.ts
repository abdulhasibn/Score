/**
 * AuthUser Domain Model
 *
 * Represents an authenticated user in the domain layer.
 * This is a pure domain contract with no infrastructure dependencies.
 */
export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
