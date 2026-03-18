import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { ProjectUser } from "@/lib/models/ProjectUser";
import { User } from "@/lib/models";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { projectId, role } = await req.json();
    if (!projectId || !role) {
      return NextResponse.json(
        { error: "Project and role required" },
        { status: 400 },
      );
    }

    // Allow global admins and project admins to change project roles.
    const currentUser = await User.findById(session.user.id);
    let isProjectAdmin = false;

    if (!currentUser?.isAdmin) {
      const currentProjectUser = await ProjectUser.findOne({
        projectId,
        userId: session.user.id,
      });
      isProjectAdmin = currentProjectUser?.role === "admin";
    }

    if (!currentUser?.isAdmin && !isProjectAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;

    // Upsert the ProjectUser document
    const projectUser = await ProjectUser.findOneAndUpdate(
      { userId, projectId },
      { role },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json(projectUser);
  } catch (error) {
    console.error("Error updating project user role:", error);
    return NextResponse.json(
      { error: "Failed to update project user role" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Project required" }, { status: 400 });
    }
    await dbConnect();
    const { userId } = await params;
    const projectUser = await ProjectUser.findOne({
      userId,
      projectId,
    });
    return NextResponse.json(projectUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch project user role" },
      { status: 500 },
    );
  }
}
