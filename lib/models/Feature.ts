import { Schema, model, models } from "mongoose";

export interface IFeature {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  status: "pending" | "approved" | "in-progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema = new Schema<IFeature>(
  {
    projectId: { type: String, required: true, ref: "Project" },
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "in-progress", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

FeatureSchema.index({ projectId: 1 });

export const Feature =
  models.Feature || model<IFeature>("Feature", FeatureSchema);
