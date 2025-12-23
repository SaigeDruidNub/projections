import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { Approval, CheckpointProjection } from "@/lib/models";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ checkpointProjectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkpointProjectionId } = await params;
    const body = await request.json();
    const { status, comment } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (approved/rejected) is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already approved/rejected this
    const existing = await Approval.findOne({
      checkpointProjectionId,
      userId: session.user.id,
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this projection" },
        { status: 400 }
      );
    }

    const approval = await Approval.create({
      checkpointProjectionId,
      userId: session.user.id,
      status,
      comment,
    });

    // Update checkpoint projection status if needed
    const approvals = await Approval.find({ checkpointProjectionId });
    const allApproved = approvals.every((a) => a.status === "approved");
    const anyRejected = approvals.some((a) => a.status === "rejected");

    if (anyRejected) {
      await CheckpointProjection.findByIdAndUpdate(checkpointProjectionId, {
        status: "rejected",
      });
    } else if (allApproved && approvals.length > 0) {
      await CheckpointProjection.findByIdAndUpdate(checkpointProjectionId, {
        status: "approved",
      });
    }

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Error submitting approval:", error);
    return NextResponse.json(
      { error: "Failed to submit approval" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkpointProjectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkpointProjectionId } = await params;
    await dbConnect();

    const approvals = await Approval.find({ checkpointProjectionId });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}
