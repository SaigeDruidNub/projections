import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { ProjectUser } from "@/lib/models/ProjectUser";
import { User } from "@/lib/models";

export async function PATCH(
  req: Request,
  context: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Only allow admins to change roles (or project owner, if you want to add that logic)
    const currentUser = await User.findById(session.user.id);
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { projectId, role } = await req.json();
    if (!projectId || !role) {
      return NextResponse.json(
        { error: "Project and role required" },
        { status: 400 }
      );
    }

    // Defensive: unwrap params if it's a Promise (should not be in Next.js route handlers)
    const userId =
      context.params && typeof context.params.then === "function"
        ? await context.params.then((p: any) => p.userId)
        : context.params.userId;

    // Upsert the ProjectUser document
    const projectUser = await ProjectUser.findOneAndUpdate(
      { userId, projectId },
      { role },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(projectUser);
  } catch (error) {
    console.error("Error updating project user role:", error);
    return NextResponse.json(
      { error: "Failed to update project user role" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  context: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Project required" }, { status: 400 });
    }
    await dbConnect();
    const userId =
      context.params && typeof context.params.then === "function"
        ? await context.params.then((p: any) => p.userId)
        : context.params.userId;
    const projectUser = await ProjectUser.findOne({
      userId,
      projectId,
    });
    return NextResponse.json(projectUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch project user role" },
      { status: 500 }
    );
  }
}
