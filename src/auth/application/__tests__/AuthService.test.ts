import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../AuthService";
import type { AuthRepository } from "../../domain/AuthRepository";
import type { AuthSession } from "../../domain/AuthSession";
import type { AuthUser } from "../../domain/AuthUser";

type AuthErrorWithCode = Error & { code?: string };

const mockUser: AuthUser = {
  id: "user-1",
  email: "test@example.com",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const mockSession: AuthSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: new Date("2026-01-01T01:00:00.000Z"),
  user: mockUser,
};

function createMockAuthRepository(
  overrides: Partial<AuthRepository> = {}
): AuthRepository {
  return {
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    ...overrides,
  };
}

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    it("returns repository result unchanged on success", async () => {
      const signIn = vi.fn().mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      const authRepository = createMockAuthRepository({ signIn });
      const authService = new AuthService(authRepository);

      const result = await authService.signIn("test@example.com", "Password123!");

      expect(signIn).toHaveBeenCalledWith("test@example.com", "Password123!");
      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("wraps repository errors with application context", async () => {
      const signIn = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
      const authRepository = createMockAuthRepository({ signIn });
      const authService = new AuthService(authRepository);

      await expect(
        authService.signIn("test@example.com", "Password123!")
      ).rejects.toThrow("Sign in failed: Invalid credentials");
    });

    it.each(["email_not_confirmed", "invalid_login_credentials"] as const)(
      "preserves error code '%s' while wrapping message",
      async (errorCode) => {
        const repositoryError = Object.assign(
          new Error("Auth provider error"),
          {
            code: errorCode,
          }
        );
        const signIn = vi.fn().mockRejectedValue(repositoryError);
        const authRepository = createMockAuthRepository({ signIn });
        const authService = new AuthService(authRepository);

        try {
          await authService.signIn("test@example.com", "Password123!");
          throw new Error("Expected signIn to throw");
        } catch (error) {
          const authError = error as AuthErrorWithCode;
          expect(authError.message).toBe("Sign in failed: Auth provider error");
          expect(authError.code).toBe(errorCode);
        }
      }
    );

    it("throws wrapped error safely when repository error has no code", async () => {
      const signIn = vi.fn().mockRejectedValue(new Error("Network failure"));
      const authRepository = createMockAuthRepository({ signIn });
      const authService = new AuthService(authRepository);

      try {
        await authService.signIn("test@example.com", "Password123!");
        throw new Error("Expected signIn to throw");
      } catch (error) {
        const authError = error as AuthErrorWithCode;
        expect(authError.message).toBe("Sign in failed: Network failure");
        expect(authError.code).toBeUndefined();
      }
    });
  });

  describe("signUp", () => {
    it("returns repository result unchanged on success", async () => {
      const signUp = vi.fn().mockResolvedValue({
        user: mockUser,
      });
      const authRepository = createMockAuthRepository({ signUp });
      const authService = new AuthService(authRepository);

      const result = await authService.signUp(
        "test@example.com",
        "Password123!"
      );

      expect(signUp).toHaveBeenCalledWith("test@example.com", "Password123!");
      expect(result).toEqual({
        user: mockUser,
      });
    });

    it("preserves coded repository errors for signUp", async () => {
      const repositoryError = Object.assign(new Error("User already registered"), {
        code: "user_already_exists",
      });
      const signUp = vi.fn().mockRejectedValue(repositoryError);
      const authRepository = createMockAuthRepository({ signUp });
      const authService = new AuthService(authRepository);

      try {
        await authService.signUp("test@example.com", "Password123!");
        throw new Error("Expected signUp to throw");
      } catch (error) {
        const authError = error as AuthErrorWithCode;
        expect(authError.message).toBe("User already registered");
        expect(authError.code).toBe("user_already_exists");
      }
    });

    it("wraps unknown signUp errors safely", async () => {
      const signUp = vi.fn().mockRejectedValue("unexpected");
      const authRepository = createMockAuthRepository({ signUp });
      const authService = new AuthService(authRepository);

      await expect(
        authService.signUp("test@example.com", "Password123!")
      ).rejects.toThrow("Sign up failed: Unknown error");
    });
  });
});
