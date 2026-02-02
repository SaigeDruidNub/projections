import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";

interface Session {
  user?: {
    id: string;
    isAdmin?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ProjectUserType {
  projectId: string;
  userId: string;
  role?: string;
  [key: string]: any;
}

interface UserType {
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  isAdmin?: boolean;
  [key: string]: any;
}

export async function GET(req: Request): Promise<Response> {
  try {
    const session: Session | null = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get projectId from query params
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    const currentUser: UserType | null = await User.findById(session.user.id);
    let isProjectAdmin = false;

    if (projectId) {
      // Check if user is admin for this project
      const { ProjectUser } = require("@/lib/models/ProjectUser");
      const projectUser: ProjectUserType | null = await ProjectUser.findOne({
        projectId,
        userId: session.user.id,
      });
      if (projectUser?.role === "admin") {
        isProjectAdmin = true;
      }
    }

    if (!currentUser?.isAdmin && !isProjectAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users: UserType[] = await User.find()
      .select("name email image createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
