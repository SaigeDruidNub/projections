import { Schema, model, models } from "mongoose";

export interface ICheckpointProjection {
  _id: string;
  checkpointId: string;
  projectionId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const CheckpointProjectionSchema = new Schema<ICheckpointProjection>(
  {
    checkpointId: { type: String, required: true, ref: "Checkpoint" },
    projectionId: { type: String, required: true, ref: "Projection" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CheckpointProjectionSchema.index(
  { checkpointId: 1, projectionId: 1 },
  { unique: true }
);

export const CheckpointProjection =
  models.CheckpointProjection ||
  model<ICheckpointProjection>(
    "CheckpointProjection",
    CheckpointProjectionSchema
  );
