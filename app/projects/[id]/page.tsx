import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import ProjectTabs from "./ProjectTabs";

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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const { id } = await params;
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

  return (
    <div className="min-h-screen bg-black">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{data.project.name}</h1>
          {data.project.description && (
            <p className="mt-2 text-gray-300">{data.project.description}</p>
          )}
        </div>

        <Suspense
          fallback={
            <div className="text-center py-8 text-white">Loading...</div>
          }
        >
          <ProjectTabs
            projectId={id}
            currentUserId={session.user.id}
            initialProjections={data.projections}
            initialCheckpoints={data.checkpoints}
          />
        </Suspense>
      </main>
    </div>
  );
}
