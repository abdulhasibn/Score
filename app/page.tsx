"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/src/auth/ui/useAuth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { user, status, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      router.replace("/login");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign out failed";
      toast.error(errorMessage);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Score</h1>
      <p className="mt-4 text-muted-foreground">Repository initialized and ready.</p>

      {/* Only render auth-dependent content after hydration to prevent hydration mismatches */}
      {mounted && (
        <>
          {status === "loading" && (
            <div className="mt-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Loading...
              </p>
            </div>
          )}

          {status === "authenticated" && user && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Signed in as: {user.email}
              </p>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}

          {status === "unauthenticated" && (
            <div className="mt-8">
              <Button variant="success" onClick={() => router.push("/login")}>
                Sign In
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
