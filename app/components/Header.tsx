import { auth, signOut } from "@/auth";
import Link from "next/link";
import NotificationBell from "./NotificationBell";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";

export default async function Header() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Check if user is admin
  await dbConnect();
  const currentUser = await User.findById(session.user.id).lean();
  const isAdmin = currentUser?.isAdmin || false;

  return (
    <nav className="bg-accent-dark-purple border-b-4 border-accent-dark-orange shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold text-white hover:text-accent-light-orange transition-colors cursor-pointer">
                Projections
              </h1>
            </Link>
            {isAdmin && (
              <Link
                href="/users"
                className="text-sm text-white hover:text-accent-light-orange transition-colors"
              >
                Users
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-white">{session.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-accent-dark-orange border-2 border-white px-3 py-2 text-sm font-medium text-white hover:bg-accent-light-orange transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
