"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * RequireAuth
 *
 * Route protection component for Next.js App Router.
 * Redirects unauthenticated users to /login and renders children for authenticated users.
 *
 * This component depends only on the useAuth hook and Next.js navigation,
 * maintaining separation from infrastructure details.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
