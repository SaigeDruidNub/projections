"use client";

import { useState } from "react";

type ProjectFormData = {
  name: string;
  description: string;
};

interface ProjectFormProps {
  initialData?: ProjectFormData;
  loading?: boolean;
  onSubmit: (
    formData: ProjectFormData,
    setLoading: (loading: boolean) => void
  ) => Promise<void>;
  submitLabel?: string;
  cancelHref?: string;
}

export default function ProjectForm({
  initialData = { name: "", description: "" },
  loading: loadingProp = false,
  onSubmit,
  submitLabel = "Create Project",
  cancelHref = "/dashboard",
}: ProjectFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(loadingProp);

  interface HandleSubmitEvent extends React.FormEvent<HTMLFormElement> {}

  const handleSubmit = async (e: HandleSubmitEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData, setLoading);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Project Name
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 shadow-sm focus:border-accent-light-purple focus:outline-none focus:ring-2 focus:ring-accent-light-purple bg-black text-white"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-white"
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
          className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 shadow-sm focus:border-accent-light-purple focus:outline-none focus:ring-2 focus:ring-accent-light-purple bg-black text-white"
        />
      </div>
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange transition-colors disabled:opacity-50"
        >
          {loading
            ? submitLabel === "Create Project"
              ? "Creating..."
              : "Saving..."
            : submitLabel}
        </button>
        <a
          href={cancelHref}
          className="rounded-md border-2 border-accent-olive px-4 py-2 text-sm font-medium text-white hover:bg-accent-olive hover:text-white transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
