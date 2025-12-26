import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import dbConnect from "@/lib/mongodb";
import { Project } from "@/lib/models";

async function getProjects() {
  const session = await auth();

  if (!session) return [];

  try {
    await dbConnect();
    const projects = await Project.find().sort({ createdAt: -1 }).lean();

    // Convert MongoDB documents to plain objects with string IDs
    return projects.map((project) => ({
      ...project,
      _id: project._id.toString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Projects
          </h2>
          <Link
            href="/projects/new"
            className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange transition-colors"
          >
            Create Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black dark:text-white">
              No projects yet. Create your first project to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="block rounded-lg bg-white dark:bg-black p-6 shadow-sm border-2 border-accent-olive hover:border-accent-light-purple transition-all hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-2 text-sm text-black dark:text-white opacity-70">
                    {project.description}
                  </p>
                )}
                <p className="mt-4 text-xs text-black dark:text-white opacity-60">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
