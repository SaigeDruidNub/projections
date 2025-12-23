import { Schema, model, models } from "mongoose";

export interface INotification {
  _id: string;
  userId: string;
  type: "approval_request" | "approval_approved" | "approval_rejected";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, ref: "User" },
    type: {
      type: String,
      enum: ["approval_request", "approval_approved", "approval_rejected"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification =
  models.Notification ||
  model<INotification>("Notification", NotificationSchema);
