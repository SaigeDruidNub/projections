"use client";

import { useRouter } from "next/navigation";
import ProjectForm from "../../components/ProjectForm";

export default function NewProject() {
  const router = useRouter();

  interface ProjectFormData {
    name: string;
    description: string;
  }

  interface Project {
    _id: string;
    name: string;
    description: string;
    // Add other fields if needed
  }

  type SetLoading = (loading: boolean) => void;

  const handleSubmit = async (
    formData: ProjectFormData,
    setLoading: SetLoading
  ): Promise<void> => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const project: Project = await res.json();
        router.replace(`/projects/${project._id}`);
      } else {
        alert("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-black p-8 shadow-lg border-2 border-accent-olive">
          <h1 className="mb-6 text-2xl font-bold text-white">
            Create New Project
          </h1>
          <ProjectForm
            initialData={{ name: "", description: "" }}
            onSubmit={handleSubmit}
            submitLabel="Create Project"
            cancelHref="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
