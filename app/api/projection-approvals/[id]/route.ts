import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { ProjectionApproval } from "@/lib/models";

// Update approval status (approve/reject)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, comment } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the approval and verify it belongs to the current user
    const approval = await ProjectionApproval.findById(id);

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found" },
        { status: 404 }
      );
    }

    if (approval.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own approvals" },
        { status: 403 }
      );
    }

    // Allow users to change their response at any time
    // Update the approval
    const updateData: any = {
      status,
      comment: comment || approval.comment,
    };

    if (status === "approved") {
      updateData.approvedAt = new Date();
      updateData.rejectedAt = undefined;
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
      updateData.approvedAt = undefined;
    }

    const updatedApproval = await ProjectionApproval.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json(updatedApproval);
  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}
