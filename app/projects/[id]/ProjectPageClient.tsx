"use client";
import React, { useState } from "react";
import ProjectForm from "../../components/ProjectForm";
import { Suspense } from "react";
import ProjectTabs from "./ProjectTabs";

interface ProjectPageClientProps {
  data: any;
  id: string;
  currentUserId: string;
}

export default function ProjectPageClient({
  data,
  id,
  currentUserId,
}: ProjectPageClientProps) {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState(data);
  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);

  interface ProjectFormData {
    name: string;
    description: string;
  }

  interface Project {
    name: string;
    description?: string;
    owner: string;
    // Add other fields as needed
  }

  interface ProjectData {
    project: Project;
    projections: any; // Replace 'any' with a more specific type if available
    checkpoints: any; // Replace 'any' with a more specific type if available
  }

  type SetLoadingCb = (loading: boolean) => void;

  const handleUpdate = async (
    formData: ProjectFormData,
    setLoadingCb: SetLoadingCb,
  ): Promise<void> => {
    setLoading(true);
    setLoadingCb(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated: Project = await res.json();
        setProjectData({ ...projectData, project: updated });
        setEditMode(false);
      } else {
        alert("Failed to update project");
      }
    } catch (error) {
      alert("Failed to update project");
    } finally {
      setLoading(false);
      setLoadingCb(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {projectData.project.name}
              </h1>
              {projectData.project.description && (
                <p className="mt-2 text-gray-300">
                  {projectData.project.description}
                </p>
              )}
            </div>
            {!editMode && (
              <button
                className="ml-4 px-4 py-2 bg-accent-light-purple text-white rounded hover:bg-accent-dark-orange transition-colors"
                onClick={handleEdit}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="mb-8">
            <ProjectForm
              initialData={{
                name: projectData.project.name || "",
                description: projectData.project.description || "",
              }}
              loading={loading}
              onSubmit={handleUpdate}
              submitLabel="Save Changes"
              cancelHref="#"
            />
            <button
              className="mt-4 text-sm text-gray-400 hover:text-white underline"
              onClick={handleCancel}
            >
              Cancel Edit
            </button>
          </div>
        ) : null}

        <Suspense
          fallback={
            <div className="text-center py-8 text-white">Loading...</div>
          }
        >
          <ProjectTabs
            projectId={id}
            currentUserId={currentUserId}
            initialProjections={projectData.projections}
            initialCheckpoints={projectData.checkpoints}
          />
        </Suspense>
      </main>
    </div>
  );
}
