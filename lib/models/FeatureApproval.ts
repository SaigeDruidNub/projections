import { Schema, model, models } from "mongoose";

export interface IFeatureApproval {
  _id: string;
  featureId: string;
  userId: string;
  status: "approved" | "rejected";
  comment?: string;
  createdAt: Date;
}

const FeatureApprovalSchema = new Schema<IFeatureApproval>(
  {
    featureId: { type: String, required: true, ref: "Feature" },
    userId: { type: String, required: true, ref: "User" },
    status: { type: String, enum: ["approved", "rejected"], required: true },
    comment: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

FeatureApprovalSchema.index({ featureId: 1, userId: 1 }, { unique: true });

export const FeatureApproval =
  models.FeatureApproval ||
  model<IFeatureApproval>("FeatureApproval", FeatureApprovalSchema);
