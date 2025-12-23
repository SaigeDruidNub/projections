import { Schema, model, models } from "mongoose";

export interface IApproval {
  _id: string;
  checkpointProjectionId: string;
  userId: string;
  status: "approved" | "rejected";
  comment?: string;
  createdAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    checkpointProjectionId: {
      type: String,
      required: true,
      ref: "CheckpointProjection",
    },
    userId: { type: String, required: true, ref: "User" },
    status: { type: String, enum: ["approved", "rejected"], required: true },
    comment: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ApprovalSchema.index(
  { checkpointProjectionId: 1, userId: 1 },
  { unique: true }
);

export const Approval =
  models.Approval || model<IApproval>("Approval", ApprovalSchema);
