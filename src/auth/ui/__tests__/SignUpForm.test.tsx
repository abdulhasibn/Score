import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE any imports that might use them
vi.mock("../useAuth");
vi.mock("next/navigation");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../SignUpForm";
import * as useAuthModule from "../useAuth";
import * as nextNavigation from "next/navigation";
import * as sonner from "sonner";

describe("SignUpForm", () => {
  const mockSignUp = vi.fn();
  const mockSignIn = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useAuth mock - only methods used by SignUpForm
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      signUp: mockSignUp,
      signIn: mockSignIn,
    } as unknown as ReturnType<typeof useAuthModule.useAuth>);

    // Setup useRouter mock - only replace method used by SignUpForm
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  const getValidFormData = () => ({
    email: "test@example.com",
    password: "Test123!@#",
    confirmPassword: "Test123!@#",
  });

  const fillForm = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.clear(emailInput);
    await user.type(emailInput, data.email);

    await user.clear(passwordInput);
    await user.type(passwordInput, data.password);

    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, data.confirmPassword);
  };

  describe("New user - confirmation required", () => {
    it("shows success toast and does not attempt sign-in when signUp succeeds", async () => {
      const data = getValidFormData();
      mockSignUp.mockResolvedValue({ user: { id: "1", email: data.email } });

      render(<SignUpForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(data.email, data.password);
        expect(mockSignIn).not.toHaveBeenCalled();
        expect(sonner.toast.success).toHaveBeenCalled();
        const successCall = vi.mocked(sonner.toast.success).mock.calls[0][0];
        expect(successCall).toMatch(/account created/i);
        expect(successCall).toMatch(/email/i);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe("Existing confirmed user", () => {
    it("shows info toast and redirects when signIn succeeds", async () => {
      const data = getValidFormData();
      mockSignUp.mockRejectedValue(
        Object.assign(new Error("User already registered"), {
          code: "user_already_exists",
        })
      );
      mockSignIn.mockResolvedValue({
        user: { id: "1", email: data.email },
        session: {
          accessToken: "token",
          refreshToken: "refresh",
          expiresAt: new Date(),
          user: { id: "1", email: data.email },
        },
      });

      render(<SignUpForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(data.email, data.password);
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.info).toHaveBeenCalled();
        const infoCall = vi.mocked(sonner.toast.info).mock.calls[0][0];
        expect(infoCall).toMatch(/signing/i);
        expect(mockReplace).toHaveBeenCalledWith("/");
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Existing unconfirmed user", () => {
    it("shows error toast and redirects to login when signIn throws email_not_confirmed", async () => {
      const data = getValidFormData();
      mockSignUp.mockRejectedValue(
        Object.assign(new Error("User already registered"), {
          code: "user_already_exists",
        })
      );
      mockSignIn.mockRejectedValue(
        Object.assign(new Error("Email not confirmed"), {
          code: "email_not_confirmed",
        })
      );

      render(<SignUpForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(data.email, data.password);
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.error).toHaveBeenCalled();
        const errorCall = vi.mocked(sonner.toast.error).mock.calls[0][0];
        expect(errorCall).toMatch(/confirm.*email/i);
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });

    it("shows incorrect password error and redirects to login on invalid credentials", async () => {
      const data = getValidFormData();
      mockSignUp.mockRejectedValue(
        Object.assign(new Error("User already registered"), {
          code: "user_already_exists",
        })
      );
      mockSignIn.mockRejectedValue(
        Object.assign(new Error("Invalid login credentials"), {
          code: "invalid_login_credentials",
        })
      );

      render(<SignUpForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(data.email, data.password);
        expect(mockSignIn).toHaveBeenCalledWith(data.email, data.password);
        expect(sonner.toast.error).toHaveBeenCalledWith(
          "Incorrect password. Please try again."
        );
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Validation failure", () => {
    it("does not call signUp or signIn when email is invalid", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /sign up/i });

      const user = userEvent.setup();
      await user.type(emailInput, "invalid-email");
      await user.type(passwordInput, "Test123!@#");
      await user.type(confirmPasswordInput, "Test123!@#");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled();
        expect(mockSignIn).not.toHaveBeenCalled();
        expect(sonner.toast.error).toHaveBeenCalled();
      });
    });

    it("does not call signUp or signIn when passwords do not match", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /sign up/i });

      const user = userEvent.setup();
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Test123!@#");
      await user.type(confirmPasswordInput, "Different123!@#");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled();
        expect(mockSignIn).not.toHaveBeenCalled();
        expect(sonner.toast.error).toHaveBeenCalled();
      });
    });

    it("does not call signUp or signIn when password does not meet requirements", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /sign up/i });

      const user = userEvent.setup();
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "weak");
      await user.type(confirmPasswordInput, "weak");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled();
        expect(mockSignIn).not.toHaveBeenCalled();
        expect(sonner.toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("SignUp failure", () => {
    it("shows error toast and does not call signIn when signUp throws", async () => {
      const data = getValidFormData();
      mockSignUp.mockRejectedValue(new Error("Sign up failed"));

      render(<SignUpForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(data.email, data.password);
        expect(mockSignIn).not.toHaveBeenCalled();
        expect(sonner.toast.error).toHaveBeenCalled();
        const errorCall = vi.mocked(sonner.toast.error).mock.calls[0][0];
        expect(errorCall).toMatch(/unable.*account|try again/i);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });
});
