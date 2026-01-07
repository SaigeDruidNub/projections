import dbConnect from "@/lib/mongodb";
import { ProjectUser } from "@/lib/models/ProjectUser";
import { NextResponse } from "next/server";

interface Params {
  projectId: string;
  userId: string;
}

interface ProjectUserDoc {
  role: string;
  projectId: string;
  userId: string;
}

interface ErrorResponse {
  role: string;
  error: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<Params> }
): Promise<NextResponse<{ role: string } | ErrorResponse>> {
  const { projectId, userId } = await params;
  await dbConnect();
  const mongoose = require("mongoose");

  try {
    const projectObjectId = mongoose.Types.ObjectId.isValid(projectId)
      ? new mongoose.Types.ObjectId(projectId)
      : projectId;
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    console.log("[API DEBUG] Params:", {
      projectId,
      userId,
      projectObjectId,
      userObjectId,
    });
    const projectUser: ProjectUserDoc | null = await ProjectUser.findOne({
      projectId: projectObjectId,
      userId: userObjectId,
    }).lean();
    console.log("[API DEBUG] ProjectUser found:", projectUser);
    if (!projectUser) {
      return NextResponse.json({ role: "none" }, { status: 200 });
    }
    return NextResponse.json({ role: projectUser.role }, { status: 200 });
  } catch (error: any) {
    console.error("[API DEBUG] Error:", error);
    return NextResponse.json(
      { role: "none", error: error.message },
      { status: 500 }
    );
  }
}
