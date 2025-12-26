import { Schema, model, models } from "mongoose";

export interface IProjectionApproval {
  _id: string;
  projectionId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  requestNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectionApprovalSchema = new Schema<IProjectionApproval>(
  {
    projectionId: { type: String, required: true, ref: "Projection" },
    userId: { type: String, required: true, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    comment: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    requestNumber: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Index for querying, but not unique to allow multiple approval rounds
ProjectionApprovalSchema.index({ projectionId: 1, userId: 1 });

export const ProjectionApproval =
  models.ProjectionApproval ||
  model<IProjectionApproval>("ProjectionApproval", ProjectionApprovalSchema);
