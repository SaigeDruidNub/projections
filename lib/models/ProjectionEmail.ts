import { Schema, model, models } from "mongoose";

export interface IProjectionEmail {
  _id: string;
  projectionId: string;
  recipientId: string;
  recipientEmail: string;
  recipientName?: string;
  sentBy: string; // User ID who sent the email
  sentByEmail: string;
  sentByName?: string;
  message?: string; // Optional message included
  emailStatus: "sent" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectionEmailSchema = new Schema<IProjectionEmail>(
  {
    projectionId: { type: String, required: true, ref: "Projection" },
    recipientId: { type: String, required: true, ref: "User" },
    recipientEmail: { type: String, required: true },
    recipientName: { type: String },
    sentBy: { type: String, required: true, ref: "User" },
    sentByEmail: { type: String, required: true },
    sentByName: { type: String },
    message: { type: String },
    emailStatus: { 
      type: String, 
      enum: ["sent", "failed"], 
      default: "sent" 
    },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

ProjectionEmailSchema.index({ projectionId: 1, createdAt: -1 });
ProjectionEmailSchema.index({ recipientId: 1 });

export const ProjectionEmail =
  models.ProjectionEmail || model<IProjectionEmail>("ProjectionEmail", ProjectionEmailSchema);
