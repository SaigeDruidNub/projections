import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import {
  CheckpointProjection,
  Approval,
  Checkpoint,
  Projection,
} from "@/lib/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkpointId } = await params;
    await dbConnect();

    const checkpointProjections = await CheckpointProjection.find({
      checkpointId,
    });

    // Get all projections and approvals for this checkpoint
    const projectionIds = checkpointProjections.map((cp) => cp.projectionId);
    const projections = await Projection.find({ _id: { $in: projectionIds } });

    const enrichedData = await Promise.all(
      checkpointProjections.map(async (cp) => {
        const projection = projections.find(
          (p) => p._id.toString() === cp.projectionId
        );
        const approvals = await Approval.find({
          checkpointProjectionId: cp._id.toString(),
        });

        return {
          checkpointProjection: cp,
          projection,
          approvals,
        };
      })
    );

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching checkpoint projections:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkpoint projections" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ checkpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkpointId } = await params;
    const body = await request.json();
    const { projectionId } = body;

    if (!projectionId) {
      return NextResponse.json(
        { error: "Projection ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if already exists
    const existing = await CheckpointProjection.findOne({
      checkpointId,
      projectionId,
    });
    if (existing) {
      return NextResponse.json(
        { error: "Projection already added to this checkpoint" },
        { status: 400 }
      );
    }

    const checkpointProjection = await CheckpointProjection.create({
      checkpointId,
      projectionId,
      status: "pending",
    });

    return NextResponse.json(checkpointProjection, { status: 201 });
  } catch (error) {
    console.error("Error adding projection to checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to add projection to checkpoint" },
      { status: 500 }
    );
  }
}
