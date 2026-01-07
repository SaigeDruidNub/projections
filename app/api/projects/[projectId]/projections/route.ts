import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { Projection, CheckpointProjection } from "@/lib/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    await dbConnect();
    const projections = await Projection.find({ projectId }).sort({
      createdAt: -1,
    });

    return NextResponse.json(projections);
  } catch (error) {
    console.error("Error fetching projections:", error);
    return NextResponse.json(
      { error: "Failed to fetch projections" },
      { status: 500 }
    );
  }
}

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
    const { name, data, filename, rowCount, columnCount, type } = body;

    if (!name || !data || !type) {
      return NextResponse.json(
        { error: "Name, data, and type are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const projection = await Projection.create({
      projectId,
      name,
      data: JSON.stringify(data),
      filename,
      rowCount,
      columnCount,
      type,
    });

    return NextResponse.json(projection, { status: 201 });
  } catch (error) {
    console.error("Error creating projection:", error);
    return NextResponse.json(
      { error: "Failed to create projection" },
      { status: 500 }
    );
  }
}
