import { getSession } from "@/src/lib/auth/get-session";
import { signOut } from "@/src/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {session?.user?.email || "User"}
        </p>
        <form action={signOut}>
          <Button type="submit" variant="destructive">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
