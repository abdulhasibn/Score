import { getSession } from "@/src/lib/auth/get-session";
import { signOut } from "@/src/lib/auth/actions";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {session?.user?.email || "User"}
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
