import { Schema, model, models } from "mongoose";

export interface ICheckpoint {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  createdAt: Date;
}

const CheckpointSchema = new Schema<ICheckpoint>(
  {
    projectId: { type: String, required: true, ref: "Project" },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CheckpointSchema.index({ projectId: 1, order: 1 });

export const Checkpoint =
  models.Checkpoint || model<ICheckpoint>("Checkpoint", CheckpointSchema);
