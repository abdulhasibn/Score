import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE any imports that might use them
vi.mock("../useAuth");
vi.mock("next/navigation");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../SignInForm";
import * as useAuthModule from "../useAuth";
import * as nextNavigation from "next/navigation";
import * as sonner from "sonner";

describe("SignInForm", () => {
  const mockSignIn = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useAuth mock - only signIn method used by SignInForm
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      signIn: mockSignIn,
    } as unknown as ReturnType<typeof useAuthModule.useAuth>);

    // Setup useRouter mock - only replace method used by SignInForm
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  const getValidFormData = () => ({
    email: "test@example.com",
    password: "Test123!@#",
  });

  const fillForm = async (data: { email: string; password: string }) => {
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.clear(emailInput);
    await user.type(emailInput, data.email);

    await user.clear(passwordInput);
    await user.type(passwordInput, data.password);
  };

  describe("Successful sign-in", () => {
    it("shows success toast and redirects when signIn succeeds", async () => {
      const data = getValidFormData();
      mockSignIn.mockResolvedValue({
        user: { id: "1", email: data.email },
        session: {
          accessToken: "token",
          refreshToken: "refresh",
          expiresAt: new Date(),
          user: { id: "1", email: data.email },
        },
      });

      render(<SignInForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.success).toHaveBeenCalled();
        const successCall = vi.mocked(sonner.toast.success).mock.calls[0][0];
        expect(successCall).toMatch(/signed in/i);
        expect(mockReplace).toHaveBeenCalledWith("/");
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Invalid credentials", () => {
    it("shows error toast and does not redirect when signIn throws invalid_login_credentials", async () => {
      const data = getValidFormData();
      mockSignIn.mockRejectedValue(
        Object.assign(new Error("Invalid login credentials"), {
          code: "invalid_login_credentials",
        })
      );

      render(<SignInForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.error).toHaveBeenCalled();
        const errorCall = vi.mocked(sonner.toast.error).mock.calls[0][0];
        expect(errorCall).toMatch(/invalid|credentials/i);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe("Email not confirmed", () => {
    it("shows error toast and does not redirect when signIn throws email_not_confirmed", async () => {
      const data = getValidFormData();
      mockSignIn.mockRejectedValue(
        Object.assign(new Error("Email not confirmed"), {
          code: "email_not_confirmed",
        })
      );

      render(<SignInForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.error).toHaveBeenCalled();
        const errorCall = vi.mocked(sonner.toast.error).mock.calls[0][0];
        expect(errorCall).toMatch(/email|confirm/i);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe("Unexpected error", () => {
    it("shows error toast and does not redirect when signIn throws generic error", async () => {
      const data = getValidFormData();
      mockSignIn.mockRejectedValue(new Error("Sign in failed"));

      render(<SignInForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.error).toHaveBeenCalled();
        const errorCall = vi.mocked(sonner.toast.error).mock.calls[0][0];
        expect(errorCall).toMatch(/sign in|failed/i);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe("Validation failures", () => {
    it("does not call signIn when email is invalid", async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      const user = userEvent.setup();
      await user.type(emailInput, "invalid-email");
      await user.type(passwordInput, "Test123!@#");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).not.toHaveBeenCalled();
      });
    });

    it("does not call signIn when password is empty", async () => {
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      const user = userEvent.setup();
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).not.toHaveBeenCalled();
      });
    });
  });
});
