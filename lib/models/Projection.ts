import { Schema, model, models } from "mongoose";

export interface IProjection {
  _id: string;
  projectId: string;
  name: string;
  data: string; // JSON string of CSV data
  filename?: string; // Original CSV filename
  rowCount?: number; // Number of rows in the CSV
  columnCount?: number; // Number of columns in the CSV
  isOverage?: boolean; // Whether this is an overage projection
  createdAt: Date;
  updatedAt: Date;
}

const ProjectionSchema = new Schema<IProjection>(
  {
    projectId: { type: String, required: true, ref: "Project" },
    name: { type: String, required: true },
    data: { type: String, required: true },
    filename: { type: String },
    rowCount: { type: Number },
    columnCount: { type: Number },
    isOverage: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ProjectionSchema.index({ projectId: 1 });

export const Projection =
  models.Projection || model<IProjection>("Projection", ProjectionSchema);
