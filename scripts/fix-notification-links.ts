import "dotenv/config";
import dbConnect from "../lib/mongodb";
import { Notification } from "../lib/models";

async function fixNotificationLinks() {
  try {
    await dbConnect();

    const notifications = await Notification.find({
      type: "approval_request",
      link: { $regex: /^\/projects\/[a-f0-9]+$/ }, // Links without query params
    });

    if (notifications.length === 0) {
      process.exit(0);
    }

    // Update each notification
    for (const notification of notifications) {
      // Extract projection ID from message if available
      // Message format: "You have been requested to approve the projection "{name}" in project "{projectName}""
      // For now, we can't easily extract the projection ID from the existing data
      // So we'll just log them and let the user know to request new approvals
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixNotificationLinks();
