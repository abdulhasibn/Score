import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE any imports that might use them
vi.mock("../useAuth");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "../ForgotPasswordForm";
import * as useAuthModule from "../useAuth";
import * as sonner from "sonner";

describe("ForgotPasswordForm", () => {
  const mockRequestPasswordReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useAuth mock - only requestPasswordReset method used by ForgotPasswordForm
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
    } as unknown as ReturnType<typeof useAuthModule.useAuth>);
  });

  describe("Valid email", () => {
    it("calls requestPasswordReset and shows success toast", async () => {
      const email = "test@example.com";
      mockRequestPasswordReset.mockResolvedValue(undefined);

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      const user = userEvent.setup();
      await user.type(emailInput, email);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith(email);
        expect(sonner.toast.success).toHaveBeenCalled();
        const successCall = vi.mocked(sonner.toast.success).mock.calls[0][0];
        expect(successCall).toMatch(/reset|link|sent/i);
      });
    });

    it("shows success toast even when requestPasswordReset throws", async () => {
      const email = "test@example.com";
      mockRequestPasswordReset.mockRejectedValue(new Error("Failed"));

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      const user = userEvent.setup();
      await user.type(emailInput, email);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith(email);
        expect(sonner.toast.success).toHaveBeenCalled();
        const successCall = vi.mocked(sonner.toast.success).mock.calls[0][0];
        expect(successCall).toMatch(/reset|link|sent/i);
      });
    });
  });

  describe("Invalid email", () => {
    it("does not call requestPasswordReset when email is invalid", async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      const user = userEvent.setup();
      await user.type(emailInput, "invalid-email");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordReset).not.toHaveBeenCalled();
      });
    });
  });

  describe("Empty email", () => {
    it("does not call requestPasswordReset when email is empty", async () => {
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      const user = userEvent.setup();
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordReset).not.toHaveBeenCalled();
      });
    });
  });
});
