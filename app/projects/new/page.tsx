"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const project = await res.json();
        // Use replace to avoid browser back button issues
        router.replace(`/projects/${project._id}`);
      } else {
        alert("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-black p-8 shadow-lg border-2 border-accent-olive">
          <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">
            Create New Project
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-black dark:text-white"
              >
                Project Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 shadow-sm focus:border-accent-light-purple focus:outline-none focus:ring-2 focus:ring-accent-light-purple bg-white dark:bg-black text-black dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black dark:text-white"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 shadow-sm focus:border-accent-light-purple focus:outline-none focus:ring-2 focus:ring-accent-light-purple bg-white dark:bg-black text-black dark:text-white"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
              <Link
                href="/dashboard"
                className="rounded-md border-2 border-accent-olive px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-accent-olive hover:text-white transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
