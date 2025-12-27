import "dotenv/config";
import dbConnect from "../lib/mongodb";
import { Notification } from "../lib/models";

async function fixNotificationLinks() {
  try {
    console.log("Connecting to database...");
    await dbConnect();

    console.log("Finding notifications with approval requests...");
    const notifications = await Notification.find({
      type: "approval_request",
      link: { $regex: /^\/projects\/[a-f0-9]+$/ }, // Links without query params
    });

    console.log(`Found ${notifications.length} notifications to update`);

    if (notifications.length === 0) {
      console.log("No notifications need updating");
      process.exit(0);
    }

    // Update each notification
    for (const notification of notifications) {
      // Extract projection ID from message if available
      // Message format: "You have been requested to approve the projection "{name}" in project "{projectName}""

      // For now, we can't easily extract the projection ID from the existing data
      // So we'll just log them and let the user know to request new approvals
      console.log(`Notification ${notification._id}:`);
      console.log(`  Link: ${notification.link}`);
      console.log(`  Message: ${notification.message}`);
    }

    console.log("\nNote: Old notifications don't contain projection IDs.");
    console.log(
      "Request new approvals to create notifications with proper links."
    );
    console.log("Or manually mark old notifications as read.");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixNotificationLinks();
