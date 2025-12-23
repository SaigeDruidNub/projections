import { Schema, model, models } from "mongoose";

export interface IProject {
  _id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdById: { type: String, required: true, ref: "User" },
  },
  {
    timestamps: true,
  }
);

export const Project =
  models.Project || model<IProject>("Project", ProjectSchema);
