import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { Projection } from "@/lib/models/Projection";
import { Project } from "@/lib/models/Project";
import { User } from "@/lib/models/User";
import { ProjectionEmail } from "@/lib/models/ProjectionEmail";
import { sendEmail, generateProjectionShareEmail } from "@/lib/email";
import Papa from "papaparse";

export async function POST(
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
    const body = await request.json();
    const { userIds, message } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "At least one user must be selected" },
        { status: 400 }
      );
    }

    // Get projection details
    const projection = await Projection.findById(projectionId);
    if (!projection) {
      return NextResponse.json(
        { error: "Projection not found" },
        { status: 404 }
      );
    }

    // Get project details
    const project = await Project.findById(projection.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get sender details
    const sender = await User.findOne({ email: session.user.email });
    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recipient users
    const recipients = await User.find({ _id: { $in: userIds } });
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients found" },
        { status: 400 }
      );
    }

    // Generate the view link (assumes the projection is viewable via the project page)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const viewLink = `${baseUrl}/projects/${project._id}`;

    // Generate CSV attachment from projection data
    const projectionData = JSON.parse(projection.data);
    const csvContent = Papa.unparse(projectionData);
    const csvFilename = projection.filename || `${projection.name}.csv`;

    // Track successful and failed sends
    const emailResults: { success: number; failed: number } = {
      success: 0,
      failed: 0,
    };

    // Send email to each recipient
    const emailPromises = recipients.map(async (recipient) => {
      try {
        const emailContent = generateProjectionShareEmail({
          userName: recipient.name || recipient.email,
          senderName: sender.name || sender.email,
          projectName: project.name,
          projectionName: projection.name,
          viewLink,
          message,
        });

        await sendEmail({
          to: recipient.email,
          subject: emailContent.subject,
          html: emailContent.html,
          attachments: [
            {
              filename: csvFilename,
              content: csvContent,
              contentType: "text/csv",
            },
          ],
        });

        // Record successful email send
        await ProjectionEmail.create({
          projectionId: projection._id,
          recipientId: recipient._id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          sentBy: sender._id,
          sentByEmail: sender.email,
          sentByName: sender.name,
          message,
          emailStatus: "sent",
        });

        emailResults.success++;
      } catch (error: any) {
        console.error(`Failed to send email to ${recipient.email}:`, error);

        // Record failed email send
        await ProjectionEmail.create({
          projectionId: projection._id,
          recipientId: recipient._id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          sentBy: sender._id,
          sentByEmail: sender.email,
          sentByName: sender.name,
          message,
          emailStatus: "failed",
          errorMessage: error.message,
        });

        emailResults.failed++;
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      message: `Projection shared with ${emailResults.success} user(s)${
        emailResults.failed > 0 ? `, ${emailResults.failed} failed` : ""
      }`,
      success: emailResults.success,
      failed: emailResults.failed,
    });
  } catch (error: any) {
    console.error("Error sharing projection:", error);
    return NextResponse.json(
      { error: error.message || "Failed to share projection" },
      { status: 500 }
    );
  }
}
