"use client";

import { useEffect, useState } from "react";

interface User {
  _id: string;
  name?: string;
  email: string;
  image?: string;
  projectRole?: string;
}

interface RolesTabProps {
  projectId: string;
  currentUserId: string;
}

const ROLE_OPTIONS = [
  { value: "project_manager", label: "Project Management" },
  { value: "finance_manager", label: "Finance Management" },
  { value: "admin", label: "Administrator" },
];

export default function RolesTab({ projectId, currentUserId }: RolesTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsersWithRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const usersData = await res.json();
        // For each user, fetch their project role from the new API path
        const usersWithRoles = await Promise.all(
          usersData.map(async (user: User) => {
            const roleRes = await fetch(
              `/api/projects/${projectId}/users/${user._id}/role`
            );
            let projectRole = undefined;
            if (roleRes.ok) {
              const roleData = await roleRes.json();
              projectRole = roleData?.role || undefined;
            }
            return { ...user, projectRole };
          })
        );
        setUsers(usersWithRoles);
      }
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, projectId }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, projectRole: newRole } : u
          )
        );
      } else {
        alert("Failed to update role");
      }
    } catch (error) {
      alert("Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="rounded-lg bg-black p-6 shadow border-2 border-accent-olive">
      <h3 className="mb-4 text-lg font-semibold text-white">Roles</h3>
      {loading ? (
        <p className="text-white">Loading users...</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user._id}
              className="p-4 bg-gray-900 rounded-md border border-accent-olive flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name || user.email}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="text-white font-semibold">
                    {user.name || user.email}
                  </div>
                  <div className="text-white text-xs opacity-70">
                    {user.email}
                  </div>
                </div>
              </div>
              <select
                value={user.projectRole || ""}
                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                disabled={updatingUserId === user._id}
                className="ml-4 px-3 py-2 rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
              >
                <option value="">No Role</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
