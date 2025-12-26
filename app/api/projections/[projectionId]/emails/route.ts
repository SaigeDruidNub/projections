import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { ProjectionEmail } from "@/lib/models/ProjectionEmail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { projectionId } = await params;

    // Get email history for this projection
    const emailHistory = await ProjectionEmail.find({ projectionId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(emailHistory);
  } catch (error: any) {
    console.error("Error fetching email history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch email history" },
      { status: 500 }
    );
  }
}
