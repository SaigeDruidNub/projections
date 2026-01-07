import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { Checkpoint } from "@/lib/models";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { name, description, order } = body;

    if (!name || order === undefined) {
      return NextResponse.json(
        { error: "Name and order are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const checkpoint = await Checkpoint.create({
      projectId,
      name,
      description,
      order,
    });

    return NextResponse.json(checkpoint, { status: 201 });
  } catch (error) {
    console.error("Error creating checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to create checkpoint" },
      { status: 500 }
    );
  }
}
