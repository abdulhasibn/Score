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
import { ResetPasswordForm } from "../ResetPasswordForm";
import * as useAuthModule from "../useAuth";
import * as nextNavigation from "next/navigation";
import * as sonner from "sonner";

describe("ResetPasswordForm", () => {
  const mockUpdatePassword = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useAuth mock - only updatePassword method used by ResetPasswordForm
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      updatePassword: mockUpdatePassword,
    } as unknown as ReturnType<typeof useAuthModule.useAuth>);

    // Setup useRouter mock - only replace method used by ResetPasswordForm
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  const getValidFormData = () => ({
    password: "Test123!@#",
    confirmPassword: "Test123!@#",
  });

  const fillForm = async (data: { password: string; confirmPassword: string }) => {
    const user = userEvent.setup();

    const passwordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.clear(passwordInput);
    await user.type(passwordInput, data.password);

    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, data.confirmPassword);
  };

  describe("Valid password", () => {
    it("calls updatePassword, shows success toast, and redirects to login", async () => {
      const data = getValidFormData();
      mockUpdatePassword.mockResolvedValue(undefined);

      render(<ResetPasswordForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith(data.password);
        expect(sonner.toast.success).toHaveBeenCalled();
        const successCall = vi.mocked(sonner.toast.success).mock.calls[0][0];
        expect(successCall).toMatch(/password.*updated|updated.*password/i);
      });

      // Wait for redirect after setTimeout delay (2000ms)
      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith("/login");
          expect(mockReplace).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Weak password", () => {
    it("does not call updatePassword when password is too short", async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /update password/i });

      const user = userEvent.setup();
      await user.type(passwordInput, "short");
      await user.type(confirmPasswordInput, "short");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePassword).not.toHaveBeenCalled();
      });
    });

    it("does not call updatePassword when passwords do not match", async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /update password/i });

      const user = userEvent.setup();
      await user.type(passwordInput, "Test123!@#");
      await user.type(confirmPasswordInput, "Different123!@#");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePassword).not.toHaveBeenCalled();
      });
    });
  });

  describe("updatePassword failure", () => {
    it("shows error toast and does not redirect when updatePassword throws", async () => {
      const data = getValidFormData();
      mockUpdatePassword.mockRejectedValue(new Error("Password update failed"));

      render(<ResetPasswordForm />);
      await fillForm(data);

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith(data.password);
        expect(sonner.toast.error).toHaveBeenCalled();
        const errorCall = vi.mocked(sonner.toast.error).mock.calls[0][0];
        expect(errorCall).toMatch(/password|update|failed/i);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });
});
