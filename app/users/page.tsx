import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/app/components/Header";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";

async function getUsers() {
  try {
    await dbConnect();
    const users = await User.find()
      .select("name email image createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return users.map((user) => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UsersPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  await dbConnect();
  const currentUser = await User.findById(session.user.id).lean();

  if (!currentUser?.isAdmin) {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Users
          </h1>
          <p className="mt-2 text-black dark:text-white opacity-70">
            All registered users in the system
          </p>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black dark:text-white opacity-60">
              No users found
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-black shadow-sm rounded-lg overflow-hidden border-2 border-accent-olive">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-accent-olive">
                <thead className="bg-accent-light-purple">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-black divide-y divide-accent-olive">
                  {users.map((user: any) => (
                    <tr
                      key={user._id}
                      className="hover:bg-accent-olive hover:bg-opacity-10"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.image && (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.image}
                              alt={user.name || "User"}
                            />
                          )}
                          {!user.image && (
                            <div className="h-10 w-10 rounded-full bg-accent-light-purple flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-black dark:text-white">
                              {user.name || "Anonymous"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black dark:text-white">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white opacity-70">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-accent-olive bg-opacity-10 px-6 py-3 border-t-2 border-accent-olive">
              <p className="text-sm text-black dark:text-white">
                Total: <span className="font-medium">{users.length}</span> user
                {users.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
