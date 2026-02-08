import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSignUp } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
}));

vi.mock("../../../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import { SupabaseAuthRepository } from "../SupabaseAuthRepository";

describe("SupabaseAuthRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("returns mapped user for first-time signups with identities", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "new@example.com",
            created_at: "2026-02-08T00:00:00.000Z",
            updated_at: "2026-02-08T00:00:00.000Z",
            identities: [{ id: "identity-1" }],
          },
        },
        error: null,
      });

      const repository = new SupabaseAuthRepository();
      const result = await repository.signUp("new@example.com", "Password123!");

      expect(result.user.id).toBe("user-1");
      expect(result.user.email).toBe("new@example.com");
    });

    it("throws user_already_exists when signup response is obfuscated (identities empty)", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: {
            id: "user-existing",
            email: "existing@example.com",
            created_at: "2026-02-08T00:00:00.000Z",
            updated_at: "2026-02-08T00:00:00.000Z",
            identities: [],
          },
        },
        error: null,
      });

      const repository = new SupabaseAuthRepository();

      await expect(
        repository.signUp("existing@example.com", "Password123!")
      ).rejects.toMatchObject({
        message: "User already registered",
        code: "user_already_exists",
      });
    });

    it("normalizes explicit duplicate errors to user_already_exists", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: {
          message: "User already registered",
          code: "user_already_exists",
        },
      });

      const repository = new SupabaseAuthRepository();

      await expect(
        repository.signUp("existing@example.com", "Password123!")
      ).rejects.toMatchObject({
        message: "User already registered",
        code: "user_already_exists",
      });
    });

    it("normalizes duplicate-email message fallback to user_already_exists", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: {
          message: "A user with this email address has already been registered",
        },
      });

      const repository = new SupabaseAuthRepository();

      await expect(
        repository.signUp("existing@example.com", "Password123!")
      ).rejects.toMatchObject({
        code: "user_already_exists",
      });
    });
  });
});
