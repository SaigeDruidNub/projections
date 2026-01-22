import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import {
  ProjectionApproval,
  User,
  Notification,
  Projection,
  Project,
} from "@/lib/models";
import { sendEmail, generateApprovalRequestEmail } from "@/lib/email";

// Get approvals for a projection
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectionId } = await params;
    await dbConnect();

    const approvals = await ProjectionApproval.find({ projectionId }).sort({
      createdAt: -1,
    });

    // Get user details for each approval
    const userIds = approvals.map((a: any) => a.userId);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "name email image"
    );

    const approvalsWithUsers = approvals.map((approval: any) => {
      const user = users.find((u: any) => u._id.toString() === approval.userId);
      return {
        ...approval.toObject(),
        user,
      };
    });

    return NextResponse.json(approvalsWithUsers);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

// Request approvals from users
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectionId } = await params;
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get projection and project details for notifications
    const projection = await Projection.findById(projectionId);
    if (!projection) {
      return NextResponse.json(
        { error: "Projection not found" },
        { status: 404 }
      );
    }

    const project = await Project.findById(projection.projectId);
    const projectName = project?.name || "Unknown Project";

    // Find the highest request number for this projection
    const latestApprovals = await ProjectionApproval.find({ projectionId })
      .sort({ requestNumber: -1 })
      .limit(1);

    const nextRequestNumber =
      latestApprovals.length > 0 && latestApprovals[0].requestNumber
        ? latestApprovals[0].requestNumber + 1
        : 1;

    // Create new approval requests for all specified users with the new request number
    const newApprovals = await Promise.all(
      userIds.map((userId: string) =>
        ProjectionApproval.create({
          projectionId,
          userId,
          status: "pending",
          requestNumber: nextRequestNumber,
        })
      )
    );

    const approvals = newApprovals;

    // Get user details for notifications
    const users = await User.find({ _id: { $in: userIds } }).select(
      "name email"
    );

    // Send notifications to all users for this new approval request
    // Always use production URL for email links
    const baseUrl = "https://projections-tawny.vercel.app";
    const approvalLink = `${baseUrl}/projects/${projection.projectId}?tab=approvals&projection=${projectionId}`;

    await Promise.all(
      users.map(async (user: any) => {
        const notificationLink = `/projects/${projection.projectId}?tab=approvals&projection=${projectionId}`;
        
        // Create in-app notification
        await Notification.create({
          userId: user._id,
          type: "approval_request",
          title: "New Approval Request",
          message: `You have been requested to approve the projection "${projection.name}" in project "${projectName}"`,
          link: notificationLink,
        });

        // Send email notification
        try {
          const emailContent = generateApprovalRequestEmail({
            userName: user.name || user.email,
            projectName,
            projectionName: projection.name,
            approvalLink,
          });

          await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          // Don't fail the request if email fails
        }
      })
    );

    return NextResponse.json(approvals, { status: 201 });
  } catch (error) {
    console.error("Error creating approvals:", error);
    return NextResponse.json(
      { error: "Failed to create approvals" },
      { status: 500 }
    );
  }
}
