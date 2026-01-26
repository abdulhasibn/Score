import { useState, useEffect } from "react";
import { authService, authStateObserver } from "../index";
import type { AuthState } from "../application/AuthStateObserver";

/**
 * useAuth
 *
 * React hook that bridges React components to the authentication system.
 * Subscribes to AuthStateObserver for reactive state updates and delegates
 * actions to AuthService.
 *
 * This hook is intentionally thin - it performs no business logic and serves
 * only as an adapter between React and the authentication system.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>(() =>
    authStateObserver.getSnapshot()
  );

  useEffect(() => {
    const unsubscribe = authStateObserver.subscribe((newState: AuthState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return await authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string) => {
    return await authService.signUp(email, password);
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const requestPasswordReset = async (email: string) => {
    await authService.requestPasswordReset(email);
  };

  const updatePassword = async (newPassword: string) => {
    await authService.updatePassword(newPassword);
  };

  return {
    user: state.user,
    session: state.session,
    status: state.status,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  };
}
