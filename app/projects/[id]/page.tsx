import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProjectTabs from "./ProjectTabs";
import { Suspense } from "react";
import ProjectPageClient from "./ProjectPageClient";
// Removed dynamic import to fix build error

async function getProjectData(id: string) {
  // Import models directly to avoid fetch timing issues
  const dbConnect = (await import("@/lib/mongodb")).default;
  const { Project, Projection, Checkpoint } = await import("@/lib/models");

  try {
    await dbConnect();

    const project = await Project.findById(id).lean();
    if (!project) return null;

    const projections = await Projection.find({ projectId: id })
      .sort({ createdAt: -1 })
      .lean();
    const checkpoints = await Checkpoint.find({ projectId: id })
      .sort({ order: 1 })
      .lean();

    return {
      project: JSON.parse(JSON.stringify(project)),
      projections: JSON.parse(JSON.stringify(projections)),
      checkpoints: JSON.parse(JSON.stringify(checkpoints)),
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

interface ProjectPageWrapperProps {
  params: {
    id: string;
    [key: string]: any;
  };
}

export default async function ProjectPageWrapper(
  props: ProjectPageWrapperProps
) {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }
  const params = await props.params;
  const { id } = params;
  const data = await getProjectData(id);
  if (!data) {
    return (
      <div className="min-h-screen bg-black py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-2xl font-bold text-white">Project not found</h1>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-accent-light-purple hover:text-accent-dark-orange transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return <ProjectPageClient data={data} id={id} />;
}

interface ProjectData {
  project: {
    _id: string;
    name: string;
    description?: string;
    owner: string;
    [key: string]: any;
  };
  projections: any[];
  checkpoints: any[];
}
