import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { FeatureApproval, Feature } from "@/lib/models";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureId } = await params;
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
    const existing = await FeatureApproval.findOne({
      featureId,
      userId: session.user.id,
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this feature" },
        { status: 400 }
      );
    }

    const approval = await FeatureApproval.create({
      featureId,
      userId: session.user.id,
      status,
      comment,
    });

    // Update feature status if needed
    const approvals = await FeatureApproval.find({ featureId });
    const allApproved = approvals.every((a) => a.status === "approved");
    const anyRejected = approvals.some((a) => a.status === "rejected");

    if (anyRejected) {
      // Keep as pending if rejected
      await Feature.findByIdAndUpdate(featureId, { status: "pending" });
    } else if (allApproved && approvals.length > 0) {
      await Feature.findByIdAndUpdate(featureId, { status: "approved" });
    }

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Error submitting feature approval:", error);
    return NextResponse.json(
      { error: "Failed to submit approval" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureId } = await params;
    await dbConnect();

    const approvals = await FeatureApproval.find({ featureId });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error fetching feature approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}
